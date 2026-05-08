const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getPayrollRecords,
  generateMonthlyPayroll,
  updatePayrollRecord,
  markAsPaid,
  getPayrollStats,
  getMyPayslips,
} = require("../controllers/payrollController");

// Admin routes
router.get("/", protect, authorize("admin"), getPayrollRecords);
router.post("/generate", protect, authorize("admin"), generateMonthlyPayroll);
router.get("/stats", protect, authorize("admin"), getPayrollStats);
router.put("/:id", protect, authorize("admin"), updatePayrollRecord);
router.post("/:id/pay", protect, authorize("admin"), markAsPaid);

// Teacher routes
router.get("/my", protect, authorize("teacher"), getMyPayslips);

module.exports = router;
