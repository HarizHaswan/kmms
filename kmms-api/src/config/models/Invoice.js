const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  feeTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeTemplate", default: null },
  amount: { type: Number, required: true },
  category: { type: String },
  feeItem: { type: String, default: "" },
  feeType: {
    type: String,
    enum: ["monthly", "enrollment", "material", "custom", "manual"],
    default: "manual",
  },
  periodKey: { type: String, default: "" },
  isAutomated: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["unpaid", "paid", "partial", "cancelled"],
    default: "unpaid",
  },
  createdAt: { type: Date, default: Date.now },
  dueDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
