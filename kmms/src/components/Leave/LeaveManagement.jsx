import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Clock, Search, Filter, Paperclip, Eye, EyeOff, FileText, ShieldAlert } from "lucide-react";
import { getAllLeaves, updateLeaveStatus } from "../../api/leaves";
import { getTeachers } from "../../api/teachers";

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // ID of the request currently being updated
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [search, setSearch] = useState("");
  const [leaveView, setLeaveView] = useState("current"); // current | history
  const [teacherAttendanceToday, setTeacherAttendanceToday] = useState({ present: 0, total: 0 });
  const [historyYear, setHistoryYear] = useState("all");
  const [historyMonth, setHistoryMonth] = useState("all");
  const [historyDay, setHistoryDay] = useState("all");
  const [expandedLeaveId, setExpandedLeaveId] = useState(null); // ID of the request currently expanded

  useEffect(() => {
    fetchLeaves();
  }, []);

  const toggleExpandLeave = (id) => {
    setExpandedLeaveId(expandedLeaveId === id ? null : id);
  };

  const getDateOnly = (dateInput) => {
    const dt = new Date(dateInput);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  };

  const fetchLeaves = async () => {
    try {
      const [data, teachersData] = await Promise.all([getAllLeaves(), getTeachers()]);
      setLeaves(data);

      const activeTeachers = (teachersData || []).filter(
        (teacher) => (teacher.status || "").toLowerCase() === "active"
      );
      const activeTeacherIds = new Set(activeTeachers.map((teacher) => teacher._id));
      const today = getDateOnly(new Date()).getTime();

      const absentTeacherIds = new Set(
        data
          .filter((leave) => {
            if ((leave.status || "").toLowerCase() !== "approved") return false;
            const start = getDateOnly(leave.startDate).getTime();
            const end = getDateOnly(leave.endDate || leave.startDate).getTime();
            return today >= start && today <= end;
          })
          .map((leave) => leave.teacher?._id)
          .filter((id) => activeTeacherIds.has(id))
      );

      setTeacherAttendanceToday({
        present: Math.max(activeTeachers.length - absentTeacherIds.size, 0),
        total: activeTeachers.length,
      });
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, action) => {
    setUpdating(id);
    try {
      await updateLeaveStatus(id, action);
      // Refresh list to get updated status
      await fetchLeaves();
    } catch (err) {
      console.error(`Failed to ${action} leave request:`, err);
      const apiMessage = err?.response?.data?.message;
      alert(apiMessage || `Failed to ${action} leave request. Please try again.`);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    const today = getDateOnly(new Date());
    const leaveEnd = getDateOnly(leave.endDate || leave.startDate);
    const isPastLeave = leaveEnd < today;
    const matchesTab = leaveView === "history" ? isPastLeave : !isPastLeave;

    const historyDate = getDateOnly(leave.startDate);
    const matchesHistoryYear =
      leaveView !== "history" || historyYear === "all" || historyDate.getFullYear() === Number(historyYear);
    const matchesHistoryMonth =
      leaveView !== "history" || historyMonth === "all" || historyDate.getMonth() + 1 === Number(historyMonth);
    const matchesHistoryDay =
      leaveView !== "history" || historyDay === "all" || historyDate.getDate() === Number(historyDay);

    const matchesFilter = filter === "all" || leave.status === filter;
    const matchesSearch =
      leave.teacher?.name.toLowerCase().includes(search.toLowerCase()) ||
      leave.reason.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesFilter && matchesSearch && matchesHistoryYear && matchesHistoryMonth && matchesHistoryDay;
  });

  const stats = {
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading leave requests...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-500 text-sm mt-1">Review and manage teacher leave applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Approved Leaves</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Rejected Requests</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Teacher Attendance (Today)</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {teacherAttendanceToday.present}/{teacherAttendanceToday.total}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by teacher name or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-2 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setLeaveView("current")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            leaveView === "current"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Today / Ongoing
        </button>
        <button
          onClick={() => setLeaveView("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            leaveView === "history"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          History
        </button>
      </div>

      {leaveView === "history" && (
        <div className="flex flex-wrap gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide self-center">Filter by:</span>

          <select
            className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
            value={historyYear}
            onChange={(e) => {
              setHistoryYear(e.target.value);
              setHistoryMonth("all");
              setHistoryDay("all");
            }}
          >
            <option value="all">All Years</option>
            {[...new Set(leaves
              .filter((leave) => getDateOnly(leave.endDate || leave.startDate) < getDateOnly(new Date()))
              .map((leave) => getDateOnly(leave.startDate).getFullYear())
            )].sort((a, b) => b - a).map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <select
            className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
            value={historyMonth}
            onChange={(e) => {
              setHistoryMonth(e.target.value);
              setHistoryDay("all");
            }}
            disabled={historyYear === "all"}
          >
            <option value="all">All Months</option>
            {["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ].map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>

          <select
            className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
            value={historyDay}
            onChange={(e) => setHistoryDay(e.target.value)}
            disabled={historyYear === "all" || historyMonth === "all"}
          >
            <option value="all">All Dates</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>

          {(historyYear !== "all" || historyMonth !== "all" || historyDay !== "all") && (
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {historyYear !== "all" ? historyYear : ""}
                {historyMonth !== "all" ? ` · ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(historyMonth) - 1]}` : ""}
                {historyDay !== "all" ? ` · ${historyDay}` : ""}
              </span>
              <button
                onClick={() => {
                  setHistoryYear("all");
                  setHistoryMonth("all");
                  setHistoryDay("all");
                }}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium underline"
              >
                Clear
              </button>
            </div>
          )}

          <span className="ml-auto text-xs text-indigo-500 self-center">
            {filteredLeaves.length} record{filteredLeaves.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Leave Request List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div>
          <table className="w-full table-fixed text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 w-16">#</th>
                <th className="px-6 py-5">Teacher</th>
                <th className="px-6 py-5">Reason</th>
                <th className="px-6 py-5">Duration</th>
                <th className="px-6 py-5 text-center">Attachment</th>
                <th className="px-6 py-5">Submitted</th>
                <th className="px-6 py-5 text-center">Teacher Attendance</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center text-gray-500 text-sm font-semibold">
                    {leaveView === "history"
                      ? "No leave history found."
                      : "No today/ongoing leave requests match your criteria."}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((req, index) => {
                  return (
                    <React.Fragment key={req._id}>
                      <tr className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-5 text-gray-400 font-bold text-xs select-none">{index + 1}.</td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 leading-tight text-sm md:text-base">{req.teacher?.name || "Unknown Teacher"}</span>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{req.teacher?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-xs font-semibold text-gray-700 max-w-xs truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-gray-900 font-bold text-xs md:text-sm">
                              {new Date(req.startDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                              to {new Date(req.endDate || req.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            {req.attachment ? (
                              <a
                                href={`http://localhost:5000${req.attachment}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors"
                              >
                                <Paperclip className="w-3.5 h-3.5" /> View Document
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs italic text-center">No attachment</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-gray-500 text-xs font-semibold">
                          {new Date(req.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            {req.status === "approved" ? (
                              <span className="inline-flex items-center justify-center text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-md text-center">
                                On leave / Absent
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 text-center">
                                Present (until approved)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            {getStatusBadge(req.status)}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleExpandLeave(req._id)}
                              className={`p-2 rounded-xl transition-all ${
                                expandedLeaveId === req._id
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "hover:bg-indigo-50 hover:text-indigo-600 text-gray-400"
                              }`}
                              title={expandedLeaveId === req._id ? "Hide Details" : "View All Details"}
                            >
                              {expandedLeaveId === req._id ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            {req.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleDecision(req._id, "approve")}
                                  disabled={updating === req._id}
                                  className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                                  title="Approve"
                                >
                                  {updating === req._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDecision(req._id, "reject")}
                                  disabled={updating === req._id}
                                  className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                  title="Reject"
                                >
                                  {updating === req._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedLeaveId === req._id && (
                        <tr className="bg-gray-50/50 border-b border-gray-100/80 animate-in fade-in slide-in-from-top-2 duration-300">
                          <td colSpan="9" className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                              {/* Left Box: Full Leave details */}
                              <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/20 to-primary-light/5 rounded-bl-full pointer-events-none" />
                                <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-600 border-b border-gray-50 pb-2 flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5" /> Leave Request Details
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Leave Reason</span>
                                    <p className="text-gray-800 font-semibold text-xs leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                                      {req.reason || "No reason provided."}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Teacher</span>
                                      <span className="text-gray-800 font-bold">{req.teacher?.name || "Unknown"}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Email</span>
                                      <span className="text-gray-800 font-bold">{req.teacher?.email || "—"}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Leave Duration</span>
                                      <span className="text-gray-800 font-bold text-indigo-600">
                                        {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate || req.startDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Submitted At</span>
                                      <span className="text-gray-800 font-bold">
                                        {new Date(req.submittedAt).toLocaleDateString()} {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right Box: Admin Review & Document */}
                              <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <div className="space-y-4">
                                  <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-600 border-b border-gray-50 pb-2 flex items-center gap-2">
                                    <ShieldAlert className="w-3.5 h-3.5" /> Administrative Status
                                  </h4>
                                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold">
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Status</span>
                                      <div className="mt-1">{getStatusBadge(req.status)}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Attendance Impact</span>
                                      <span className="text-gray-800 font-bold mt-1 block">
                                        {req.status === "approved" ? "On leave / Absent" : "Present (until approved)"}
                                      </span>
                                    </div>
                                    {req.reviewedAt && (
                                      <>
                                        <div>
                                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Reviewed By</span>
                                          <span className="text-gray-800 font-bold">Administrator</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Reviewed At</span>
                                          <span className="text-gray-800 font-bold">
                                            {new Date(req.reviewedAt).toLocaleDateString()} {new Date(req.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                  <div>
                                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider mb-0.5 font-bold">Supporting Document</span>
                                    {req.attachment ? (
                                      <a
                                        href={`http://localhost:5000${req.attachment}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors mt-1"
                                      >
                                        <Paperclip className="w-3.5 h-3.5" /> View MC / Document
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 text-xs italic block mt-1">No document attached</span>
                                    )}
                                  </div>
                                </div>
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
    </div>
  );
};

export default LeaveManagement;
