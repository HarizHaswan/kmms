const User = require("../models/User");

// GET all teachers
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD teacher
exports.createTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      classAssigned,
      qualification,
      hireDate,
      epfNo,
      taxNo,
      status,
      icNumber,
    } = req.body;

    // 1. Sanitize Inputs (Remove spaces, force lowercase email)
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    // 2. Check if email exists
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 3. Create Teacher (User Model handles hashing)
    const teacher = await User.create({
      name,
      email: cleanEmail,
      password: cleanPassword, // The User model will hash this automatically
      role: "teacher",
      phone,
      classAssigned,
      qualification,
      hireDate,
      epfNo,
      taxNo,
      icNumber,
      salaryProfile: req.body.salaryProfile || {},
      status: status || "Active",
    });

    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE teacher
exports.updateTeacher = async (req, res) => {
  try {
    // Note: This does NOT update password currently. 
    // If you need to update password, use .save() instead of findByIdAndUpdate
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE teacher
exports.deleteTeacher = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Teacher removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};