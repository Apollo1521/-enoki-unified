import { prisma } from "../../lib/prisma.js";

export default async function deleteMessage(req, res) {
  const { messageId } = req.body;

  if (!messageId) {
    return res.status(400).json({
      code: "MISSING_MESSAGE_ID",
    });
  }

  try {
    const msg = await prisma.callTeacher.update({
      where: {
        id: messageId,
      },
      data: {
        isDeleted: true,
        message: "",
      },
    });

    if (!msg) {
      return res.sendStatus(200); //ignore
    }

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: "SERVER_ERROR",
    });
  }
}
