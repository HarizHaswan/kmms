import React, { useState, useEffect, useCallback } from "react";
import { 
  Loader2, Plus, CheckCircle, Clock, Search, Edit2, 
  Check, X, Download, FileText, Settings, User, 
  DollarSign, TrendingUp, AlertCircle, Save, Calendar,
  ShieldCheck, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { 
  getPayrollRecords, 
  generatePayroll, 
  getPayrollStats, 
  updatePayrollRecord, 
  markPayrollAsPaid 
} from "../../api/payroll";
import { getTeachers, updateTeacher } from "../../api/teachers";
import { downloadPayslipPdf } from "../../utils/payslipPdf";

const AdminPayroll = () => {
  const [activeTab, setActiveTab] = useState("payroll"); // "payroll" | "profiles"
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showStatDetails, setShowStatDetails] = useState(null); // id of record showing details
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [profileForm, setProfileForm] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordData, teacherData, statsData] = await Promise.all([
        getPayrollRecords({ month, year }),
        getTeachers(),
        getPayrollStats({ month, year })
      ]);
      setRecords(recordData);
      setTeachers(teacherData.filter(t => t.status === "Active"));
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch payroll data:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for all active teachers for ${month}/${year}?`)) return;
    try {
      const res = await generatePayroll({ month, year });
      alert(res.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Generation failed");
    }
  };

  const startEditing = (record) => {
    setEditingId(record._id);
    setEditForm({
      overtimeHours: record.overtimeHours,
      bonus: record.bonus,
      deductions: record.deductions,
      allowances: record.allowances,
      statutory: record.statutory || {
        epf: { employer: 0, employee: 0 },
        socso: { employer: 0, employee: 0 },
        eis: { employer: 0, employee: 0 },
        pcb: 0
      },
      remarks: record.remarks,
      status: record.status
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
    setShowStatDetails(null);
  };

  const saveEdit = async (id) => {
    try {
      await updatePayrollRecord(id, editForm);
      setEditingId(null);
      setShowStatDetails(null);
      fetchData();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handlePay = async (id) => {
    if (!window.confirm("Mark this payroll as PAID?")) return;
    try {
      await markPayrollAsPaid(id);
      fetchData();
    } catch (err) {
      alert("Payment record failed");
    }
  };

  const openProfileEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setProfileForm(teacher.salaryProfile || {
      baseSalary: 0,
      overtimeRate: 0,
      bankName: "",
      bankAccountNo: "",
      epfNo: "",
      taxNo: "",
      eisNo: "",
      pcbNo: "",
      defaultStatutory: {
        epf: { employer: 0, employee: 0 },
        socso: { employer: 0, employee: 0 },
        eis: { employer: 0, employee: 0 },
        pcb: 0
      },
      allowances: { housing: 0, transport: 0, other: 0 }
    });
    setShowProfileModal(true);
  };

  const autoCalculateStatutory = () => {
    const base = Number(profileForm.baseSalary || 0);
    if (!base) return;

    setProfileForm({
      ...profileForm,
      defaultStatutory: {
        ...profileForm.defaultStatutory,
        epf: {
          employer: Math.ceil(base * 0.13), // 13% Employer
          employee: Math.ceil(base * 0.11)  // 11% Employee
        },
        eis: {
          employer: Number((base * 0.002).toFixed(2)), // 0.2% Employer
          employee: Number((base * 0.002).toFixed(2))  // 0.2% Employee
        },
        // SOCSO and PCB remain manual for accuracy
      }
    });
  };

  const saveProfile = async () => {
    try {
      await updateTeacher(selectedTeacher._id, { salaryProfile: profileForm });
      setShowProfileModal(false);
      fetchData();
    } catch (err) {
      alert("Profile update failed");
    }
  };

  const formatMoney = (val) => Number(val || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 });

  if (loading && !records.length && !teachers.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-gray-500 font-medium">Loading payroll engine...</p>
      </div>
    );
  }

  const filteredRecords = records.filter(r => 
    r.teacher?.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">Payroll Hub</h2>
          <p className="text-gray-500 text-sm mt-1">Manage staff salaries and statutory contributions</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("payroll")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "payroll" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Payroll Run
          </button>
          <button 
            onClick={() => setActiveTab("profiles")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "profiles" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Salary Profiles
          </button>
        </div>
      </div>

      {activeTab === "payroll" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Net Payable</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">RM {formatMoney(stats?.totalNetSalary)}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Paid</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">RM {formatMoney(stats?.totalPaid)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-amber-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pending</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">RM {formatMoney(stats?.totalPending)}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Staff</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{teachers.length}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search teacher by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all text-sm shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
                <select 
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-gray-700 px-3 py-1.5 outline-none cursor-pointer"
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <select 
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-gray-700 px-3 py-1.5 outline-none cursor-pointer"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button 
                onClick={handleGenerate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Generate Payroll
              </button>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Staff Details</th>
                    <th className="px-6 py-4 text-center">Base</th>
                    <th className="px-6 py-4 text-center">OT Pay</th>
                    <th className="px-6 py-4 text-center">Allowances</th>
                    <th className="px-6 py-4 text-center">Statutory (EE)</th>
                    <th className="px-6 py-4 text-center">Bonus/Deduc</th>
                    <th className="px-6 py-4 text-center">Net Salary</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-40">
                          <FileText className="w-12 h-12" />
                          <p className="font-bold text-lg text-gray-500 uppercase">No records for {month}/{year}</p>
                          <p className="text-sm">Click "Generate Payroll" to begin.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const isEditing = editingId === r._id;
                      const isStatDetails = showStatDetails === r._id;

                      return (
                        <React.Fragment key={r._id}>
                          <tr className={`hover:bg-indigo-50/30 transition-colors ${isEditing ? "bg-indigo-50/50" : ""}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-xs">
                                  {r.teacher?.profileImage ? (
                                    <img src={r.teacher.profileImage} alt="" className="w-full h-full rounded-xl object-cover" />
                                  ) : (
                                    r.teacher?.name?.[0]
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{r.teacher?.name}</p>
                                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">REF: {r._id.slice(-6)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <p className="font-bold text-gray-700">RM {formatMoney(r.baseSalary)}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <input 
                                    type="number" 
                                    value={editForm.overtimeHours}
                                    onChange={(e) => setEditForm({...editForm, overtimeHours: Number(e.target.value)})}
                                    className="w-16 p-1 text-center border rounded-lg outline-none focus:ring-2 ring-indigo-200"
                                  />
                                  <p className="text-[10px] text-gray-400">Rate: {r.overtimeRate}/hr</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-bold text-gray-700">{r.overtimeHours} hrs</p>
                                  <p className="text-[10px] text-indigo-600 font-bold">RM {formatMoney(r.overtimePay)}</p>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="flex flex-col gap-1 items-center">
                                  <input 
                                    type="number" 
                                    placeholder="H"
                                    value={editForm.allowances.housing}
                                    onChange={(e) => setEditForm({...editForm, allowances: {...editForm.allowances, housing: Number(e.target.value)}})}
                                    className="w-20 p-1 text-xs text-center border rounded-lg"
                                  />
                                  <input 
                                    type="number" 
                                    placeholder="T"
                                    value={editForm.allowances.transport}
                                    onChange={(e) => setEditForm({...editForm, allowances: {...editForm.allowances, transport: Number(e.target.value)}})}
                                    className="w-20 p-1 text-xs text-center border rounded-lg"
                                  />
                                </div>
                              ) : (
                                <p className="font-bold text-emerald-600">+ RM {formatMoney(r.totalAllowances - r.bonus)}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <p className="font-bold text-rose-600">- RM {formatMoney(r.totalStatutoryEmployee)}</p>
                                {isEditing && (
                                  <button 
                                    onClick={() => setShowStatDetails(isStatDetails ? null : r._id)}
                                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1"
                                  >
                                    Manage {isStatDetails ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="flex flex-col gap-1 items-center">
                                  <input 
                                    type="number" 
                                    placeholder="Bonus"
                                    value={editForm.bonus}
                                    onChange={(e) => setEditForm({...editForm, bonus: Number(e.target.value)})}
                                    className="w-20 p-1 text-xs text-center border rounded-lg bg-emerald-50"
                                  />
                                  <input 
                                    type="number" 
                                    placeholder="Deduc"
                                    value={editForm.deductions}
                                    onChange={(e) => setEditForm({...editForm, deductions: Number(e.target.value)})}
                                    className="w-20 p-1 text-xs text-center border rounded-lg bg-rose-50"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {r.bonus > 0 && <p className="text-[10px] text-emerald-600 font-bold">+ RM {formatMoney(r.bonus)}</p>}
                                  {r.deductions > 0 && <p className="text-[10px] text-rose-600 font-bold">- RM {formatMoney(r.deductions)}</p>}
                                  {r.bonus === 0 && r.deductions === 0 && <span className="text-gray-300">—</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <p className="text-lg font-black text-gray-900">RM {formatMoney(r.netSalary)}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {isEditing ? (
                                  <select 
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                    className="text-[10px] p-1 border rounded-md outline-none"
                                  >
                                    <option value="Draft">Draft</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                  </select>
                                ) : (
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    r.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                    r.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                    "bg-gray-50 text-gray-600 border-gray-100"
                                  }`}>
                                    {r.status}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => saveEdit(r._id)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all">
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button onClick={cancelEditing} className="p-2 bg-white border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-50 transition-all">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => startEditing(r)} 
                                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                      title="Edit Adjustments"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => downloadPayslipPdf(r)}
                                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                      title="Download Payslip"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    {r.status !== "Paid" && (
                                      <button 
                                        onClick={() => handlePay(r._id)}
                                        className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100"
                                      >
                                        Pay
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          
                          {/* Statutory Breakdown Edit Panel */}
                          {isStatDetails && isEditing && (
                            <tr className="bg-indigo-50/50">
                              <td colSpan="9" className="px-8 py-6 border-y border-indigo-100">
                                <div className="max-w-4xl mx-auto space-y-6">
                                  <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Statutory Contribution Breakdown</h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {/* EPF */}
                                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">KWSP (EPF)</p>
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Employer</label>
                                        <input 
                                          type="number"
                                          value={editForm.statutory.epf.employer}
                                          onChange={(e) => setEditForm({
                                            ...editForm, 
                                            statutory: { ...editForm.statutory, epf: { ...editForm.statutory.epf, employer: Number(e.target.value) } }
                                          })}
                                          className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Employee</label>
                                        <input 
                                          type="number"
                                          value={editForm.statutory.epf.employee}
                                          onChange={(e) => setEditForm({
                                            ...editForm, 
                                            statutory: { ...editForm.statutory, epf: { ...editForm.statutory.epf, employee: Number(e.target.value) } }
                                          })}
                                          className="w-full p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-700"
                                        />
                                      </div>
                                    </div>

                                    {/* SOCSO */}
                                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">PERKESO (SOCSO)</p>
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Employer</label>
                                        <input 
                                          type="number"
                                          value={editForm.statutory.socso.employer}
                                          onChange={(e) => setEditForm({
                                            ...editForm, 
                                            statutory: { ...editForm.statutory, socso: { ...editForm.statutory.socso, employer: Number(e.target.value) } }
                                          })}
                                          className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Employee</label>
                                        <input 
                                          type="number"
                                          value={editForm.statutory.socso.employee}
                                          onChange={(e) => setEditForm({
                                            ...editForm, 
                                            statutory: { ...editForm.statutory, socso: { ...editForm.statutory.socso, employee: Number(e.target.value) } }
                                          })}
                                          className="w-full p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-700"
                                        />
                                      </div>
                                    </div>

                                    {/* EIS */}
                                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">SIP (EIS)</p>
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Employer</label>
                                        <input 
                                          type="number"
                                          value={editForm.statutory.eis.employer}
                                          onChange={(e) => setEditForm({
                                            ...editForm, 
                                            statutory: { ...editForm.statutory, eis: { ...editForm.statutory.eis, employer: Number(e.target.value) } }
                                          })}
                                          className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Employee</label>
                                        <input 
                                          type="number"
                                          value={editForm.statutory.eis.employee}
                                          onChange={(e) => setEditForm({
                                            ...editForm, 
                                            statutory: { ...editForm.statutory, eis: { ...editForm.statutory.eis, employee: Number(e.target.value) } }
                                          })}
                                          className="w-full p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-700"
                                        />
                                      </div>
                                    </div>

                                    {/* PCB */}
                                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">PCB (Tax)</p>
                                      <div>
                                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">Employee Tax</label>
                                        <input 
                                          type="number"
                                          value={editForm.statutory.pcb}
                                          onChange={(e) => setEditForm({
                                            ...editForm, 
                                            statutory: { ...editForm.statutory, pcb: Number(e.target.value) }
                                          })}
                                          className="w-full p-2 bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-700 h-[88px]"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end gap-3 pt-4 border-t border-indigo-100">
                                    <div className="text-right">
                                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total EE Contribution</p>
                                      <p className="text-sm font-black text-rose-600">RM {formatMoney(
                                        (editForm.statutory.epf.employee || 0) +
                                        (editForm.statutory.socso.employee || 0) +
                                        (editForm.statutory.eis.employee || 0) +
                                        (editForm.statutory.pcb || 0)
                                      )}</p>
                                    </div>
                                    <div className="w-px h-8 bg-indigo-100 mx-2" />
                                    <button 
                                      onClick={() => setShowStatDetails(null)}
                                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                                    >
                                      Close Breakdown
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* SALARY PROFILES TAB */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search teacher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4 w-10">#</th>
                    <th className="px-6 py-4">Teacher</th>
                    <th className="px-6 py-4 text-center">Base Salary</th>
                    <th className="px-6 py-4 text-center">OT Rate</th>
                    <th className="px-6 py-4 text-center">Bank Account</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTeachers.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">No teachers found.</td></tr>
                  ) : (
                    filteredTeachers.map((t, idx) => (
                      <tr key={t._id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-400 select-none">{idx + 1}.</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                              {t.profileImage ? (
                                <img src={t.profileImage} alt="" className="w-full h-full rounded-lg object-cover" />
                              ) : (
                                t.name[0]
                              )}
                            </div>
                            <span className="font-bold text-gray-900">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-700">RM {formatMoney(t.salaryProfile?.baseSalary)}</td>
                        <td className="px-6 py-4 text-center font-bold text-gray-700">RM {formatMoney(t.salaryProfile?.overtimeRate)}/hr</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-bold border border-gray-100">
                            {t.salaryProfile?.bankName || "N/A"} • {t.salaryProfile?.bankAccountNo || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => openProfileEdit(t)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Configure Profile"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase">Salary Profile Settings</h3>
                <p className="text-indigo-100 text-xs mt-1">Configure compensation for {selectedTeacher?.name}</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Core & Allowances */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Core Compensation
                  </h4>
                  <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Base Salary (RM)</label>
                      <input 
                        type="number"
                        value={profileForm.baseSalary}
                        onChange={(e) => setProfileForm({...profileForm, baseSalary: Number(e.target.value)})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-indigo-200 outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Overtime Rate (RM/hr)</label>
                      <input 
                        type="number"
                        value={profileForm.overtimeRate}
                        onChange={(e) => setProfileForm({...profileForm, overtimeRate: Number(e.target.value)})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 ring-indigo-200 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 pt-4">
                    <TrendingUp className="w-4 h-4" /> Recurring Allowances
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Housing</label>
                      <input 
                        type="number"
                        value={profileForm.allowances?.housing}
                        onChange={(e) => setProfileForm({...profileForm, allowances: {...profileForm.allowances, housing: Number(e.target.value)}})}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Transport</label>
                      <input 
                        type="number"
                        value={profileForm.allowances?.transport}
                        onChange={(e) => setProfileForm({...profileForm, allowances: {...profileForm.allowances, transport: Number(e.target.value)}})}
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Default Statutory (RM)
                    </h4>
                    <button 
                      onClick={autoCalculateStatutory}
                      className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-all flex items-center gap-1"
                      title="Calculate based on Base Salary"
                    >
                      Auto-Calculate EPF & EIS
                    </button>
                  </div>
                  <div className="space-y-4 bg-rose-50/30 p-5 rounded-2xl border border-rose-100/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">EPF (Employer)</label>
                        <input 
                          type="number" 
                          value={profileForm.defaultStatutory?.epf?.employer} 
                          onChange={(e) => setProfileForm({...profileForm, defaultStatutory: {...profileForm.defaultStatutory, epf: {...profileForm.defaultStatutory.epf, employer: Number(e.target.value)}}})} 
                          className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">EPF (Employee)</label>
                        <input 
                          type="number" 
                          value={profileForm.defaultStatutory?.epf?.employee} 
                          onChange={(e) => setProfileForm({...profileForm, defaultStatutory: {...profileForm.defaultStatutory, epf: {...profileForm.defaultStatutory.epf, employee: Number(e.target.value)}}})} 
                          className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">SOCSO (Emplr)</label>
                        <input 
                          type="number" 
                          value={profileForm.defaultStatutory?.socso?.employer} 
                          onChange={(e) => setProfileForm({...profileForm, defaultStatutory: {...profileForm.defaultStatutory, socso: {...profileForm.defaultStatutory.socso, employer: Number(e.target.value)}}})} 
                          className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">SOCSO (EE)</label>
                        <input 
                          type="number" 
                          value={profileForm.defaultStatutory?.socso?.employee} 
                          onChange={(e) => setProfileForm({...profileForm, defaultStatutory: {...profileForm.defaultStatutory, socso: {...profileForm.defaultStatutory.socso, employee: Number(e.target.value)}}})} 
                          className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">EIS (Emplr)</label>
                        <input 
                          type="number" 
                          value={profileForm.defaultStatutory?.eis?.employer} 
                          onChange={(e) => setProfileForm({...profileForm, defaultStatutory: {...profileForm.defaultStatutory, eis: {...profileForm.defaultStatutory.eis, employer: Number(e.target.value)}}})} 
                          className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">EIS (EE)</label>
                        <input 
                          type="number" 
                          value={profileForm.defaultStatutory?.eis?.employee} 
                          onChange={(e) => setProfileForm({...profileForm, defaultStatutory: {...profileForm.defaultStatutory, eis: {...profileForm.defaultStatutory.eis, employee: Number(e.target.value)}}})} 
                          className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" 
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-gray-500 mb-1 uppercase">PCB (Employee Tax)</label>
                        <input 
                          type="number" 
                          value={profileForm.defaultStatutory?.pcb} 
                          onChange={(e) => setProfileForm({...profileForm, defaultStatutory: {...profileForm.defaultStatutory, pcb: Number(e.target.value)}})} 
                          className="w-full p-2 bg-white border border-gray-100 rounded-lg text-xs font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Identity & Bank */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4" /> Statutory IDs & Bank
                  </h4>
                  <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">EPF Number</label>
                      <input 
                        type="text"
                        value={profileForm.epfNo}
                        onChange={(e) => setProfileForm({...profileForm, epfNo: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tax Number</label>
                      <input 
                        type="text"
                        value={profileForm.taxNo}
                        onChange={(e) => setProfileForm({...profileForm, taxNo: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">SIP (EIS)</label>
                        <input 
                          type="text"
                          value={profileForm.eisNo}
                          onChange={(e) => setProfileForm({...profileForm, eisNo: e.target.value})}
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">PCB (Tax)</label>
                        <input 
                          type="text"
                          value={profileForm.pcbNo}
                          onChange={(e) => setProfileForm({...profileForm, pcbNo: e.target.value})}
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bank Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. Maybank"
                        value={profileForm.bankName}
                        onChange={(e) => setProfileForm({...profileForm, bankName: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Account Number</label>
                      <input 
                        type="text"
                        value={profileForm.bankAccountNo}
                        onChange={(e) => setProfileForm({...profileForm, bankAccountNo: e.target.value})}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8 mt-8 border-t border-gray-100">
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all uppercase text-xs tracking-widest"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={saveProfile}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                >
                  <Save className="w-5 h-5" />
                  Save Salary Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
