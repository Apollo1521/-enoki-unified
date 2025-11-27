import { prisma } from "../../lib/prisma.js";

export default async function getStudentCalls(req, res) {
  const { institutionId } = req.body;

  if (!institutionId) {
    return res.status(400).json({
      code: "MISSING_INSTITUTION_ID",
    });
  }

  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const calls = await prisma.callTeacher.findMany({
      where: {
        institutionId,
        calledAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        attended: true,
        callType: true,
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
        calledAt: true,
        id: true,
      },
      orderBy: {
        calledAt: "desc",
      },
    });

    return res.status(200).json({
      calls,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      code: "SERVER_ERROR",
    });
  }
}
