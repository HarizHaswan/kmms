const express = require("express");
const router = express.Router();
const {
  getAttendance,
  saveAttendance,
  getMonthlyStats,
  getStudentAttendance,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");

// Existing routes
router.get("/", protect, getAttendance);
router.post("/", protect, saveAttendance);
router.get("/stats", protect, getMonthlyStats);

// NEW: get a single student's attendance status for a given date
// Used by the parent dashboard card
router.get("/student/:studentId", protect, getStudentAttendance);

module.exports = router;