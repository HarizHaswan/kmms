const User = require("../models/User");
const generateToken = require("../../utils/generateToken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../services/emailService");

// REGISTER
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      password: password.trim(),
      role: role.toLowerCase(),
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      classAssigned: user.classAssigned,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// LOGIN
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    console.log("--- LOGIN ATTEMPT ---");
    
    const cleanEmail = email ? email.toLowerCase().trim() : "";
    const cleanPassword = password ? password.trim() : "";

    console.log("Email:", cleanEmail);

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("✅ User found:", user.email);
    console.log("🔑 Stored Hash ends with:", user.password.slice(-5)); // Log partial hash for safety

    // Match Password
    const isMatch = await user.matchPassword(cleanPassword);
    
    if (isMatch) {
      // Check Account Approval Status
      if (user.status === "Pending") {
        console.log("❌ Account pending approval");
        return res.status(401).json({ message: "Your account is pending approval by the administration. Please wait for confirmation." });
      }

      // Check Role
      if (role && user.role !== role.toLowerCase() && user.role !== role) {
         console.log("❌ Role mismatch");
         return res.status(401).json({ message: "Role mismatch" });
      }

      console.log("✅ Login Successful");
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classAssigned: user.classAssigned,
        childStudentId: user.childStudentId,
        token: generateToken(user._id),
      });
    } else {
      console.log("❌ Password mismatch");
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    next(err);
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "No user found with that email address" });
    }

    // 1. Create reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // 2. Hash and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // 4. Create reset URL
    // In production, this should be your frontend URL
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) has requested the reset of a password for your SmartKindy account.</p>
        <p>Please click on the button below to reset your password. This link is valid for 10 minutes only.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        
        <p style="font-size: 12px; color: #6b7280;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">© 2026 SmartKindy</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "SmartKindy - Password Reset Request",
        html: message,
      });

      res.status(200).json({ message: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (err) {
    next(err);
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res, next) => {
  try {
    // 1. Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // 2. Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful",
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

// --- NEW FUNCTION: UPDATE PASSWORD ---
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1. Get the user (req.user is set by the 'protect' middleware)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    // 3. Update to new password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Update Password Error:", err);
    res.status(500).json({ message: "Server error while updating password" });
  }
};