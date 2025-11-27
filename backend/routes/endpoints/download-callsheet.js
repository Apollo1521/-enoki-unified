import { prisma } from "../../lib/prisma.js";
import * as XLSX from "xlsx";

export default async function downloadCallsheet(req, res) {
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
      },
      select: {
        callType: true,
        attended: true,
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

    console.log(calls);

    // Transform data for Excel export
    const worksheetData = calls.map((call, index) => ({
      "No.": index + 1,
      "Call Type": call.callType || "N/A",
      Attended:
        call.callType === "NOTIFY" ? (call.attended ? "Yes" : "No") : "N/A",
      "Teacher Name": call.teacher?.enokiAcct?.name || "N/A",
      Department: call.teacher?.department?.name || "N/A",
      "Student Name": call.student?.enokiAcct?.name || "N/A",
      Course: call.student?.course?.name || "N/A",
      "Called At": new Date(call.calledAt).toLocaleString(),
      "Call ID": call.id,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Set column widths
    const columnWidths = [
      { wch: 5 }, // No.
      { wch: 15 }, // Call Type
      { wch: 15 }, // Attended
      { wch: 25 }, // Teacher Name
      { wch: 20 }, // Department
      { wch: 25 }, // Student Name
      { wch: 20 }, // Course
      { wch: 25 }, // Called At
      { wch: 15 }, // Call ID
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Calls");

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `student-calls-${timestamp}.xlsx`;

    // Write workbook to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", excelBuffer.length);

    return res.send(excelBuffer);
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      code: "SERVER_ERROR",
    });
  }
}
