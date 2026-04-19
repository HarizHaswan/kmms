const Timetable = require("../models/Timetable");
const Student = require("../models/Student");
const { createNotification } = require("../../utils/notificationHelper");

/** Resolve the child's class for a logged-in parent (childStudentId or first student by parentId). */
async function getClassIdForParentUser(parentUser) {
  let student = null;
  if (parentUser.childStudentId) {
    student = await Student.findById(parentUser.childStudentId);
  }
  if (!student) {
    student = await Student.findOne({ parentId: parentUser._id });
  }
  if (!student || !student.classId) return null;
  return student.classId;
}

/**
 * ADMIN — Create timetable slot
 */
exports.createTimetable = async (req, res) => {
  const {
    classId,
    day,
    subject,
    startTime,
    endTime,
    teacherId,
    color,
  } = req.body;

  const slot = await Timetable.create({
    classId,
    day,
    subject,
    startTime,
    endTime,
    teacherId,
    color,
    createdBy: req.user._id,
  });

  // Notify Teacher
  try {
    if (teacherId) {
      await createNotification({
        recipientId: teacherId,
        type: 'timetable',
        title: 'Timetable Updated',
        body: `You have a new class sequence added on ${day} at ${startTime}.`,
        data: { timetableId: slot._id },
        createdBy: req.user._id
      });
    }
  } catch (notifErr) {
    console.error("Timetable Notification Error:", notifErr);
  }

  res.status(201).json(slot);
};

/**
 * ADMIN — Get timetable by class + day
 */
    exports.getTimetableByClass = async (req, res) => {
      const filter = {};

      if (req.query.classId) {
        filter.classId = req.query.classId;
      }

      if (req.query.day) {
        filter.day = req.query.day;
      }

      const timetable = await Timetable.find(filter)
        .populate("teacherId", "name")
        .populate("classId", "className")
        .sort({ startTime: 1 });

      res.json(timetable);
    };

/**
 * ADMIN — Delete timetable
 */
exports.deleteTimetable = async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: "Timetable slot deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete slot" });
  }
};

/**
 * TEACHER — View own timetable
 */
exports.getTeacherTimetable = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const timetable = await Timetable.find({ teacherId })
      .populate("classId", "className")
      .populate("teacherId", "name");

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to load teacher timetable" });
  }
};


/**
 * PARENT — View child's full weekly timetable (same scope as class timetable for teachers)
 */
exports.getParentTimetable = async (req, res) => {
  try {
    const classId = await getClassIdForParentUser(req.user);
    if (!classId) {
      return res.json([]);
    }

    const timetable = await Timetable.find({ classId })
      .populate("teacherId", "name")
      .populate("classId", "className")
      .sort({ startTime: 1 });

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to load parent timetable" });
  }
};

/**
 * PARENT — View child's timetable (today)
 */
exports.getParentTimetableToday = async (req, res) => {
  try {
    const classId = await getClassIdForParentUser(req.user);
    if (!classId) {
      return res.json([]);
    }

    const DAYS = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = DAYS[new Date().getDay()];

    const timetable = await Timetable.find({
      classId,
      day: today,
    })
      .populate("teacherId", "name")
      .populate("classId", "className");

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to load parent timetable" });
  }
};

