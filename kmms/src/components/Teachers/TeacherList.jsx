import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, User, Briefcase, DollarSign, Save, X, Search, Eye, EyeOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import { getClasses } from "../../api/classes";

const TeacherList = ({ teachers = [], onAdd, onUpdate, onDelete }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState("Active");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedTeacherId(expandedTeacherId === id ? null : id);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    icNumber: "",
    password: "",
    classAssigned: "",
    qualification: "",
    hireDate: "",
    status: "Active",
    salaryProfile: {
      baseSalary: 0,
      overtimeRate: 0,
      bankName: "",
      bankAccountNo: "",
      epfNo: "",
      taxNo: "",
      eisNo: "",
      pcbNo: ""
    }
  });

  useEffect(() => {
    async function fetchClasses() {
      try {
        const data = await getClasses();
        setAvailableClasses(data || []);
      } catch (error) {
        console.error("Failed to load classes:", error);
      }
    }
    fetchClasses();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      icNumber: "",
      password: "",
      classAssigned: "",
      qualification: "",
      hireDate: "",
      status: "Active",
      salaryProfile: {
        baseSalary: 0,
        overtimeRate: 0,
        bankName: "",
        bankAccountNo: "",
        epfNo: "",
        taxNo: "",
        eisNo: "",
        pcbNo: ""
      }
    });
    setEditingTeacher(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sync legacy fields for compatibility
    const payload = {
      ...formData,
      epfNo: formData.salaryProfile.epfNo,
      taxNo: formData.salaryProfile.taxNo
    };

    if (editingTeacher) {
      if (!payload.password) {
        delete payload.password;
      }
      await onUpdate(editingTeacher._id || editingTeacher.id, payload);
    } else {
      await onAdd(payload);
    }

    resetForm();
  };

  const filteredTeachers = teachers.filter(
    (t) => (t.status || "Active") === activeTab &&
      (t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Teacher Management</h2>
          <p className="text-sm text-gray-500">Manage all teacher's details.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-6 py-6 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Teacher
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
            <DialogHeader className="bg-emerald-600 p-8 text-white rounded-t-3xl">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {editingTeacher ? "Edit Teacher Record" : "Register New Teacher"}
              </DialogTitle>
              <p className="text-emerald-100 text-xs mt-1">Complete all sections to maintain accurate staff records.</p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* 1. PERSONAL INFO */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                  <User className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                    <Input
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">IC Number</label>
                    <Input
                      placeholder="e.g. 900101-01-1234"
                      value={formData.icNumber}
                      onChange={(e) => setFormData({ ...formData, icNumber: e.target.value })}
                      required
                      className="bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <Input
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  {!editingTeacher && (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Initial Password</label>
                      <Input
                        type="password"
                        placeholder="Set login password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* 2. EMPLOYMENT INFO */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employment Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Qualification / Position</label>
                    <select
                      className="w-full bg-gray-50 border-transparent rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium h-[50px]"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      required
                    >
                      <option value="">Select Qualification</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Degree">Degree</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Hire Date</label>
                    <Input
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      required
                      className="bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Class Assigned</label>
                    <select
                      className="w-full bg-gray-50 border-transparent rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium h-[50px]"
                      value={formData.classAssigned}
                      onChange={(e) => setFormData({ ...formData, classAssigned: e.target.value })}
                      required
                    >
                      <option value="">Select Class</option>
                      {availableClasses.map((cls) => (
                        <option key={cls._id} value={cls.className}>{cls.className}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Status</label>
                    <select
                      className="w-full bg-gray-50 border-transparent rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium h-[50px]"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 3. PAYROLL INFO */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payroll & Statutory Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Basic Salary (RM)</label>
                    <Input
                      type="number"
                      value={formData.salaryProfile.baseSalary}
                      onChange={(e) => setFormData({ ...formData, salaryProfile: { ...formData.salaryProfile, baseSalary: Number(e.target.value) } })}
                      required
                      className="bg-white border-gray-200 focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Overtime Rate (RM/hr)</label>
                    <Input
                      type="number"
                      value={formData.salaryProfile.overtimeRate}
                      onChange={(e) => setFormData({ ...formData, salaryProfile: { ...formData.salaryProfile, overtimeRate: Number(e.target.value) } })}
                      required
                      className="bg-white border-gray-200 focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">EPF Number</label>
                    <Input
                      placeholder="EPF Number"
                      value={formData.salaryProfile.epfNo}
                      onChange={(e) => setFormData({ ...formData, salaryProfile: { ...formData.salaryProfile, epfNo: e.target.value } })}
                      className="bg-white border-gray-200 focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Income Tax Number</label>
                    <Input
                      placeholder="Tax Number"
                      value={formData.salaryProfile.taxNo}
                      onChange={(e) => setFormData({ ...formData, salaryProfile: { ...formData.salaryProfile, taxNo: e.target.value } })}
                      className="bg-white border-gray-200 focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Bank Name</label>
                    <Input
                      placeholder="e.g. Maybank"
                      value={formData.salaryProfile.bankName}
                      onChange={(e) => setFormData({ ...formData, salaryProfile: { ...formData.salaryProfile, bankName: e.target.value } })}
                      className="bg-white border-gray-200 focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Bank Account Number</label>
                    <Input
                      placeholder="Account Number"
                      value={formData.salaryProfile.bankAccountNo}
                      onChange={(e) => setFormData({ ...formData, salaryProfile: { ...formData.salaryProfile, bankAccountNo: e.target.value } })}
                      className="bg-white border-gray-200 focus:ring-2 focus:ring-emerald-200 rounded-xl py-6"
                    />
                  </div>
                </div>
              </section>

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="ghost" onClick={resetForm} className="flex-1 py-6 rounded-2xl font-bold uppercase text-xs tracking-widest text-gray-400 hover:bg-gray-50 transition-all">
                  Discard
                </Button>
                <Button type="submit" className="flex-1 py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  {editingTeacher ? "Update Record" : "Register Teacher"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-1">
        <div className="flex space-x-2">
          {["Active", "Inactive"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-6 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
            >
              {tab} Teachers
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64 mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Quick search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-100 outline-none text-xs transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-3xl border-2 border-gray-300 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-300 bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="w-16 px-6 font-black text-[10px] uppercase tracking-widest">#</TableHead>
                  <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest">Teacher</TableHead>
                  <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest">IC / Phone</TableHead>
                  <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest">Class</TableHead>
                  <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest">Hire Date</TableHead>
                  <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredTeachers.map((teacher, index) => (
                  <React.Fragment key={teacher._id || teacher.id}>
                    <TableRow className="hover:bg-emerald-50/30 transition-colors">
                      <TableCell className="px-6 py-4 font-bold text-gray-400 text-xs">{index + 1}.</TableCell>
                      <TableCell className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{teacher.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{teacher.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-700">{teacher.icNumber || "—"}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{teacher.phone || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="rounded-lg border-emerald-100 text-emerald-700 bg-emerald-50/50 text-[10px] font-bold px-2 py-0.5">
                          {teacher.classAssigned || "Unassigned"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-medium text-gray-500">
                        {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString("en-MY", { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge
                          className={`rounded-full text-[9px] font-black uppercase tracking-widest border ${teacher.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50"
                            : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-50"
                            }`}
                        >
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            className={`p-2 rounded-xl transition-all ${expandedTeacherId === (teacher._id || teacher.id)
                              ? "bg-emerald-100 text-emerald-700"
                              : "hover:bg-emerald-50 hover:text-emerald-600 text-gray-400"
                              }`}
                            onClick={() => toggleExpand(teacher._id || teacher.id)}
                            title={expandedTeacherId === (teacher._id || teacher.id) ? "Hide Details" : "View All Details"}
                          >
                            {expandedTeacherId === (teacher._id || teacher.id) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            className="hover:bg-emerald-50 hover:text-emerald-600 text-gray-400 p-2 rounded-xl transition-all"
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setFormData({
                                name: teacher.name || "",
                                email: teacher.email || "",
                                phone: teacher.phone || "",
                                icNumber: teacher.icNumber || "",
                                password: "",
                                classAssigned: teacher.classAssigned || "",
                                qualification: teacher.qualification || "",
                                hireDate: teacher.hireDate ? teacher.hireDate.split("T")[0] : "",
                                status: teacher.status || "Active",
                                salaryProfile: teacher.salaryProfile || {
                                  baseSalary: 0,
                                  overtimeRate: 0,
                                  bankName: "",
                                  bankAccountNo: "",
                                  epfNo: "",
                                  taxNo: "",
                                  eisNo: "",
                                  pcbNo: ""
                                }
                              });
                              setIsDialogOpen(true);
                            }}
                            title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {expandedTeacherId === (teacher._id || teacher.id) && (
                      <TableRow className="bg-gray-50/50 border-b border-gray-100/80 animate-in fade-in slide-in-from-top-2 duration-300">
                        <TableCell colSpan={7} className="px-8 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            {/* Left Column: Personal & Employment */}
                            <div className="space-y-4 bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50/20 to-primary-light/5 rounded-bl-full pointer-events-none" />
                              <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-600 border-b border-gray-50 pb-2 flex items-center gap-2">
                                <User className="w-3.5 h-3.5" /> Profile & Personal Details
                              </h4>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Full Name</span>
                                  <span className="text-gray-800 font-bold">{teacher.name}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Email Address</span>
                                  <span className="text-gray-800 font-bold">{teacher.email}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Phone Number</span>
                                  <span className="text-gray-800 font-bold">{teacher.phone || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">IC / Passport</span>
                                  <span className="text-gray-800 font-bold">{teacher.icNumber || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Qualification</span>
                                  <span className="text-gray-800 font-bold">{teacher.qualification || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Class Assigned</span>
                                  <span className="text-emerald-700 font-bold">{teacher.classAssigned || "Unassigned"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Hire Date</span>
                                  <span className="text-gray-800 font-bold">{teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString("en-MY", { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Account Status</span>
                                  <span className={`capitalize font-bold ${teacher.status === 'Active' ? 'text-emerald-600' : 'text-gray-500'}`}>{teacher.status || "Active"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Column: Payroll & Statutory */}
                            <div className="space-y-4 bg-white p-6 rounded-2xl border-2 border-gray-300 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50/20 to-primary-light/5 rounded-bl-full pointer-events-none" />
                              <h4 className="font-black text-[10px] uppercase tracking-widest text-emerald-600 border-b border-gray-50 pb-2 flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5" /> Salary & Banking Details
                              </h4>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Basic Salary</span>
                                  <span className="text-gray-800 font-bold">RM {teacher.salaryProfile?.baseSalary ?? "0"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Overtime Rate</span>
                                  <span className="text-gray-800 font-bold">RM {teacher.salaryProfile?.overtimeRate ?? "0"} / hour</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Bank Name</span>
                                  <span className="text-gray-800 font-bold">{teacher.salaryProfile?.bankName || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Account Number</span>
                                  <span className="text-gray-800 font-bold">{teacher.salaryProfile?.bankAccountNo || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">EPF Number</span>
                                  <span className="text-gray-800 font-bold">{teacher.salaryProfile?.epfNo || "—"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">Tax Number</span>
                                  <span className="text-gray-800 font-bold">{teacher.salaryProfile?.taxNo || "—"}</span>
                                </div>
                                {teacher.salaryProfile?.eisNo && (
                                  <div>
                                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">EIS Number</span>
                                    <span className="text-gray-800 font-bold">{teacher.salaryProfile.eisNo}</span>
                                  </div>
                                )}
                                {teacher.salaryProfile?.pcbNo && (
                                  <div>
                                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5">PCB Number</span>
                                    <span className="text-gray-800 font-bold">{teacher.salaryProfile.pcbNo}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}

                {filteredTeachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <User className="w-12 h-12" />
                        <p className="font-bold text-lg uppercase tracking-tighter">No {activeTab} Records</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherList;