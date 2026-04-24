const Activity = require("../models/Activity");
const Student = require("../models/Student");
const Class = require("../models/Class");

// GET activities (filtered by role)
exports.getActivities = async (req, res) => {
  try {
    const { studentId, date } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (date) query.date = date;

    // Teachers only see their own class's activities
    if (req.user && req.user.role === "teacher") {
      if (!req.user.classAssigned) {
        return res.json([]);
      }

      const classDoc = await Class.findOne({
        className: req.user.classAssigned.trim(),
      });

      if (!classDoc) return res.json([]);

      const classStudents = await Student.find(
        { classId: classDoc._id },
        "_id"
      );
      const studentIds = classStudents.map((s) => s._id);
      query.studentId = { $in: studentIds };
    }

    // Parents only see their child's activities
    if (req.user && req.user.role === "parent") {
      const childStudent = await Student.findOne({ parentId: req.user._id }, "_id");
      if (!childStudent) return res.json([]);
      query.studentId = childStudent._id;
    }

    const activities = await Activity.find(query).sort({ _id: -1 });
    res.json(activities);
  } catch (error) {
    console.error("getActivities error:", error);
    res.status(500).json({ message: "Error fetching activities" });
  }
};

// ADD a new activity (teacher only)
exports.addActivity = async (req, res) => {
  try {
    const { studentId, activity, notes, date, time } = req.body;

    if (!studentId || !activity || !date || !time) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const newAct = new Activity({
      studentId,
      activity,
      notes,
      date,
      time,
      photos: [],
    });

    const saved = await newAct.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding activity" });
  }
};

// BLAST activity to all students in the teacher's class
exports.blastActivity = async (req, res) => {
  try {
    const { activity, notes, date, time } = req.body;

    if (!activity || !date || !time) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!req.user.classAssigned) {
      return res.status(400).json({ message: "No class assigned to teacher" });
    }

    const classDoc = await Class.findOne({
      className: req.user.classAssigned.trim(),
    });

    if (!classDoc) {
      return res.status(404).json({ message: "Assigned class not found" });
    }

    const classStudents = await Student.find({ classId: classDoc._id }, "_id");

    if (classStudents.length === 0) {
      return res.status(404).json({ message: "No students in class" });
    }

    const newRecords = await Promise.all(
      classStudents.map((s) =>
        Activity.create({
          studentId: s._id,
          activity,
          notes,
          date,
          time,
          photos: [],
        })
      )
    );

    res.status(201).json(newRecords);
  } catch (error) {
    console.error("blastActivity error:", error);
    res.status(500).json({ message: "Error blasting activity" });
  }
};

// DELETE activity (admin or teacher)
exports.deleteActivity = async (req, res) => {
  try {
    const act = await Activity.findById(req.params.id);
    if (!act) return res.status(404).json({ message: "Activity not found" });

    // If teacher, verify they own this student
    if (req.user.role === "teacher") {
      if (!req.user.classAssigned) {
        return res.status(403).json({ message: "No class assigned" });
      }

      const classDoc = await Class.findOne({
        className: req.user.classAssigned.trim(),
      });

      if (!classDoc) {
        return res.status(403).json({ message: "Class not found" });
      }

      const student = await Student.findOne({
        _id: act.studentId,
        classId: classDoc._id,
      });

      if (!student) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this activity" });
      }
    }

    await act.deleteOne();
    res.json({ message: "Activity deleted" });
  } catch (error) {
    console.error("deleteActivity error:", error);
    res.status(500).json({ message: "Error deleting activity" });
  }
};
