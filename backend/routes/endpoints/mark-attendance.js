import { prisma } from "../../lib/prisma.js";

const markAttendance = async (req, res) => {
  const { callId, attended } = req.body;

  if (!callId) {
    return res.status(400).json({
      success: false,
      error: "PARAMETERS_INCOMPLETE",
    });
  }

  try {
    await prisma.callTeacher.update({
      where: {
        id: callId,
      },
      data: {
        attended: attended,
      },
    });
    res.send("OK");
  } catch (e) {
    return res.status(400).json({
      success: false,
      error: "SERVER_ERROR",
    });
  }
};

export default markAttendance;
