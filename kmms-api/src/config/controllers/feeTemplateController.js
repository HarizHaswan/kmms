const FeeTemplate = require("../models/FeeTemplate");
const Invoice = require("../models/Invoice");
const { syncFeeTemplates } = require("../services/feeAutomationService");

function normalizePayload(body = {}) {
  const feeType = String(body.feeType || "").toLowerCase();
  const isCompulsory = feeType === "monthly" || feeType === "enrollment";

  return {
    name: body.name,
    feeType,
    amount: Number(body.amount),
    description: body.description || "",
    dueDay: Number(body.dueDay) || 5,
    appliesToAllStudents: isCompulsory ? true : Boolean(body.appliesToAllStudents),
    autoGenerate: isCompulsory ? true : Boolean(body.autoGenerate),
    isActive: body.isActive !== false,
    targetStudentIds: isCompulsory ? [] : Array.isArray(body.targetStudentIds) ? body.targetStudentIds : [],
  };
}

exports.getFeeTemplates = async (req, res, next) => {
  try {
    const feeTemplates = await FeeTemplate.find()
      .populate("targetStudentIds", "name classId")
      .sort({ createdAt: -1 });

    res.json(feeTemplates);
  } catch (error) {
    next(error);
  }
};

exports.createFeeTemplate = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    payload.createdBy = req.user ? req.user._id : null;

    const feeTemplate = await FeeTemplate.create(payload);

    await syncFeeTemplates({
      templateIds: [feeTemplate._id],
      refreshExisting: true,
      triggeredBy: req.user ? req.user._id : null,
    });

    const populated = await FeeTemplate.findById(feeTemplate._id).populate(
      "targetStudentIds",
      "name classId"
    );

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

exports.updateFeeTemplate = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);

    const updated = await FeeTemplate.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("targetStudentIds", "name classId");

    if (!updated) {
      return res.status(404).json({ message: "Fee template not found" });
    }

    await syncFeeTemplates({
      templateIds: [updated._id],
      refreshExisting: true,
      triggeredBy: req.user ? req.user._id : null,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

exports.deleteFeeTemplate = async (req, res, next) => {
  try {
    const deleted = await FeeTemplate.findById(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Fee template not found" });
    }

    await Invoice.updateMany(
      {
        feeTemplateId: deleted._id,
        status: { $in: ["unpaid", "partial"] },
      },
      {
        $set: { status: "cancelled" },
      }
    );

    await deleted.deleteOne();

    res.json({
      message: "Fee template deleted and related outstanding invoices cleared",
    });
  } catch (error) {
    next(error);
  }
};
