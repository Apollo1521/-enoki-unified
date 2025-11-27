import express from "express";

// Student endpoints
import addStudent from "./endpoints/add-student.js";
import editStudent from "./endpoints/edit-student.js";
import deleteStudent from "./endpoints/delete-student.js";
import getStudents from "./endpoints/get-students.js";

// Department endpoints
import createDepartment from "./endpoints/create-department.js";
import editDepartment from "./endpoints/edit-department.js";
import deleteDepartment from "./endpoints/delete-department.js";
import getDepartments from "./endpoints/get-departments.js";

// Teacher endpoints
import addTeacher from "./endpoints/add-teacher.js";
import editTeacher from "./endpoints/edit-teacher.js";
import deleteTeacher from "./endpoints/delete-teacher.js";
import getTeachers from "./endpoints/get-teachers.js";

// Course endpoints
import createCourse from "./endpoints/create-course.js";
import editCourse from "./endpoints/edit-course.js";
import deleteCourse from "./endpoints/delete-course.js";
import getCourses from "./endpoints/get-courses.js";
import createInstitution from "./endpoints/create-institution.js";
import rfidCatcher from "./endpoints/rfid-catcher.js";
import { login } from "./endpoints/login.js";
import rehydrate from "./endpoints/rehydrate.js";
import joinInstitution from "./endpoints/join-institution.js";
import getUsersInst from "./endpoints/get-users-inst.js";
import changeStatus from "./endpoints/change-status.js";
import checkRfid from "./endpoints/check-rfid.js";
import changeAcct from "./endpoints/change-acct.js";
import checkEmail from "./endpoints/check-email.js";
import checkStudentId from "./endpoints/check-studentId.js";
import deleteAccount from "./endpoints/delete-account.js";
import logout from "./endpoints/logout.js";
import getStudentInf_id from "./endpoints/getStudentInf_id.js";
import sendMessage from "./endpoints/sendMessage.js";
import appLogin from "./endpoints/applogin.js";
import appGetUserData from "./endpoints/appGetUserData.js";
import getMessages from "./endpoints/get-messages.js";
import deleteMessage from "./endpoints/delete-message.js";
import markAsRead from "./endpoints/mark-as-read.js";
import appendPushNotificationToken from "./endpoints/append-push-notification-token.js";
import appLogout from "./endpoints/appLogout.js";
import getStudentCalls from "./endpoints/get-student-calls.js";
import getStudentCallHistory from "./endpoints/get-student-call-history.js";
import notifyTeacher from "./endpoints/notify-teacher.js";
import inSens from "./endpoints/in-sens.js";
import outSens from "./endpoints/out-sens.js";
import getEnokiLedSystem from "./endpoints/get-enokiLedSystem.js";
import linkLedToTeacher from "./endpoints/link-led-to-teacher.js";
import onboardPassword from "./endpoints/onboard-password.js";
import downloadCallsheet from "./endpoints/download-callsheet.js";
import getAttendanceList from "./endpoints/get-attendance-calls.js";
import getAttendanceCalls from "./endpoints/get-attendance-calls.js";
import markAttendance from "./endpoints/mark-attendance.js";

const router = express.Router();

// Default route
router.get("/", (req, res) => {
  res.send("Hello World!");
});

// Authentication
router.post("/login", login);
router.post("/app-login", appLogin);
router.post("/rehydrate", rehydrate);
router.post("/app-get-userdata", appGetUserData);

// Send Message
router.post("/send-message", sendMessage);

// Get student info
router.post("/get-student-info", getStudentInf_id);

// RFID catcher route
router.post("/rfid-catcher", rfidCatcher);

// Change acct
router.post("/change-acct", changeAcct);

// Delete Account
router.post("/delete-account", deleteAccount);

// Change Stat
router.post("/change-status", changeStatus);

// Check RFID
router.post("/check-rfid", checkRfid);

// Check Email
router.post("/check-email", checkEmail);

// Logout
router.post("/logout", logout);

// Check Student ID
router.post("/check-studentId", checkStudentId);

// Delete Message
router.post("/delete-message", deleteMessage);

// Mark as read
router.post("/mark-as-read", markAsRead);

// Get messages
router.post("/get-teacher-messages", getMessages);

// Association PUSH NOTIF
router.post("/append-push-notification-token", appendPushNotificationToken);
router.post("/app-logout", appLogout);

// Institution route
router.post("/create-institution", createInstitution);
router.post("/join-institution", joinInstitution);
router.get("/get-users-institution", getUsersInst);

// Student routes
router.post("/add-student", addStudent);
router.post("/edit-student", editStudent);
router.post("/delete-student", deleteStudent);
router.get("/get-students", getStudents);

// Department routes
router.post("/create-department", createDepartment);
router.post("/edit-department", editDepartment);
router.post("/delete-department", deleteDepartment);
router.get("/get-departments", getDepartments);

// Teacher routes
router.post("/add-teacher", addTeacher);
router.post("/edit-teacher", editTeacher);
router.post("/delete-teacher", deleteTeacher);
router.get("/get-teachers", getTeachers);

// Course routes
router.post("/create-course", createCourse);
router.post("/edit-course", editCourse);
router.post("/delete-course", deleteCourse);
router.get("/get-courses", getCourses);

router.post("/get-student-calls", getStudentCalls);
router.post("/get-student-call-history", getStudentCallHistory);
router.post("/notify-teacher", notifyTeacher);

router.post("/in-sens", inSens);
router.post("/out-sens", outSens);

router.post("/get-enokiLedSystem", getEnokiLedSystem);
router.post("/link-led-to-teacher", linkLedToTeacher);

router.post("/onboarding-password", onboardPassword);
router.post("/export-callsheet", downloadCallsheet);
router.post("/get-attendance-calls", getAttendanceCalls);
router.post("/mark-attendance", markAttendance);

export default router;
