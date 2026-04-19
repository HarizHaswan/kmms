import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { createInvoice, getInvoices } from "../../api/invoices";
import {
  createPayment,
  getPayments,
  uploadPaymentReceipt,
} from "../../api/payments";
import { getStudents } from "../../api/students";
import { getClasses } from "../../api/classes";
import {
  createFeeTemplate,
  deleteFeeTemplate,
  getFeeTemplates,
  updateFeeTemplate,
} from "../../api/feeTemplates";
import { downloadFeeReceiptPdf } from "../../utils/paymentReceiptPdf";

const DEFAULT_INVOICE_FORM = {
  studentId: "",
  feeItem: "",
  amount: "",
  category: "Custom Fees",
  dueDate: "",
};

const DEFAULT_PAYMENT_FORM = {
  amountPaid: "",
  method: "Cash",
  note: "",
};

const DEFAULT_PARENT_PAY_FORM = {
  amountPaid: "",
  receipt: null,
};

const DEFAULT_FEE_FORM = {
  name: "",
  feeType: "monthly",
  amount: "",
  description: "",
  dueDay: 5,
  isActive: true,
  targetStudentIds: [],
};

const FEE_TYPE_META = {
  monthly: {
    label: "Monthly Fees",
    chipClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Compulsory and automatically created every month for all active students.",
  },
  enrollment: {
    label: "Enrollment Fees",
    chipClass: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Compulsory one-time fee automatically assigned to every active student.",
  },
  material: {
    label: "Material Fees",
    chipClass: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Optional fee you can assign only to selected students.",
  },
  custom: {
    label: "Custom Fees",
    chipClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Optional one-off fee for students you choose.",
  },
};

const MANUAL_CATEGORY_OPTIONS = [
  "Monthly Fees",
  "Enrollment Fees",
  "Material Fees",
  "Custom Fees",
];

const STATUS_META = {
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800",
  },
  partial: {
    label: "Partial",
    className: "bg-yellow-100 text-yellow-800",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-red-100 text-red-800",
  },
  "no-fees": {
    label: "No Fees",
    className: "bg-gray-100 text-gray-700",
  },
};

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const getStudentLifecycleStatus = (student) =>
  String(student?.status || "active").toLowerCase();

