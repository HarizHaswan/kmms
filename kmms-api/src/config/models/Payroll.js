const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    
    // Salary components (snapshotted from profile at generation)
    baseSalary: { type: Number, default: 0 },
    overtimeRate: { type: Number, default: 0 },
    
    // Editable components
    overtimeHours: { type: Number, default: 0 },
    allowances: {
      housing: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    bonus: { type: Number, default: 0 },
    
    // Detailed Statutory
    statutory: {
      epf: {
        employer: { type: Number, default: 0 },
        employee: { type: Number, default: 0 },
      },
      socso: {
        employer: { type: Number, default: 0 },
        employee: { type: Number, default: 0 },
      },
      eis: {
        employer: { type: Number, default: 0 },
        employee: { type: Number, default: 0 },
      },
      pcb: { type: Number, default: 0 },
    },

    deductions: { type: Number, default: 0 }, // Other deductions
    
    // Calculated fields
    overtimePay: { type: Number, default: 0 },
    totalAllowances: { type: Number, default: 0 },
    totalStatutoryEmployee: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    
    status: {
      type: String,
      enum: ["Draft", "Pending", "Paid"],
      default: "Draft",
    },
    
    remarks: { type: String, default: "" },
    
    paidAt: Date,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-calculate before saving
payrollSchema.pre("save", function (next) {
  this.overtimePay = this.overtimeHours * this.overtimeRate;
  this.totalAllowances = 
    (this.allowances?.housing || 0) + 
    (this.allowances?.transport || 0) + 
    (this.allowances?.other || 0) + 
    (this.bonus || 0);

  this.totalStatutoryEmployee = 
    (this.statutory?.epf?.employee || 0) +
    (this.statutory?.socso?.employee || 0) +
    (this.statutory?.eis?.employee || 0) +
    (this.statutory?.pcb || 0);
    
  this.netSalary = this.baseSalary + this.totalAllowances + this.overtimePay - this.totalStatutoryEmployee - this.deductions;
  next();
});

module.exports = mongoose.model("Payroll", payrollSchema);
