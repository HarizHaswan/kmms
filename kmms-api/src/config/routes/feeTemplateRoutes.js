const express = require("express");
const router = express.Router();

const {
  getFeeTemplates,
  createFeeTemplate,
  updateFeeTemplate,
  deleteFeeTemplate,
} = require("../controllers/feeTemplateController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin"), getFeeTemplates);
router.post("/", protect, authorize("admin"), createFeeTemplate);
router.put("/:id", protect, authorize("admin"), updateFeeTemplate);
router.delete("/:id", protect, authorize("admin"), deleteFeeTemplate);

module.exports = router;
