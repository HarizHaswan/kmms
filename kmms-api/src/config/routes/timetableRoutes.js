const express = require("express");
const router = express.Router();

const {
  createTimetable,
  getTimetableByClass,
  getTeacherTimetable,
  getParentTimetable,
  getParentTimetableToday,
  deleteTimetable,
} = require("../controllers/timetableController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ADMIN
router.post("/", protect, authorize("admin"), createTimetable);
router.get("/", protect, authorize("admin"), getTimetableByClass);
router.delete("/:id", protect, authorize("admin"), deleteTimetable);

// TEACHER
router.get("/teacher", protect, authorize("teacher"), getTeacherTimetable);

// PARENT (full week — same grid data as teacher class timetable)
router.get("/parent", protect, authorize("parent"), getParentTimetable);
router.get("/parent/today", protect, authorize("parent"), getParentTimetableToday);

module.exports = router;
