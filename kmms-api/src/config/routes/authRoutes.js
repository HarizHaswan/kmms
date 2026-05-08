const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// MERGE ALL IMPORTS INTO ONE LINE HERE:
const { 
  registerUser, 
  loginUser, 
  getMe, 
  updatePassword,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resettoken", resetPassword);
router.get("/me", protect, getMe);

// Update Password Route
router.put("/update-password", protect, updatePassword);

module.exports = router;