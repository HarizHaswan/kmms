const Payroll = require("../models/Payroll");
const User = require("../models/User");
const { createNotification } = require("../../utils/notificationHelper");

// @desc    Get all payroll records for a month/year
// @route   GET /api/payroll
// @access  Admin
exports.getPayrollRecords = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const records = await Payroll.find(filter)
      .populate("teacher", "name email profileImage salaryProfile")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    next(err);
  }
};

// @desc    Generate monthly payroll for all active teachers
// @route   POST /api/payroll/generate
// @access  Admin
exports.generateMonthlyPayroll = async (req, res, next) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    // 1. Get all active teachers
    const teachers = await User.find({ role: "teacher", status: "Active" });

    const results = {
      created: 0,
      skipped: 0,
    };

    // 2. Create payroll records
    for (const teacher of teachers) {
      // Check if already exists
      const existing = await Payroll.findOne({
        teacher: teacher._id,
        month: Number(month),
        year: Number(year),
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      const profile = teacher.salaryProfile || {};

      await Payroll.create({
        teacher: teacher._id,
        month: Number(month),
        year: Number(year),
        baseSalary: profile.baseSalary || 0,
        overtimeRate: profile.overtimeRate || 0,
        allowances: {
          housing: profile.allowances?.housing || 0,
          transport: profile.allowances?.transport || 0,
          other: profile.allowances?.other || 0,
        },
        statutory: {
          epf: { 
            employer: profile.defaultStatutory?.epf?.employer || 0, 
            employee: profile.defaultStatutory?.epf?.employee || 0 
          },
          socso: { 
            employer: profile.defaultStatutory?.socso?.employer || 0, 
            employee: profile.defaultStatutory?.socso?.employee || 0 
          },
          eis: { 
            employer: profile.defaultStatutory?.eis?.employer || 0, 
            employee: profile.defaultStatutory?.eis?.employee || 0 
          },
          pcb: profile.defaultStatutory?.pcb || 0
        },
        generatedBy: req.user._id,
        status: "Draft",
      });

      results.created++;

      // Notify teacher
      try {
        await createNotification({
          recipientId: teacher._id,
          type: "salary",
          title: "Payroll Generated",
          body: `Your payroll for ${month}/${year} has been generated as a draft.`,
          data: { month, year },
          createdBy: req.user._id,
        });
      } catch (e) {
        console.error("Notification failed", e);
      }
    }

    res.json({
      message: `Payroll generation complete. ${results.created} created, ${results.skipped} skipped.`,
      results,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a payroll record
// @route   PUT /api/payroll/:id
// @access  Admin
exports.updatePayrollRecord = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    if (record.status === "Paid") {
      return res.status(400).json({ message: "Cannot edit a paid record" });
    }

    const {
      overtimeHours,
      allowances,
      statutory,
      bonus,
      deductions,
      status,
      remarks,
    } = req.body;

    if (overtimeHours !== undefined) record.overtimeHours = overtimeHours;
    if (allowances) record.allowances = { ...record.allowances, ...allowances };
    if (statutory) {
      record.statutory = {
        epf: { ...(record.statutory?.epf || {}), ...(statutory.epf || {}) },
        socso: { ...(record.statutory?.socso || {}), ...(statutory.socso || {}) },
        eis: { ...(record.statutory?.eis || {}), ...(statutory.eis || {}) },
        pcb: statutory.pcb !== undefined ? statutory.pcb : record.statutory?.pcb
      };
    }
    if (bonus !== undefined) record.bonus = bonus;
    if (deductions !== undefined) record.deductions = deductions;
    if (status) record.status = status;
    if (remarks !== undefined) record.remarks = remarks;

    await record.save();
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// @desc    Mark as paid
// @route   POST /api/payroll/:id/pay
// @access  Admin
exports.markAsPaid = async (req, res, next) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    record.status = "Paid";
    record.paidAt = new Date();
    await record.save();

    // Notify teacher
    try {
      await createNotification({
        recipientId: record.teacher,
        type: "salary",
        title: "Salary Paid",
        body: `Your salary for ${record.month}/${record.year} has been marked as Paid.`,
        data: { payrollId: record._id },
        createdBy: req.user._id,
      });
    } catch (e) {}

    res.json(record);
  } catch (err) {
    next(err);
  }
};

// @desc    Get payroll stats
// @route   GET /api/payroll/stats
// @access  Admin
exports.getPayrollStats = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const filter = {
      month: Number(month),
      year: Number(year),
    };

    const records = await Payroll.find(filter);

    const stats = {
      totalNetSalary: 0,
      totalPaid: 0,
      totalPending: 0,
      totalDraft: 0,
      count: records.length,
      paidCount: 0,
    };

    records.forEach((r) => {
      stats.totalNetSalary += r.netSalary;
      if (r.status === "Paid") {
        stats.totalPaid += r.netSalary;
        stats.paidCount++;
      } else if (r.status === "Pending") {
        stats.totalPending += r.netSalary;
      } else {
        stats.totalDraft += r.netSalary;
      }
    });

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

// @desc    Get my payslips
// @route   GET /api/payroll/my
// @access  Teacher
exports.getMyPayslips = async (req, res, next) => {
  try {
    const records = await Payroll.find({ 
      teacher: req.user._id,
      status: { $in: ["Pending", "Paid"] } // Don't show drafts to teachers
    })
    .sort({ year: -1, month: -1 });

    res.json(records);
  } catch (err) {
    next(err);
  }
};