const formatStudentLifecycleStatus = (status) => {
  const normalized = String(status || "active").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const loadPaymentData = async ({ isAdmin }) => {
  const requests = [getInvoices(), getPayments(), getStudents()];

  if (isAdmin) {
    requests.push(getClasses(), getFeeTemplates());
  }

  const results = await Promise.all(requests);

  return {
    invoiceData: results[0] || [],
    paymentData: results[1] || [],
    studentData: results[2] || [],
    adminClassData: isAdmin ? results[3] || [] : [],
    adminTemplateData: isAdmin ? results[4] || [] : [],
  };
};

const PaymentManagement = ({ userId, role, user }) => {
  const normalizedRole = String(role || "").toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const isParentRole = normalizedRole === "parent";

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeTemplates, setFeeTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [classStatusView, setClassStatusView] = useState("active");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showParentPayModal, setShowParentPayModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingFeeTemplateId, setEditingFeeTemplateId] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState(DEFAULT_INVOICE_FORM);
  const [paymentForm, setPaymentForm] = useState(DEFAULT_PAYMENT_FORM);
  const [parentPayForm, setParentPayForm] = useState(DEFAULT_PARENT_PAY_FORM);
  const [feeForm, setFeeForm] = useState(DEFAULT_FEE_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const runInitialLoad = async () => {
      setLoading(true);

      try {
        const loaded = await loadPaymentData({ isAdmin });
        if (!isMounted) return;

        if (isParentRole) {
          const childIds = loaded.studentData.map((student) => getIdValue(student));

          setInvoices(
            loaded.invoiceData.filter((invoice) =>
              childIds.includes(getIdValue(invoice.studentId))
            )
          );
          setPayments(
            loaded.paymentData.filter((payment) =>
              childIds.includes(getIdValue(payment.studentId))
            )
          );
          setStudents(loaded.studentData);
        } else {
          setInvoices(loaded.invoiceData);
          setPayments(loaded.paymentData);
          setStudents(loaded.studentData);
        }

        setClasses(loaded.adminClassData);
        setFeeTemplates(loaded.adminTemplateData);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load payment data", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runInitialLoad();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, isParentRole, normalizedRole, userId]);

  useEffect(() => {
    if (
      selectedClassFilter !== "all" &&
      !classes.some((item) => getIdValue(item) === selectedClassFilter)
    ) {
      setSelectedClassFilter("all");
    }
  }, [classes, selectedClassFilter]);

  const getClassLabel = (classValue) => {
    const classId = getIdValue(classValue);
    const classRecord =
      (typeof classValue === "object" && classValue?.className && classValue) ||
      classes.find((item) => getIdValue(item) === classId);

    if (!classRecord) return "Unassigned Class";
    if (classRecord.yearGroup) {
      return `${classRecord.className} • ${classRecord.yearGroup} Years`;
    }
    return classRecord.className || "Unassigned Class";
  };

  const getStudentName = (studentValue) => {
    if (studentValue?.name) return studentValue.name;

    const studentId = getIdValue(studentValue);
    const student = students.find((item) => getIdValue(item) === studentId);
    return student?.name || "Unknown Student";
  };

  const getPaymentsForInvoice = (invoiceId, extraPayment = null) => {
    const list = payments.filter(
      (payment) => getIdValue(payment.invoiceId) === String(invoiceId)
    );

    if (
      extraPayment &&
      !list.some((payment) => getIdValue(payment) === getIdValue(extraPayment))
    ) {
      return [...list, extraPayment];
    }

    return list;
  };

  const getInvoiceBalance = (invoice) => {
    const totalPaid = getPaymentsForInvoice(invoice._id).reduce(
      (sum, payment) => sum + Number(payment.amountPaid || 0),
      0
    );
    return Math.max(0, Number(invoice.amount || 0) - totalPaid);
  };

  const getTemplateMeta = (feeType) =>
    FEE_TYPE_META[String(feeType || "").toLowerCase()] || FEE_TYPE_META.custom;

  const openFeeModal = (template = null) => {
    if (template) {
      setEditingFeeTemplateId(template._id);
      setFeeForm({
        name: template.name || "",
        feeType: template.feeType || "monthly",
        amount: template.amount ?? "",
        description: template.description || "",
        dueDay: template.dueDay || 5,
        isActive: template.isActive !== false,
        targetStudentIds: Array.isArray(template.targetStudentIds)
          ? template.targetStudentIds.map((student) => getIdValue(student))
          : [],
      });
    } else {
      setEditingFeeTemplateId(null);
      setFeeForm(DEFAULT_FEE_FORM);
    }

    setShowFeeModal(true);
  };

  const closeFeeModal = () => {
    setShowFeeModal(false);
    setEditingFeeTemplateId(null);
    setFeeForm(DEFAULT_FEE_FORM);
  };

  const applyLoadedData = ({
    invoiceData,
    paymentData,
    studentData,
    adminClassData,
    adminTemplateData,
  }) => {
    if (isParentRole) {
      const childIds = studentData.map((student) => getIdValue(student));

      setInvoices(
        invoiceData.filter((invoice) =>
          childIds.includes(getIdValue(invoice.studentId))
        )
      );
      setPayments(
        paymentData.filter((payment) =>
          childIds.includes(getIdValue(payment.studentId))
        )
      );
      setStudents(studentData);
    } else {
      setInvoices(invoiceData);
      setPayments(paymentData);
      setStudents(studentData);
    }

    setClasses(adminClassData);
    setFeeTemplates(adminTemplateData);
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const loaded = await loadPaymentData({ isAdmin });
      applyLoadedData(loaded);
    } catch (error) {
      console.error("Failed to load payment data", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoiceReceiptPdf = (invoice, payLines) => {
    downloadFeeReceiptPdf({
      payerName: user?.name || "Parent / Guardian",
      studentName: getStudentName(invoice.studentId),
      invoice,
      payments: payLines,
    });
  };

  const handleCreateInvoice = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    try {
      await createInvoice({
        studentId: invoiceForm.studentId,
        feeItem: invoiceForm.feeItem || invoiceForm.category,
        amount: Number(invoiceForm.amount),
        category: invoiceForm.category,
        feeType: "manual",
        dueDate: invoiceForm.dueDate || undefined,
      });

      setShowInvoiceModal(false);
      setInvoiceForm(DEFAULT_INVOICE_FORM);
      await fetchData();
    } catch (error) {
      alert("Failed to create invoice");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    try {
      await createPayment({
        invoiceId: selectedInvoice._id,
        studentId: getIdValue(selectedInvoice.studentId),
        amountPaid: Number(paymentForm.amountPaid),
        method: paymentForm.method,
        note: paymentForm.note,
      });

      setShowPaymentModal(false);
      setPaymentForm(DEFAULT_PAYMENT_FORM);
      await fetchData();
    } catch (error) {
      alert("Failed to record payment");
    } finally {
      setFormSubmitting(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      ...DEFAULT_PAYMENT_FORM,
      amountPaid: getInvoiceBalance(invoice),
    });
    setShowPaymentModal(true);
  };

  const openParentPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    setParentPayForm({
      amountPaid: getInvoiceBalance(invoice),
      receipt: null,
    });
    setShowParentPayModal(true);
  };

  const handleParentPaySubmit = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    let receiptUrl = null;

    try {
      if (parentPayForm.receipt) {
        const formData = new FormData();
        formData.append("file", parentPayForm.receipt);
        const uploadResult = await uploadPaymentReceipt(formData);
        receiptUrl = uploadResult.url;
      }

      const amountPaid = Number(parentPayForm.amountPaid);
      const newPayment = await createPayment({
        invoiceId: selectedInvoice._id,
        studentId: getIdValue(selectedInvoice.studentId),
        amountPaid,
        method: "Bank Transfer",
        note: "Parent Payment Upload",
        receiptUrl,
      });

      const currentPaid = getPaymentsForInvoice(selectedInvoice._id).reduce(
        (sum, payment) => sum + Number(payment.amountPaid || 0),
        0
      );
      const newTotal = currentPaid + amountPaid;
      const nextStatus =
        newTotal >= Number(selectedInvoice.amount || 0)
          ? "paid"
          : newTotal > 0
            ? "partial"
            : "unpaid";

      if (isParentRole && nextStatus === "paid") {
        try {
          downloadInvoiceReceiptPdf(
            { ...selectedInvoice, status: nextStatus },
            getPaymentsForInvoice(selectedInvoice._id, newPayment)
          );
        } catch (pdfError) {
          console.error("Receipt PDF error:", pdfError);
        }
      }

      setShowParentPayModal(false);
      setParentPayForm(DEFAULT_PARENT_PAY_FORM);
      await fetchData();
    } catch (error) {
      alert("Failed to submit payment");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFeeTypeChange = (feeType) => {
    const isCompulsory = feeType === "monthly" || feeType === "enrollment";

    setFeeForm((current) => ({
      ...current,
      feeType,
      dueDay: feeType === "monthly" ? current.dueDay || 5 : 5,
      targetStudentIds: isCompulsory ? [] : current.targetStudentIds,
    }));
  };

  const handleToggleFeeStudent = (studentId) => {
    setFeeForm((current) => ({
      ...current,
      targetStudentIds: current.targetStudentIds.includes(studentId)
        ? current.targetStudentIds.filter((id) => id !== studentId)
        : [...current.targetStudentIds, studentId],
    }));
  };

  const handleFeeSubmit = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    const isCompulsory =
      feeForm.feeType === "monthly" || feeForm.feeType === "enrollment";

    if (!isCompulsory && feeForm.targetStudentIds.length === 0) {
      alert("Please choose at least one student for material or custom fees.");
      setFormSubmitting(false);
      return;
    }

    const payload = {
      name: feeForm.name.trim(),
      feeType: feeForm.feeType,
      amount: Number(feeForm.amount),
      description: feeForm.description.trim(),
      dueDay: feeForm.feeType === "monthly" ? Number(feeForm.dueDay) || 5 : 5,
      isActive: feeForm.isActive,
      appliesToAllStudents: isCompulsory,
      autoGenerate: isCompulsory,
      targetStudentIds: isCompulsory ? [] : feeForm.targetStudentIds,
    };

    try {
      if (editingFeeTemplateId) {
        await updateFeeTemplate(editingFeeTemplateId, payload);
      } else {
        await createFeeTemplate(payload);
      }

      closeFeeModal();
      await fetchData();
    } catch (error) {
      alert("Failed to save fee setup");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteFeeTemplate = async (templateId) => {
    const confirmed = window.confirm(
      "Delete this fee setup? Any unpaid or partial invoices from this fee will be cleared from outstanding balances."
    );

    if (!confirmed) return;

    try {
      await deleteFeeTemplate(templateId);
      await fetchData();
    } catch (error) {
      alert("Failed to delete fee setup");
    }
  };

  const selectedClassStudents =
    isAdmin && selectedClassFilter !== "all"
      ? students.filter(
          (student) => getIdValue(student.classId) === selectedClassFilter
        )
      : students;

  const selectedClassStudentIds = selectedClassStudents.map((student) =>
    getIdValue(student)
  );

  const summaryInvoices =
    isAdmin && selectedClassFilter !== "all"
      ? invoices.filter((invoice) =>
          selectedClassStudentIds.includes(getIdValue(invoice.studentId))
        )
      : invoices;

  const summaryPayments =
    isAdmin && selectedClassFilter !== "all"
      ? payments.filter((payment) =>
          selectedClassStudentIds.includes(getIdValue(payment.studentId))
        )
      : payments;

  const displayedInvoices =
    isAdmin && selectedClassFilter !== "all"
      ? invoices.filter((invoice) =>
          selectedClassStudentIds.includes(getIdValue(invoice.studentId))
        )
      : invoices;

  const totalInvoiced = summaryInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || 0),
    0
  );
  const totalPaid = summaryPayments.reduce(
    (sum, payment) => sum + Number(payment.amountPaid || 0),
    0
  );
  const totalPending = Math.max(0, totalInvoiced - totalPaid);
  const summaryScopeLabel =
    isAdmin && selectedClassFilter !== "all"
      ? getClassLabel(
          classes.find((classItem) => getIdValue(classItem) === selectedClassFilter)
        )
      : "All Classes";

  const sortedClasses = [...classes].sort((left, right) => {
    const leftYear = Number(left.yearGroup || 0);
    const rightYear = Number(right.yearGroup || 0);
    if (leftYear !== rightYear) return leftYear - rightYear;
    return String(left.className || "").localeCompare(String(right.className || ""));
  });

  const sortedStudents = [...students].sort((left, right) => {
    const classCompare = getClassLabel(left.classId).localeCompare(
      getClassLabel(right.classId)
    );
    if (classCompare !== 0) return classCompare;
    return String(left.name || "").localeCompare(String(right.name || ""));
  });

  const activeClassStatusStudents = sortedStudents.filter(
    (student) => getStudentLifecycleStatus(student) === "active"
  );

  const historyClassStatusStudents = sortedStudents.filter(
    (student) => getStudentLifecycleStatus(student) !== "active"
  );

  const classStatusSourceStudents =
    classStatusView === "history"
      ? historyClassStatusStudents
      : activeClassStatusStudents;

  const classStatusRows = isAdmin
    ? classStatusSourceStudents
        .filter((student) => {
          if (selectedClassFilter === "all") return true;
          return getIdValue(student.classId) === selectedClassFilter;
        })
        .map((student) => {
          const studentId = getIdValue(student);
          const studentInvoices = invoices.filter(
            (invoice) => getIdValue(invoice.studentId) === studentId
          );
          const studentPayments = payments.filter(
            (payment) => getIdValue(payment.studentId) === studentId
          );
          const billed = studentInvoices.reduce(
            (sum, invoice) => sum + Number(invoice.amount || 0),
            0
          );
          const paid = studentPayments.reduce(
            (sum, payment) => sum + Number(payment.amountPaid || 0),
            0
          );
          const outstanding = Math.max(0, billed - paid);
          const unpaidInvoices = studentInvoices.filter(
            (invoice) => invoice.status !== "paid"
          );
          const latestDue = [...unpaidInvoices].sort(
            (left, right) =>
              new Date(left.dueDate || left.createdAt) -
              new Date(right.dueDate || right.createdAt)
          )[0];

          let paymentStatus = "no-fees";
          if (studentInvoices.length > 0) {
            if (
              outstanding <= 0 &&
              studentInvoices.every((invoice) => invoice.status === "paid")
            ) {
              paymentStatus = "paid";
            } else if (
              paid > 0 ||
              studentInvoices.some((invoice) => invoice.status === "partial")
            ) {
              paymentStatus = "partial";
            } else {
              paymentStatus = "unpaid";
            }
          }

          return {
            studentId,
            studentName: student.name,
            classLabel: getClassLabel(student.classId),
            recordStatus: getStudentLifecycleStatus(student),
            paymentStatus,
            invoiceCount: studentInvoices.length,
            billed,
            paid,
            outstanding,
            latestDue: latestDue?.dueDate || latestDue?.createdAt || null,
          };
        })
    : [];

  const classStatusCounts = classStatusRows.reduce(
    (summary, row) => {
      summary[row.paymentStatus] += 1;
      return summary;
    },
    { paid: 0, partial: 0, unpaid: 0, "no-fees": 0 }
  );

  const compulsoryTemplates = feeTemplates.filter((template) =>
    ["monthly", "enrollment"].includes(String(template.feeType || "").toLowerCase())
  ).length;

  const optionalTemplates = feeTemplates.length - compulsoryTemplates;

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading ledger data...</div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payment & Ledger</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin
              ? "Manage fee automation, issue invoices, and track each class payment status."
              : "Track your child's fees and payments."}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openFeeModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              Add Fee Setup
            </button>
            <button
              onClick={() => {
                setInvoiceForm(DEFAULT_INVOICE_FORM);
                setShowInvoiceModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Manual Invoice
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-green-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <p className="text-xs text-gray-400 mt-1">{summaryScopeLabel}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                RM {formatMoney(totalPaid)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-yellow-500">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding Fees</p>
              <p className="text-xs text-gray-400 mt-1">{summaryScopeLabel}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                RM {formatMoney(totalPending)}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Revenue (Invoiced)
              </p>
              <p className="text-xs text-gray-400 mt-1">{summaryScopeLabel}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                RM {formatMoney(totalInvoiced)}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Fee Setup & Automation
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Monthly and enrollment fees are compulsory for all active students.
                Material and custom fees can be assigned only to selected students.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Compulsory
                </p>
                <p className="text-xl font-bold text-indigo-900">
                  {compulsoryTemplates}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Optional
                </p>
                <p className="text-xl font-bold text-emerald-900">
                  {optionalTemplates}
                </p>
              </div>
            </div>
          </div>

          {feeTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No fee setup created yet.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Start by creating monthly or enrollment fees, then add optional
                material or custom fees for selected students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {feeTemplates.map((template) => {
                const meta = getTemplateMeta(template.feeType);
                const isCompulsory =
                  template.feeType === "monthly" ||
                  template.feeType === "enrollment";
                const targetCount = Array.isArray(template.targetStudentIds)
                  ? template.targetStudentIds.length
                  : 0;

                return (
                  <div
                    key={template._id}
                    className="rounded-2xl border border-gray-100 shadow-sm bg-white p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {template.name}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border mt-2 ${meta.chipClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          template.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {template.isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-gray-900">
                        RM {formatMoney(template.amount)}
                      </p>
                      <p className="text-xs text-gray-500 min-h-[2.5rem]">
                        {template.description || meta.description}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Assignment</span>
                        <span className="font-semibold text-gray-800">
                          {isCompulsory
                            ? "All active students"
                            : `${targetCount} selected student${
                                targetCount === 1 ? "" : "s"
                              }`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Automation</span>
                        <span className="font-semibold text-gray-800">
                          {isCompulsory ? "Automatic" : "On creation"}
                        </span>
                      </div>
                      {template.feeType === "monthly" && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Due each month</span>
                          <span className="font-semibold text-gray-800">
                            Day {template.dueDay || 5}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openFeeModal(template)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeeTemplate(template._id)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "invoices"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Invoices / Fees
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "ledger"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Payment Ledger
          </button>
        </nav>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
            <div className="space-y-3">
              <div>
              <h3 className="text-lg font-bold text-gray-900">
                Class Payment Status
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                The main view shows active students only. Use History to review
                graduated or withdrawn student payment records.
              </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setClassStatusView("active")}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                    classStatusView === "active"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Active ({activeClassStatusStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClassStatusView("history")}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                    classStatusView === "history"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  History ({historyClassStatusStudents.length})
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedClassFilter("all")}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                  selectedClassFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                All Classes
              </button>
              {sortedClasses.map((classItem) => {
                const classId = getIdValue(classItem);

                return (
                  <button
                    key={classId}
                    type="button"
                    onClick={() => setSelectedClassFilter(classId)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                      selectedClassFilter === classId
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {getClassLabel(classItem)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              ["paid", "Paid"],
              ["partial", "Partial"],
              ["unpaid", "Unpaid"],
              ["no-fees", "No Fees"],
            ].map(([statusKey, title]) => (
              <div
                key={statusKey}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                  {title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {classStatusCounts[statusKey]}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-4">Student</th>
                  <th className="px-4 py-4">Class</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Fees</th>
                  <th className="px-4 py-4">Paid</th>
                  <th className="px-4 py-4">Outstanding</th>
                  <th className="px-4 py-4">Latest Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classStatusRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      {classStatusView === "history"
                        ? "No historical students found for this class."
                        : "No active students found for this class."}
                    </td>
                  </tr>
                ) : (
                  classStatusRows.map((row) => (
                    <tr key={row.studentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{row.studentName}</div>
                        {row.recordStatus !== "active" && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatStudentLifecycleStatus(row.recordStatus)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-500">{row.classLabel}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_META[row.paymentStatus].className}`}
                        >
                          {row.paymentStatus === "paid" ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {STATUS_META[row.paymentStatus].label}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        {row.invoiceCount} invoice{row.invoiceCount === 1 ? "" : "s"}
                      </td>
                      <td className="px-4 py-4 text-green-600 font-semibold">
                        RM {formatMoney(row.paid)}
                      </td>
                      <td className="px-4 py-4 text-red-500 font-semibold">
                        RM {formatMoney(row.outstanding)}
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {row.latestDue
                          ? new Date(row.latestDue).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isAdmin && (
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Invoice / Fee Records</p>
                <p className="text-xs text-gray-500 mt-1">
                  Showing {summaryScopeLabel} invoices for admin payment updates and receipt review.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                {displayedInvoices.length} record{displayedInvoices.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 w-10">#</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Fee</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Issued / Due</th>
                {isAdmin && <th className="px-6 py-4">Receipt</th>}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    {isAdmin && selectedClassFilter !== "all"
                      ? `No invoices found for ${summaryScopeLabel}.`
                      : "No invoices found."}
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((invoice, index) => {
                  const invoicePayments = getPaymentsForInvoice(invoice._id);
                  const withReceipt = invoicePayments.find((payment) => payment.receiptUrl);

                  return (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-bold text-sm select-none">
                        {index + 1}.
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {getStudentName(invoice.studentId)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {invoice.feeItem || invoice.category || "Fee"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {invoice.category || "Uncategorized"}
                          {invoice.isAutomated ? " • Automated" : " • Manual"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        RM {formatMoney(invoice.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-max ${STATUS_META[invoice.status || "unpaid"].className}`}
                        >
                          {invoice.status === "paid" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {STATUS_META[invoice.status || "unpaid"].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div>{new Date(invoice.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs mt-1">
                          Due:{" "}
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4">
                          {withReceipt ? (
                            <a
                              href={`http://localhost:5000${withReceipt.receiptUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              View Receipt
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">None</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        {isAdmin && invoice.status !== "paid" ? (
                          <button
                            onClick={() => openPaymentModal(invoice)}
                            className="text-xs bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                          >
                            Record Payment
                          </button>
                        ) : isAdmin ? (
                          <span className="text-xs text-gray-400 font-medium">
                            Cleared
                          </span>
                        ) : invoice.status !== "paid" ? (
                          <button
                            onClick={() => openParentPayModal(invoice)}
                            className="text-xs bg-green-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-xs text-gray-400 font-medium">
                              Cleared
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                downloadInvoiceReceiptPdf(
                                  invoice,
                                  getPaymentsForInvoice(invoice._id)
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              PDF Receipt
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "ledger" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 w-10">#</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4 text-right font-bold text-gray-900">
                  Amount Paid
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => (
                  <tr
                    key={payment._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400 font-bold text-sm select-none">
                      {index + 1}.
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(payment.paidAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {getStudentName(payment.studentId)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {payment.note || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {payment.receiptUrl ? (
                        <a
                          href={`http://localhost:5000${payment.receiptUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-lg"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      RM {formatMoney(payment.amountPaid)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showFeeModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingFeeTemplateId ? "Edit Fee Setup" : "Create Fee Setup"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Build compulsory monthly and enrollment fees, or assign material
                  and custom fees to selected students.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFeeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeeSubmit} className="space-y-5 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. April Monthly Fee"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={feeForm.name}
                    onChange={(event) =>
                      setFeeForm({ ...feeForm, name: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={feeForm.feeType}
                    disabled={Boolean(editingFeeTemplateId)}
                    onChange={(event) => handleFeeTypeChange(event.target.value)}
                  >
                    {Object.entries(FEE_TYPE_META).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (RM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={feeForm.amount}
                    onChange={(event) =>
                      setFeeForm({ ...feeForm, amount: event.target.value })
                    }
                  />
                </div>
                {feeForm.feeType === "monthly" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Day Each Month
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      required
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={feeForm.dueDay}
                      onChange={(event) =>
                        setFeeForm({ ...feeForm, dueDay: event.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center">
                    <p className="text-sm text-gray-600">
                      {getTemplateMeta(feeForm.feeType).description}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={feeForm.description}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, description: event.target.value })
                  }
                />
              </div>

              {(feeForm.feeType === "material" || feeForm.feeType === "custom") && (
                <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Assign Students
                      </h4>
                      <p className="text-sm text-gray-500">
                        Pick which students must pay this optional fee.
                      </p>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sortedStudents.map((student) => {
                      const studentId = getIdValue(student);
                      const selected = feeForm.targetStudentIds.includes(studentId);

                      return (
                        <label
                          key={studentId}
                          className={`rounded-xl border p-3 cursor-pointer transition ${
                            selected
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selected}
                              onChange={() => handleToggleFeeStudent(studentId)}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {getClassLabel(student.classId)}
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={feeForm.isActive}
                  onChange={(event) =>
                    setFeeForm({ ...feeForm, isActive: event.target.checked })
                  }
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Fee setup is active
                  </p>
                  <p className="text-xs text-gray-500">
                    Inactive fee setups stay in the list but stop generating new
                    invoices.
                  </p>
                </div>
              </label>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeFeeModal}
                  className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium"
                >
                  {formSubmitting
                    ? "Saving..."
                    : editingFeeTemplateId
                      ? "Update Fee Setup"
                      : "Create Fee Setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create Manual Invoice
            </h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                  value={invoiceForm.studentId}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, studentId: event.target.value })
                  }
                  required
                >
                  <option value="">Select a student...</option>
                  {sortedStudents.map((student) => (
                    <option key={getIdValue(student)} value={getIdValue(student)}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fee Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports Day Fee"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={invoiceForm.feeItem}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, feeItem: event.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (RM)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={invoiceForm.amount}
                    onChange={(event) =>
                      setInvoiceForm({ ...invoiceForm, amount: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={invoiceForm.category}
                    onChange={(event) =>
                      setInvoiceForm({ ...invoiceForm, category: event.target.value })
                    }
                  >
                    {MANUAL_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  value={invoiceForm.dueDate}
                  onChange={(event) =>
                    setInvoiceForm({ ...invoiceForm, dueDate: event.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceForm(DEFAULT_INVOICE_FORM);
                    setShowInvoiceModal(false);
                  }}
                  className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Record Payment
            </h3>
            <div className="mb-4 space-y-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p>
                <span className="text-gray-500">Invoice Amount:</span>{" "}
                <strong className="float-right text-gray-900">
                  RM {formatMoney(selectedInvoice.amount)}
                </strong>
              </p>
              <p>
                <span className="text-gray-500">Student:</span>{" "}
                <strong className="float-right text-gray-900">
                  {getStudentName(selectedInvoice.studentId)}
                </strong>
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Paid (RM)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                    value={paymentForm.amountPaid}
                    onChange={(event) =>
                      setPaymentForm({
                        ...paymentForm,
                        amountPaid: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    value={paymentForm.method}
                    onChange={(event) =>
                      setPaymentForm({ ...paymentForm, method: event.target.value })
                    }
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Txn #123456"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                  value={paymentForm.note}
                  onChange={(event) =>
                    setPaymentForm({ ...paymentForm, note: event.target.value })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showParentPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Submit Payment</h3>
              <button
                onClick={() => setShowParentPayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <img
                src="/qr_code.png"
                alt="Static QR"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl shadow-sm bg-white p-2 flex-shrink-0"
              />
              <div className="text-center sm:text-left flex flex-col justify-center h-full sm:mt-6">
                <p className="font-bold text-indigo-900 text-lg">
                  Tadika Khalifah Muda
                </p>
                <p className="text-base font-semibold text-indigo-800 font-mono mt-2 bg-indigo-100 inline-block px-3 py-1.5 rounded-lg">
                  Maybank: 1122 3344 5566
                </p>
                <p className="text-sm text-indigo-600 mt-4 leading-relaxed">
                  Scan the QR code to the left or transfer manually to the account
                  above.
                </p>
              </div>
            </div>

            <form onSubmit={handleParentPaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paying Amount (RM)
                </label>
                <input
                  type="number"
                  required
                  readOnly
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none cursor-not-allowed font-bold"
                  value={parentPayForm.amountPaid}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Receipt Image/PDF
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl relative group hover:border-indigo-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          required
                          onChange={(event) =>
                            setParentPayForm({
                              ...parentPayForm,
                              receipt: event.target.files[0],
                            })
                          }
                        />
                      </label>
                    </div>
                    {parentPayForm.receipt ? (
                      <p className="text-xs text-green-600 font-medium break-all">
                        {parentPayForm.receipt.name}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 flex justify-center items-center gap-2"
                >
                  {formSubmitting ? "Uploading..." : "Submit Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
