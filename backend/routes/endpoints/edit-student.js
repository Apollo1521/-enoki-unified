import { prisma } from "../../lib/prisma.js";

export default async (req, res) => {
  const { id, name, email, studentId, studentRfidHash, courseId } = req.body;
  if (
    !id.trim() ||
    !name.trim() ||
    !email.trim() ||
    !studentId.trim() ||
    !studentRfidHash.trim() ||
    !courseId.trim()
  ) {
    return res.status(400).json({ code: "PARAMETERS_INCOMPLETE" });
  }

  try {
    await prisma.enokiAcct.update({
      where: {
        studentId: id,
      },
      data: {
        name,
        email,
      },
    });

    await prisma.student.update({
      where: {
        id: id,
      },
      data: {
        studentId,
        studentRfidHash: studentRfidHash.trim().toUpperCase(),
        course: {
          connect: {
            id: courseId,
          },
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, error: error.message });
  }
};
