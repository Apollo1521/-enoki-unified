import { prisma } from "../../lib/prisma.js";

export default async function getStudentCallHistory(req, res) {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ code: "PARAMETERS_INCOMPLETE" });
  }

  try {
    const history = await prisma.callTeacher.findMany({
      where: {
        studentId: id,
      },
      select: {
        attended: true,
        callType: true,
        studentId: true,
        calledAt: true,
        teacher: {
          select: {
            enokiAcct: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        student: {
          select: {
            enokiAcct: {
              select: {
                name: true,
              },
            },
            course: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        calledAt: "desc",
      },
    });
    console.log(history);
    return res.status(200).json({ history });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ code: "SERVER_ERROR" });
  }
}
