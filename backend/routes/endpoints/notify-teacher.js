import { enokiLedSystems, socketsConnected } from "../../index.js";
import sendPushNotification from "../../lib/expoSend.js";
import { prisma } from "../../lib/prisma.js";
import { emitToAll, emitToSocket } from "../../lib/socket.js";

export default async function notifyTeacher(req, res) {
  const { studentId, recipientId } = req.body;

  if (!studentId || !recipientId) {
    return res
      .status(400)
      .json({ success: false, error: "PARAMETERS_INCOMPLETE" });
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
      },
      include: {
        enokiAcct: true,
        course: true,
      },
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "STUDENT_NOT_FOUND" });
    }
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: recipientId,
      },
      include: {
        enokiAcct: true,
        notificationLED: {
          include: {
            enokiLEDSystem: true,
          },
        },
      },
    });

    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, error: "TEACHER_NOT_FOUND" });
    }
    await prisma.callTeacher.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        institutionId: student.enokiAcct.institutionId,
        callType: "NOTIFY",
      },
    });

    await prisma.student.update({
      where: {
        id: student.id,
      },
      data: {
        lastCall: new Date(),
      },
    });

    const socketId = socketsConnected.get(teacher.enokiAcct.id);
    if (socketId) {
      emitToSocket(socketId, "sig", { type: "MESSAGE-SENT" });
    }
    emitToAll("sig", { type: "DSH-MESSAGE" });
    if (teacher.pushNotificationToken) {
      await sendPushNotification(
        teacher.pushNotificationToken,
        `Notification Alert`,
        `${student.enokiAcct.name} is waiting outside`,
        "notification"
      );
    }

    if (teacher.notificationLED) {
      if (
        !enokiLedSystems.has(teacher.notificationLED.enokiLEDSystem.deviceSID)
      )
        return;

      console.log("Turning on LED");

      const newLEDSystemState =
        (teacher.notificationLED.enokiLEDSystem.currentState |=
          1 << teacher.notificationLED.idx);
      await prisma.enokiLEDSystem.update({
        where: {
          deviceSID: teacher.notificationLED.enokiLEDSystem.deviceSID,
        },
        data: {
          currentState: newLEDSystemState,
        },
      });
      console.log("LED Turned on");

      enokiLedSystems
        .get(teacher.notificationLED.enokiLEDSystem.deviceSID)
        .send(
          JSON.stringify({
            type: "update",
            state: newLEDSystemState,
          })
        );
      console.log("Turning off LED");
      setTimeout(async () => {
        const val = await prisma.enokiLEDSystem.findUnique({
          where: {
            deviceSID: teacher.notificationLED.enokiLEDSystem.deviceSID,
          },
          select: {
            currentState: true,
          },
        }); // race condition prevention

        const disablingState = (val.currentState &= ~(
          1 << teacher.notificationLED.idx
        ));
        await prisma.enokiLEDSystem.update({
          where: {
            deviceSID: teacher.notificationLED.enokiLEDSystem.deviceSID,
          },
          data: {
            currentState: disablingState,
          },
        });
        console.log("LED Turned off");
        enokiLedSystems
          .get(teacher.notificationLED.enokiLEDSystem.deviceSID)
          .send(
            JSON.stringify({
              type: "update",
              state: disablingState,
            })
          );
      }, parseInt(process.env.ENOKI_LED_SYSTEM_TIMEOUT));
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: "SERVER_ERROR" });
  }
}
