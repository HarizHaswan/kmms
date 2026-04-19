const ProgressReport = require("../models/ProgressReport");
const Student = require("../models/Student");
const Class = require("../models/Class");

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveScopedStudentIds(user) {
  const role = String(user?.role || "").toLowerCase();

  if (role === "parent") {
    const children = await Student.find({ parentId: user._id }).select("_id");
    return children.map((student) => student._id.toString());
  }

  if (role === "teacher") {
    if (!user.classAssigned) return [];

    const classDoc = await Class.findOne({
      className: { $regex: `^${escapeRegex(String(user.classAssigned).trim())}$`, $options: "i" },
    }).select("_id");

    if (!classDoc) return [];

    const students = await Student.find({ classId: classDoc._id }).select("_id");
    return students.map((student) => student._id.toString());
  }

  return null;
}

async function ensureStudentAccess(user, studentId) {
  const scopedStudentIds = await resolveScopedStudentIds(user);
  if (scopedStudentIds === null) return true;
  return scopedStudentIds.includes(String(studentId));
}

async function populateReportQuery(query) {
  return query
    .populate({
      path: "studentId",
      select: "name status classId",
      populate: {
        path: "classId",
        select: "className yearGroup",
      },
    })
    .populate("teacherId", "name")
    .sort({ createdAt: -1 });
}

// GET all progress reports
exports.getProgressReports = async (req, res, next) => {
  try {
    const query = {};
    const scopedStudentIds = await resolveScopedStudentIds(req.user);

    if (Array.isArray(scopedStudentIds)) {
      query.studentId = { $in: scopedStudentIds };
    }

    const reports = await populateReportQuery(ProgressReport.find(query));
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

// GET report by ID
exports.getProgressReport = async (req, res, next) => {
  try {
    const report = await ProgressReport.findById(req.params.id)
      .populate({
        path: "studentId",
        select: "name status classId",
        populate: {
          path: "classId",
          select: "className yearGroup",
        },
      })
      .populate("teacherId", "name");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const hasAccess = await ensureStudentAccess(req.user, report.studentId?._id || report.studentId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this report" });
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// CREATE report
exports.createProgressReport = async (req, res, next) => {
  try {
    const { studentId, summary } = req.body;
    const role = String(req.user?.role || "").toLowerCase();

    const hasAccess = await ensureStudentAccess(req.user, studentId);
    if (!hasAccess) {
      return res.status(403).json({ message: "You can only create reports for your assigned students" });
    }

    const payload = {
      studentId,
      summary,
      teacherId: role === "teacher" ? req.user._id : req.body.teacherId || req.user._id,
    };

    const newReport = await ProgressReport.create(payload);
    const populated = await ProgressReport.findById(newReport._id)
      .populate({
        path: "studentId",
        select: "name status classId",
        populate: {
          path: "classId",
          select: "className yearGroup",
        },
      })
      .populate("teacherId", "name");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// UPDATE report
exports.updateProgressReport = async (req, res, next) => {
  try {
    const report = await ProgressReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const targetStudentId = req.body.studentId || report.studentId;
    const hasAccess = await ensureStudentAccess(req.user, targetStudentId);

    if (!hasAccess) {
      return res.status(403).json({ message: "You can only update reports for your assigned students" });
    }

    if (req.body.studentId) report.studentId = req.body.studentId;
    if (req.body.summary !== undefined) report.summary = req.body.summary;

    await report.save();

    const populated = await ProgressReport.findById(report._id)
      .populate({
        path: "studentId",
        select: "name status classId",
        populate: {
          path: "classId",
          select: "className yearGroup",
        },
      })
      .populate("teacherId", "name");

    res.json(populated);
  } catch (err) {
    next(err);
  }
};

// DELETE report
exports.deleteProgressReport = async (req, res, next) => {
  try {
    const deleted = await ProgressReport.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Report not found" });

    res.json({ message: "Report deleted" });
  } catch (err) {
    next(err);
  }
};
