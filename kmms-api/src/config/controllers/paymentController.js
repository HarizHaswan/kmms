const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Student = require("../models/Student");
const { getUserIdsByRole, createNotificationsForUsers } = require('../../utils/notificationHelper');

async function syncInvoiceStatus(invoiceId) {
  if (!invoiceId) {
    return null;
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return null;
  }

  if (invoice.status === "cancelled") {
    return invoice;
  }

  const payments = await Payment.find({ invoiceId });
  const totalPaid = payments.reduce(
    (sum, payment) => sum + (Number(payment.amountPaid) || 0),
    0
  );

  let status = "unpaid";
  if (totalPaid >= Number(invoice.amount || 0) && totalPaid > 0) {
    status = "paid";
  } else if (totalPaid > 0) {
    status = "partial";
  }

  invoice.status = status;
  await invoice.save();

  return invoice;
}

// GET all payments
exports.getPayments = async (req, res, next) => {
  try {
    const query = {};

    if (req.user && String(req.user.role || "").toLowerCase() === "parent") {
      const children = await Student.find({ parentId: req.user._id }).select("_id");
      query.studentId = { $in: children.map((child) => child._id) };
    }

    const payments = await Payment.find(query)
      .populate("invoiceId")
      .populate("studentId", "name classId");
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// CREATE payment
exports.createPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create(req.body);
    await syncInvoiceStatus(payment.invoiceId);

    // Notify Admins
    try {
      const adminIds = await getUserIdsByRole('admin');
      if (adminIds && adminIds.length > 0) {
        await createNotificationsForUsers(adminIds, {
          type: 'payment',
          title: 'New Payment Received',
          body: `A new fee payment of RM${payment.amountPaid || '0'} was recorded.`,
          data: { paymentId: payment._id },
          createdBy: req.user ? req.user.id : null
        });
      }
    } catch (notifErr) {
      console.error("Payment Notification Error:", notifErr);
    }

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

// DELETE payment
exports.deletePayment = async (req, res, next) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Payment not found" });

    await syncInvoiceStatus(deleted.invoiceId);

    res.json({ message: "Payment deleted" });
  } catch (err) {
    next(err);
  }
};
