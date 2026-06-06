const cron = require("node-cron");
const Class = require("../models/Class");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

/**
 * Helper to get the current date formatted as YYYY-MM-DD in the Asia/Kuala_Lumpur timezone.
 */
const getMalaysiaTodayDate = () => {
  const options = { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" };
  const formatter = new Intl.DateTimeFormat("en-CA", options); // Outputs YYYY-MM-DD format
  return formatter.format(new Date());
};

/**
 * Checks all active classes, and if no attendance sheet is found for today's date,
 * automatically generates and saves one with all active students marked as "Present".
 */
async function autoSaveAttendance() {
  try {
    const todayDate = getMalaysiaTodayDate();
    console.log(`[Attendance Automation] Starting auto-save check for date: ${todayDate}`);

    const classes = await Class.find({});
    let createdCount = 0;

    for (const cls of classes) {
      // 1. Check if an attendance record already exists for today
      const existing = await Attendance.findOne({ date: todayDate, classId: cls._id });
      if (existing) {
        // Attendance sheet is already created (either by teacher or earlier run)
        continue;
      }

      // 2. Fetch active students in this class
      const activeStudents = await Student.find({ classId: cls._id, status: "active" });
      if (activeStudents.length === 0) {
        // Skip classes with no active students
        continue;
      }

      // 3. Map students to default "Present" records
      const records = activeStudents.map((student) => ({
        studentId: student._id,
        status: "Present",
        reason: "",
      }));

      // 4. Save the default attendance sheet to DB
      await Attendance.create({
        date: todayDate,
        classId: cls._id,
        records,
      });

      createdCount++;
      console.log(`[Attendance Automation] Auto-saved default "Present" attendance for class: ${cls.className}`);
    }

    console.log(`[Attendance Automation] Run complete. Saved ${createdCount} new attendance sheet(s).`);
  } catch (error) {
    console.error("[Attendance Automation] Error running attendance auto-save:", error);
  }
}

let schedulerStarted = false;

function startAttendanceAutoSaveScheduler() {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;

  // Schedule to run at 6:00 PM (18:00) every day in Malaysia time zone
  cron.schedule("0 18 * * *", async () => {
    console.log("[Attendance Automation Triggered] 18:00 Asia/Kuala_Lumpur reached.");
    await autoSaveAttendance();
  }, {
    scheduled: true,
    timezone: "Asia/Kuala_Lumpur"
  });

  console.log("[Attendance Automation] Scheduler successfully initialized for 6:00 PM everyday (Asia/Kuala_Lumpur).");
}

module.exports = {
  autoSaveAttendance,
  startAttendanceAutoSaveScheduler
};
