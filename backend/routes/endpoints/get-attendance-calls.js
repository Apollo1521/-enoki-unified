import { prisma } from "../../lib/prisma.js";

const getAttendanceCalls = async (req, res) => {
  const { id } = req.body;

  try {
    const attendanceList = await prisma.callTeacher.findMany({
      where: {
        teacher: {
          enokiAcct: {
            id,
          },
        },
        callType: "NOTIFY",
      },
      orderBy: {
        calledAt: "desc",
      },
      include: {
        student: {
          select: {
            enokiAcct: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(attendanceList);

    return res.status(200).json({
      list: attendanceList,
    });
  } catch (e) {
    return res.status(500).json({
      error: e.message,
    });
  }
};

export default getAttendanceCalls;
