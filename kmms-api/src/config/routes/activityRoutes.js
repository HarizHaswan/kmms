const express = require("express");
const router = express.Router();

const {
  getActivities,
  addActivity,
  blastActivity,
  deleteActivity,
} = require("../controllers/activityController");

const { protect, authorize } = require("../middleware/authMiddleware");

// =============================
// GET /api/activities
// Admin → sees all activities
// Teacher → sees only their class's activities
// Parent → sees only their child's activities
// =============================
router.get("/", protect, authorize("admin", "teacher", "parent"), getActivities);

// =============================
// POST /api/activities
// Teacher only → record single student activity
// =============================
router.post("/", protect, authorize("teacher"), addActivity);

// =============================
// POST /api/activities/blast
// Teacher only → blast activity to all students in class
// =============================
router.post("/blast", protect, authorize("teacher"), blastActivity);

// =============================
// DELETE /api/activities/:id
// Admin or Teacher → delete activity
// =============================
router.delete("/:id", protect, authorize("admin", "teacher"), deleteActivity);

module.exports = router;
