import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import master from "./routes/master.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { emitToAll, emitToSocket, initSocket } from "./lib/socket.js";
import cron from "node-cron";
import { prisma } from "./lib/prisma.js";
import moment from "moment";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { WebSocketServer } from "ws";

let port = null;
let parser = null;
let reconnectTimer = null;

const PORT_PATH = process.env.RFID_PORT_PATH;
const BAUD_RATE = 115200;

const scheduleReconnect = (delay = 2000) => {
  if (reconnectTimer) return; // avoid multiple timers
  console.log(`[RFID Trace] - Retrying in ${delay / 1000}s...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    openPort();
  }, delay);
};

const setupParser = () => {
  parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
  parser.on("data", (data) => {
    let rfidBuf = data.split(" ").map((el) => el.replace(/\r/, ""));
    const tag = rfidBuf.shift();
    const result = rfidBuf.join(" ");

    if (tag === "[ENOKI-RFID-SIG]") {
      console.log("[RFID Trace] - Emission complete.", result);
      emitToAll("sig", { type: "RFID-READ", data: result, dest: "KIOSK" });
    }
  });
};

const openPort = () => {
  console.log(`[RFID Trace] - Attempting to open ${PORT_PATH}...`);
  port = new SerialPort({
    path: PORT_PATH,
    baudRate: BAUD_RATE,
    autoOpen: false,
  });

  port.open((err) => {
    if (err) {
      console.log("[RFID Trace] - Failed to open port:", err.message);
      scheduleReconnect();
      return;
    }
    console.log("[RFID Trace] - RFID port opened successfully!");
  });

  port.once("open", () => {
    console.log("[RFID Trace] - Connected to E-Noki RFID Onboard Reader");
    setupParser();
  });

  port.once("close", () => {
    console.log("[RFID Trace] - RFID port closed");
    cleanupPort();
    scheduleReconnect();
  });

  port.once("error", (err) => {
    console.log("[RFID Trace] - Port error:", err.message);
    cleanupPort();
    scheduleReconnect();
  });
};

const cleanupPort = () => {
  try {
    if (parser) {
      parser.removeAllListeners();
      parser = null;
    }
    if (port) {
      port.removeAllListeners();
      if (port.isOpen) port.close();
      port = null;
    }
  } catch (e) {
    console.log("[RFID Trace] - Cleanup error:", e);
  }
};

openPort();

const app = express();
const server = createServer(app);

const corsInstance = cors({
  origin: process.env.ORIGIN,
  credentials: true,
});

app.use((req, res, next) => {
  console.log("Incoming request", req.method, req.url);
  next();
});

app.use(corsInstance);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(`/api/${process.env.VERSION}`, master);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initSocket(io);

export const socketsConnected = new Map();

io.on("connection", (socket) => {
  if (socket.handshake.auth?.id) {
    socketsConnected.set(socket.handshake.auth.id, socket.id);
  }
  socket.on("disconnect", () => {
    socketsConnected.delete(socket.id);
  });
});

const native__wss = new WebSocketServer({ noServer: true });

export let enokiLedSystems = new Map();
const firstSetupEnokiLedSystem = async (dx) => {
  const ledSystem = await prisma.enokiLEDSystem.findUnique({
    where: {
      deviceSID: dx.deviceSID,
    },
  });

  if (ledSystem) {
    console.log("E-Noki LED System already provisioned!", dx.name);
    console.log("Updating current state...");

    await prisma.enokiLEDSystem.update({
      where: {
        deviceSID: dx.deviceSID,
      },
      data: {
        currentState: dx.currentState,
        physicalLeds: {
          updateMany: dx.ledArray.map((led) => ({
            where: { ledUq: led.ledUq },
            data: {
              color: led.color,
              idx: led.idx,
            },
          })),
        },
      },
    });
    return;
  }

  const institution = await prisma.institution.findUnique({
    where: {
      id: dx.institutionId,
    },
  });

  if (!institution) {
    console.log("Institution not found!", dx.institutionId);
    throw new Error("Institution not found!");
  }

  await prisma.enokiLEDSystem.create({
    data: {
      deviceSID: dx.deviceSID,
      name: dx.name,
      institutionId: institution.id,
      physicalLeds: {
        createMany: {
          data: dx.ledArray.map((led) => ({
            ledUq: led.ledUq,
            color: led.color,
            idx: led.idx,
          })),
        },
      },
      currentState: dx.currentState,
    },
  });

  console.log("E-Noki LED System provisioned successfully!", dx.name);
};

native__wss.on("connection", (ws) => {
  console.log("ESP connected via native WebSocket");

  let deviceSID = null;
  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg);
      switch (data?.type) {
        case "init":
          await firstSetupEnokiLedSystem(data)
            .catch((e) => {
              ws.terminate();
            })
            .then((d) => {
              deviceSID = data.deviceSID;
              enokiLedSystems.set(deviceSID, ws);
            });
          break;
      }
    } catch (err) {
      console.error("Failed to parse message from ESP:", msg);
    }
  });

  ws.on("close", () => {
    console.log("ESP disconnected");
    enokiLedSystems.delete(deviceSID);
  });
});

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/esp") {
    native__wss.handleUpgrade(req, socket, head, (ws) => {
      native__wss.emit("connection", ws, req);
    });
  }
});

server.listen(process.env.PORT, () => {
  console.log("App is listening at PORT", process.env.PORT);
});

cron.schedule("* * * * *", async () => {
  // run every 5m
  console.log("[E-Noki Periodic Check] - Checking for teachers");

  const tstat = await prisma.teacherStatistics.findMany({
    where: {
      status: "IN_CLASS",
    },
    select: {
      id: true,
      status: true,
      teacher: {
        select: {
          schedule: true,
          enokiAcct: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  for (const stat of tstat) {
    const { teacher } = stat;
    const socketId = socketsConnected.get(stat.teacher.enokiAcct.id);

    const __todayIdx = (moment().isoWeekday() - 1) % 7;
    const currentSchedule = teacher.schedule[__todayIdx];

    if (currentSchedule.dayOff) {
      await prisma.teacherStatistics.update({
        where: {
          id: stat.id,
        },
        data: {
          status: "OUT",
        },
      });

      if (socketId) {
        emitToSocket(socketId, "sig", { type: "STATUS-CHANGE-SCANNER" });
      }
      emitToAll("sig", { type: "STATUS-CHANGE", data: null });
      continue;
    }

    const nowClass = currentSchedule.classTimes.find((classTime) =>
      moment().isBetween(
        moment().startOf("day").add(classTime.cS, "seconds"),
        moment().startOf("day").add(classTime.cE, "seconds")
      )
    );

    if (nowClass) {
      await prisma.teacherStatistics.update({
        where: {
          id: stat.id,
        },
        data: {
          status: "IN_CLASS",
        },
      });

      if (socketId) {
        emitToSocket(socketId, "sig", { type: "STATUS-CHANGE-SCANNER" });
      }
      emitToAll("sig", { type: "STATUS-CHANGE", data: null });
      continue;
    }

    await prisma.teacherStatistics.update({
      where: {
        id: stat.id,
      },
      data: {
        status: "OUT",
      },
    });

    if (socketId) {
      emitToSocket(socketId, "sig", { type: "STATUS-CHANGE-SCANNER" });
    }
    emitToAll("sig", { type: "STATUS-CHANGE", data: null });
  }
});
