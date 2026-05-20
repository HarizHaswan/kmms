const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️ Cloudinary integration active");
} else {
  console.log("📁 Cloudinary credentials not found. Falling back to local disk storage.");
}

// Multer Storage Configuration (uses memory buffer so we can direct-upload to Cloudinary or write to local disk as fallback)
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, customFilename) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: "auto", // Automatically detects images, pdfs, videos, etc.
    };
    if (customFilename) {
      uploadOptions.public_id = customFilename.split(".")[0]; // remove extension
    }
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Local storage fallback configuration
const localProfileFolder = "uploads/profile";
const localAttachmentFolder = "uploads/attachments";

if (!fs.existsSync(localProfileFolder)) {
  fs.mkdirSync(localProfileFolder, { recursive: true });
}
if (!fs.existsSync(localAttachmentFolder)) {
  fs.mkdirSync(localAttachmentFolder, { recursive: true });
}

// PROFILE PICTURE UPLOAD
router.post("/profile", protect, uploadMemory.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let fileUrl = "";

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary
      const folderName = "kmms/profiles";
      const customFilename = `${req.user._id}_profile_${Date.now()}`;
      const result = await uploadToCloudinary(req.file.buffer, folderName, customFilename);
      fileUrl = result.secure_url;
    } else {
      // Fallback: Local Disk Storage
      const ext = path.extname(req.file.originalname);
      const filename = `${req.user._id}_${Date.now()}${ext}`;
      const localPath = path.join(localProfileFolder, filename);
      fs.writeFileSync(localPath, req.file.buffer);
      fileUrl = `/uploads/profile/${filename}`;
    }

    user.profileImage = fileUrl;
    await user.save();

    res.json({
      message: "Profile picture updated successfully",
      imageUrl: fileUrl,
    });
  } catch (err) {
    console.error("Profile upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ATTACHMENT UPLOAD
router.post("/attachment", protect, uploadMemory.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let fileUrl = "";

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary
      const folderName = "kmms/attachments";
      const customFilename = `attachment_${Date.now()}`;
      const result = await uploadToCloudinary(req.file.buffer, folderName, customFilename);
      fileUrl = result.secure_url;
    } else {
      // Fallback: Local Disk Storage
      const ext = path.extname(req.file.originalname);
      const filename = `attachment_${Date.now()}${ext}`;
      const localPath = path.join(localAttachmentFolder, filename);
      fs.writeFileSync(localPath, req.file.buffer);
      fileUrl = `/uploads/attachments/${filename}`;
    }

    res.json({
      message: "File uploaded successfully",
      url: fileUrl,
    });
  } catch (err) {
    console.error("Attachment upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
