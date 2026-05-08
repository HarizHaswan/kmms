import React, { useMemo, useState } from "react";
import { Plus, Edit, Search, GraduationCap, CheckCircle, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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

const StudentList = ({
  students = [],
  teachers = [],
  classes = [],
  onDelete,
  onAdd,
  onUpdate,
  onAddClass,
  onApprove,
  onReject,
  userRole = "admin",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgeGroup, setFilterAgeGroup] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentView, setStudentView] = useState("current");
  const [isExistingParent, setIsExistingParent] = useState(false);
  const [historyYear, setHistoryYear] = useState("all");
  const [historyMonth, setHistoryMonth] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    classId: "",
    parentName: "",
    parentIcNumber: "",
    parentPhoneNumber: "",
    homeAddress: "",
    parentEmail: "",
    parentPassword: "",
    status: "active",
  });

  const [classFormData, setClassFormData] = useState({
    className: "",
    yearGroup: "",
  });

  const getStudentAge = (student) => {
    if (student.age) return Number(student.age);
    if (student.dateOfBirth) {
      const dob = new Date(student.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    }
    return 0;
  };

  const filteredStudents = students.filter((student) => {
    if (studentView === "current" && (student.status === "graduated" || student.status === "withdrawn" || student.status === "pending")) {
      return false;
    }
    if (studentView === "history" && (student.status === "active" || student.status === "pending")) {
      return false;
    }
    if (studentView === "pending" && student.status !== "pending") {
      return false;
    }

    if (studentView === "history") {
      const regDate = student.registrationDate ? new Date(student.registrationDate) : null;
      if (historyYear !== "all") {
        if (!regDate || regDate.getFullYear() !== Number(historyYear)) return false;
      }
      if (historyMonth !== "all") {
        if (!regDate || regDate.getMonth() + 1 !== Number(historyMonth)) return false;
      }
    }

    const q = searchQuery.toLowerCase();
    const studentName = student.name?.toLowerCase() || "";
    const className = student.classId?.className?.toLowerCase() || "";
    const parentName = student.parentName?.toLowerCase() || "";
    
    const matchesSearch =
      !q ||
      studentName.includes(q) ||
      className.includes(q) ||
      parentName.includes(q);

    const studentAge = getStudentAge(student);
    const matchesAgeFilter =
      filterAgeGroup === "all" ||
      Number(filterAgeGroup) === studentAge;

    const studentClassId = typeof student.classId === 'object' ? student.classId?._id : student.classId;
    const matchesClassFilter =
      filterClass === "all" ||
      studentClassId === filterClass;

    return matchesSearch && matchesAgeFilter && matchesClassFilter;
  }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const stats = useMemo(
    () => ({
      total: students.filter(s => s.status === "active").length,
      age4: students.filter((s) => getStudentAge(s) === 4 && s.status === "active").length,
      age5: students.filter((s) => getStudentAge(s) === 5 && s.status === "active").length,
      age6: students.filter((s) => getStudentAge(s) === 6 && s.status === "active").length,
    }),
    [students]
  );

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      registrationDate: new Date().toISOString().split('T')[0],
      classId: formData.classId,
      parentName: formData.parentName,
      parentIcNumber: formData.parentIcNumber,
      parentPhoneNumber: formData.parentPhoneNumber,
      homeAddress: formData.homeAddress,
      parentEmail: formData.parentEmail,
      parentPassword: formData.parentPassword,
      status: formData.status,
      isExistingParent: isExistingParent
    };

    try {
      if (editingStudent) {
        await onUpdate(editingStudent._id || editingStudent.id, payload);
      } else {
        await onAdd(payload);
      }
      setFormData({
        name: "",
        dateOfBirth: "",
        gender: "",
        classId: "",
        parentName: "",
        parentIcNumber: "",
        parentPhoneNumber: "",
        homeAddress: "",
        parentEmail: "",
        parentPassword: "",
        status: "active",
      });
      setEditingStudent(null);
      setIsAddDialogOpen(false);
      setIsExistingParent(false);
    } catch (err) {
      console.error("Form submission failed:", err);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: "bg-green-100 text-green-700 border-green-200",
      graduated: "bg-blue-100 text-blue-700 border-blue-200",
      withdrawn: "bg-red-100 text-red-700 border-red-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200"
    };
    return statusStyles[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    try {
      await onAddClass({
        className: classFormData.className,
        yearGroup: classFormData.yearGroup,
      });
      setClassFormData({
        className: "",
        yearGroup: "",
      });
      setIsAddClassDialogOpen(false);
    } catch (error) {
      console.error("Failed to add class:", error);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10 font-inter">
      {/* HEADER + ADD BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-brand-text font-poppins tracking-tight">
            Student Management
          </h2>
          <p className="text-brand-textSecondary mt-1 font-medium italic">
            Manage your kindergarten's student records and enrollments.
          </p>
        </div>

        {userRole === "admin" && (
          <div className="flex gap-4">
            <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-secondary/20 transition-all active:scale-95">
                  <Plus className="w-5 h-5" />
                  New Class
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-premium p-0 overflow-hidden">
                <div className="bg-gradient-to-r from-secondary to-secondary-dark p-8 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-poppins">Add New Class</DialogTitle>
                    <p className="text-white/80 text-sm font-medium">Create a new learning group.</p>
                  </DialogHeader>
                </div>

                <form onSubmit={handleAddClassSubmit} className="p-8 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-widest mb-2">
                      Class Name *
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all placeholder:text-brand-textSecondary/50 font-medium"
                      placeholder="e.g., 4A, 5B, 6C"
                      value={classFormData.className}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, className: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-textSecondary uppercase tracking-widest mb-2">
                      Year Group (Age) *
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all appearance-none cursor-pointer font-bold"
                      value={classFormData.yearGroup}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, yearGroup: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Age Group</option>
                      <option value="4">4 Years Old</option>
                      <option value="5">5 Years Old</option>
                      <option value="6">6 Years Old</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 rounded-2xl font-bold text-brand-textSecondary hover:bg-brand-bg"
                      onClick={() => setIsAddClassDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-secondary hover:bg-secondary-dark text-white rounded-2xl font-bold shadow-lg shadow-secondary/20">
                      Create Class
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                  <Plus className="w-5 h-5" />
                  Add Student
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-premium p-0 scrollbar-hide">
                 <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white sticky top-0 z-10">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold font-poppins">
                        {editingStudent ? "Edit Student Record" : "Enroll New Student"}
                      </DialogTitle>
                      <p className="text-white/80 text-sm font-medium">Please fill in the details below.</p>
                    </DialogHeader>
                 </div>

                 <form onSubmit={handleAddSubmit} className="p-8 space-y-8">
                    <div className="space-y-4">
                       <h4 className="text-xs font-extrabold text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <div className="h-1 w-6 bg-primary rounded-full"></div>
                          Child's Information
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
                            <input
                              className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                              placeholder="Student's name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Date of Birth *</label>
                            <input
                              type="date"
                              className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                              value={formData.dateOfBirth}
                              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                              required
                            />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Gender *</label>
                            <select
                              className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer"
                              value={formData.gender}
                              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                              required
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Assigned Class *</label>
                            <select
                              className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer"
                              value={formData.classId}
                              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                              required
                            >
                              <option value="">Select Class</option>
                              {classes.map((c) => (
                                <option key={c._id} value={c._id}>{c.name || c.className}</option>
                              ))}
                            </select>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-extrabold text-secondary-dark uppercase tracking-[0.2em] flex items-center gap-2">
                             <div className="h-1 w-6 bg-secondary rounded-full"></div>
                             Parent / Guardian Details
                          </h4>
                          {!editingStudent && (
                             <div className="flex items-center gap-2 bg-brand-bg px-3 py-1.5 rounded-xl border border-gray-100">
                                <span className="text-[10px] font-bold text-brand-textSecondary uppercase">Existing Parent?</span>
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer"
                                  checked={isExistingParent}
                                  onChange={() => setIsExistingParent(!isExistingParent)}
                                />
                             </div>
                          )}
                       </div>

                       {isExistingParent ? (
                          <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 space-y-4">
                             <div>
                                <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5">Registered Parent Email *</label>
                                <input
                                  type="email"
                                  className="w-full px-4 py-3 bg-white border border-transparent rounded-2xl shadow-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all font-medium"
                                  placeholder="Enter exact registered email"
                                  value={formData.parentEmail}
                                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                                  required
                                />
                             </div>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             <div>
                                <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Parent Full Name *</label>
                                <input
                                  className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                                  placeholder="Guardian name"
                                  value={formData.parentName}
                                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                  required={!editingStudent}
                                />
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                   <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">IC / Passport Number</label>
                                   <input
                                     className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                                     placeholder="900101-01-XXXX"
                                     value={formData.parentIcNumber}
                                     onChange={(e) => setFormData({ ...formData, parentIcNumber: e.target.value })}
                                   />
                                </div>
                                <div>
                                   <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                   <input
                                     className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                                     placeholder="012-XXXXXXX"
                                     value={formData.parentPhoneNumber}
                                     onChange={(e) => setFormData({ ...formData, parentPhoneNumber: e.target.value })}
                                   />
                                </div>
                             </div>
                             
                             {!editingStudent && (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                     <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Login Email *</label>
                                     <input
                                       type="email"
                                       className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                                       placeholder="parent@example.com"
                                       value={formData.parentEmail}
                                       onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                                       required
                                     />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Temporary Password *</label>
                                     <input
                                       type="password"
                                       className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                                       placeholder="Set portal password"
                                       value={formData.parentPassword}
                                       onChange={(e) => setFormData({ ...formData, parentPassword: e.target.value })}
                                       required
                                     />
                                  </div>
                               </div>
                             )}
                          </div>
                       )}

                       <div>
                          <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-1.5 ml-1">Home Address</label>
                          <textarea
                            className="w-full px-4 py-3 bg-brand-bg border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium resize-none"
                            rows={3}
                            placeholder="Enter home address"
                            value={formData.homeAddress}
                            onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                          />
                       </div>
                    </div>

                    {editingStudent && (
                       <div className="pt-4 border-t border-gray-100">
                          <label className="block text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mb-2 ml-1">Enrollment Status</label>
                          <div className="flex gap-4">
                             {['active', 'graduated', 'withdrawn'].map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, status })}
                                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
                                     formData.status === status 
                                     ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                     : 'bg-brand-bg text-brand-textSecondary hover:bg-gray-200'
                                  }`}
                                >
                                   {status}
                                </button>
                             ))}
                          </div>
                       </div>
                    )}

                    <div className="flex gap-3 pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1 rounded-2xl font-bold text-brand-textSecondary hover:bg-brand-bg h-14"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingStudent(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/20 h-14 text-lg">
                        {editingStudent ? "Update Record" : "Enroll Student"}
                      </Button>
                    </div>
                 </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 flex items-center justify-between group hover:shadow-premium transition-all duration-300">
          <div>
            <p className="text-brand-textSecondary text-xs font-bold uppercase tracking-widest mb-1">Total Students</p>
            <h3 className="text-3xl font-extrabold text-brand-text font-poppins">{stats.total}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 flex items-center justify-between group hover:shadow-premium transition-all duration-300">
          <div>
            <p className="text-brand-textSecondary text-xs font-bold uppercase tracking-widest mb-1">4 Years Old</p>
            <h3 className="text-3xl font-extrabold text-accent-dark font-poppins">{stats.age4}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-accent/10 text-accent-dark group-hover:scale-110 transition-transform duration-300 font-extrabold font-poppins text-lg shadow-sm">
            4Y
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 flex items-center justify-between group hover:shadow-premium transition-all duration-300">
          <div>
            <p className="text-brand-textSecondary text-xs font-bold uppercase tracking-widest mb-1">5 Years Old</p>
            <h3 className="text-3xl font-extrabold text-secondary-dark font-poppins">{stats.age5}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/10 text-secondary-dark group-hover:scale-110 transition-transform duration-300 font-extrabold font-poppins text-lg shadow-sm">
            5Y
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 flex items-center justify-between group hover:shadow-premium transition-all duration-300">
          <div>
            <p className="text-brand-textSecondary text-xs font-bold uppercase tracking-widest mb-1">6 Years Old</p>
            <h3 className="text-3xl font-extrabold text-primary-dark font-poppins">{stats.age6}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-primary/10 text-primary-dark group-hover:scale-110 transition-transform duration-300 font-extrabold font-poppins text-lg shadow-sm">
            6Y
          </div>
        </div>
      </div>

      {/* DIRECTORY SECTION */}
      <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100/50 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
               <h3 className="text-2xl font-bold text-brand-text font-poppins tracking-tight">Student Directory</h3>
               <p className="text-sm font-medium text-brand-textSecondary mt-1">Found {filteredStudents.length} records</p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <select
                className="bg-brand-bg px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest text-brand-textSecondary border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none pr-10 cursor-pointer shadow-sm"
                value={filterAgeGroup}
                onChange={(e) => setFilterAgeGroup(e.target.value)}
              >
                <option value="all">All Ages</option>
                <option value="4">4 Years</option>
                <option value="5">5 Years</option>
                <option value="6">6 Years</option>
              </select>

              <select
                className="bg-brand-bg px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest text-brand-textSecondary border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none pr-10 cursor-pointer shadow-sm"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name || c.className}
                  </option>
                ))}
              </select>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-textSecondary group-focus-within:text-primary transition-colors" />
                <input
                  className="bg-brand-bg pl-11 pr-5 py-2.5 rounded-2xl text-sm font-bold text-brand-text border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-72 placeholder:text-brand-textSecondary/50 shadow-sm"
                  placeholder="Search students or parents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* VIEW TABS */}
        <div className="flex gap-8 px-8 pt-6 border-b border-gray-50 bg-brand-bg/10">
          {[
            { id: 'current', label: 'Active Students' },
            { id: 'pending', label: 'Pending Requests', count: students.filter(s => s.status === 'pending').length },
            { id: 'history', label: 'Archived / History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStudentView(tab.id)}
              className={`pb-4 text-xs font-extrabold tracking-widest uppercase transition-all relative flex items-center gap-2 ${
                studentView === tab.id ? "text-primary" : "text-brand-textSecondary hover:text-brand-text"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="w-5 h-5 rounded-full bg-status-error text-white text-[10px] flex items-center justify-center shadow-lg shadow-status-error/20 animate-pulse">
                   {tab.count}
                </span>
              )}
              {studentView === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-t-full animate-in slide-in-from-bottom-1" />}
            </button>
          ))}
        </div>

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-brand-bg/50">
              <TableRow className="border-none">
                <TableHead className="font-extrabold text-brand-textSecondary uppercase tracking-widest text-[10px] py-6 pl-8">#</TableHead>
                <TableHead className="font-extrabold text-brand-textSecondary uppercase tracking-widest text-[10px] py-6">Student Information</TableHead>
                <TableHead className="font-extrabold text-brand-textSecondary uppercase tracking-widest text-[10px] py-6">Class / Age</TableHead>
                <TableHead className="font-extrabold text-brand-textSecondary uppercase tracking-widest text-[10px] py-6">Parent Details</TableHead>
                <TableHead className="font-extrabold text-brand-textSecondary uppercase tracking-widest text-[10px] py-6">Status</TableHead>
                <TableHead className="font-extrabold text-brand-textSecondary uppercase tracking-widest text-[10px] py-6 text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                         <Search className="w-10 h-10 text-gray-300" />
                      </div>
                      <p className="text-brand-textSecondary font-bold text-lg font-poppins">No students found</p>
                      <p className="text-brand-textSecondary/60 text-sm mt-1">Try adjusting your filters or search query.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow key={student._id} className="hover:bg-brand-bg/30 transition-all border-b border-gray-50 group">
                    <TableCell className="py-5 pl-8 text-xs font-bold text-brand-textSecondary/50">
                      {index + 1}
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-white shadow-soft border border-gray-100 text-primary flex items-center justify-center font-extrabold text-sm uppercase group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          {student.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-brand-text group-hover:text-primary transition-colors text-base leading-tight">{student.name}</p>
                          <p className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-widest mt-1">{student.gender} • {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-text text-sm">{student.classId?.className || "N/A"}</span>
                        <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-tighter mt-0.5">{getStudentAge(student)} Years Old</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-text text-sm">{student.parentName || "—"}</span>
                        <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-tighter mt-0.5">{student.parentPhoneNumber || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm border ${getStatusBadge(student.status)}`}>
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-5 text-right pr-8">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        {student.status === "pending" ? (
                          <>
                            <button
                              onClick={() => onApprove(student._id)}
                              className="p-3 bg-secondary/10 text-secondary-dark rounded-xl hover:bg-secondary hover:text-white transition-all shadow-sm"
                              title="Approve Enrollment"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onReject(student._id)}
                              className="p-3 bg-status-error/10 text-status-error rounded-xl hover:bg-status-error hover:text-white transition-all shadow-sm"
                              title="Reject Application"
                            >
                              <Plus className="w-5 h-5 rotate-45" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setFormData({
                                  ...student,
                                  classId: typeof student.classId === 'object' ? student.classId?._id : student.classId,
                                  dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ""
                                });
                                setIsAddDialogOpen(true);
                              }}
                              className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                              title="Edit Record"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this student permanent record?")) {
                                    onDelete(student._id || student.id);
                                  }
                                }}
                                className="p-3 bg-status-error/10 text-status-error rounded-xl hover:bg-status-error hover:text-white transition-all shadow-sm"
                                title="Delete Permanently"
                              >
                                <Plus className="w-5 h-5 rotate-45" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default StudentList;