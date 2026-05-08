import jsPDF from "jspdf";

const SCHOOL_NAME = "Tadika Dunia Cahaya";

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-MY", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

export function downloadPayslipPdf(payroll) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  const teacher = payroll.teacher || {};
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const period = `${monthNames[payroll.month - 1]} ${payroll.year}`;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(40, 44, 52);
  doc.text(SCHOOL_NAME, margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  y += 6;
  doc.text("Kindergarten Management & Monitoring System (KMMS)", margin, y);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(63, 63, 191); 
  doc.text("OFFICIAL PAYSLIP", pageW - margin, y - 4, { align: "right" });
  
  y += 15;
  doc.setDrawColor(230);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Employee & Period Details
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("EMPLOYEE DETAILS", margin, y);
  doc.text("PAYMENT PERIOD", pageW / 2 + 10, y);
  y += 6;

  doc.setTextColor(40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(teacher.name || "—", margin, y);
  doc.text(period, pageW / 2 + 10, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(teacher.role || "Teacher", margin, y);
  doc.text(`Reference: PAY-${payroll._id.slice(-8).toUpperCase()}`, pageW / 2 + 10, y);
  y += 5;

  if (teacher.salaryProfile?.epfNo || teacher.salaryProfile?.taxNo) {
    doc.text(`EPF No: ${teacher.salaryProfile?.epfNo || "—"}  |  Tax No: ${teacher.salaryProfile?.taxNo || "—"}`, margin, y);
  }
  y += 12;

  // 1. EARNINGS SECTION
  doc.setFillColor(248, 249, 250);
  doc.rect(margin, y, pageW - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60);
  doc.text("EARNINGS", margin + 3, y + 5.5);
  doc.text("AMOUNT (RM)", pageW - margin - 3, y + 5.5, { align: "right" });
  y += 12;

  const row = (label, value, subLabel = null) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(label, margin + 3, y);
    if (subLabel) {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(subLabel, margin + 3, y + 4);
      doc.setFontSize(9);
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text(formatMoney(value), pageW - margin - 3, y, { align: "right" });
    y += subLabel ? 10 : 8;
  };

  row("Basic Salary", payroll.baseSalary);
  if (payroll.overtimeHours > 0) {
    row("Overtime Pay", payroll.overtimePay, `${payroll.overtimeRate} x ${payroll.overtimeHours} Hours`);
  }
  if (payroll.allowances?.housing > 0) row("Housing Allowance", payroll.allowances.housing);
  if (payroll.allowances?.transport > 0) row("Transport Allowance", payroll.allowances.transport);
  if (payroll.allowances?.other > 0) row("Other Allowance", payroll.allowances.other);
  if (payroll.bonus > 0) row("Performance Bonus", payroll.bonus);

  y += 4;
  doc.setDrawColor(240);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // 2. STATUTORY CONTRIBUTIONS (Professional Table)
  doc.setFillColor(248, 249, 250);
  doc.rect(margin, y, pageW - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60);
  doc.text("STATUTORY CONTRIBUTIONS", margin + 3, y + 5.5);
  y += 12;

  // Table Sub-header
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("ITEM", margin + 3, y);
  doc.text("EMPLOYER (RM)", margin + 80, y);
  doc.text("EMPLOYEE (RM)", margin + 115, y);
  doc.text("TOTAL (RM)", pageW - margin - 3, y, { align: "right" });
  y += 4;
  doc.line(margin + 3, y, pageW - margin - 3, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(80);

  const stat = payroll.statutory || {
    epf: { employer: 0, employee: 0 },
    socso: { employer: 0, employee: 0 },
    eis: { employer: 0, employee: 0 },
    pcb: 0
  };

  const statRow = (label, employer, employee) => {
    const total = (employer || 0) + (employee || 0);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin + 3, y);
    doc.text(formatMoney(employer), margin + 80, y);
    doc.text(formatMoney(employee), margin + 115, y);
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(total), pageW - margin - 3, y, { align: "right" });
    y += 8;
  };

  statRow("KWSP (EPF)", stat.epf.employer, stat.epf.employee);
  statRow("PERKESO (SOCSO)", stat.socso.employer, stat.socso.employee);
  statRow("SIP (EIS)", stat.eis.employer, stat.eis.employee);
  statRow("PCB (Tax)", 0, stat.pcb);

  if (payroll.deductions > 0) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("OTHER DEDUCTIONS", margin + 3, y);
    doc.text(formatMoney(payroll.deductions), pageW - margin - 3, y, { align: "right" });
    y += 8;
  }

  y += 5;
  doc.setDrawColor(63, 63, 191);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // 3. NET SALARY SUMMARY
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.text("NET SALARY", margin, y);
  doc.setFontSize(16);
  doc.setTextColor(63, 63, 191);
  doc.text(`RM ${formatMoney(payroll.netSalary)}`, pageW - margin, y, { align: "right" });
  
  y += 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text("Payment Information:", margin, y);
  y += 4;
  doc.setTextColor(100);
  doc.text(`${teacher.salaryProfile?.bankName || "—"} Account: ${teacher.salaryProfile?.bankAccountNo || "—"}`, margin, y);

  if (payroll.remarks) {
    y += 10;
    doc.setTextColor(150);
    doc.text("Remarks:", margin, y);
    y += 4;
    doc.setTextColor(100);
    doc.text(payroll.remarks, margin, y, { maxWidth: pageW - margin * 2 });
  }

  // Footer
  y = 275;
  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.text(`Generated on ${new Date().toLocaleString()} by KMMS Payroll Engine`, pageW / 2, y, { align: "center" });
  doc.text("This is a computer generated payslip and requires no signature.", pageW / 2, y + 4, { align: "center" });

  const fileName = `Payslip_${teacher.name?.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
