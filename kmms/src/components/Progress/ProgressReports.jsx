import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  Loader2,
  Pencil,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import {
  createProgressReport,
  getProgressReports,
  updateProgressReport,
} from "../../api/progress";
import { getStudents } from "../../api/students";
import { getClasses } from "../../api/classes";

const DEFAULT_FORM = {
  studentId: "",
  summary: "",
};

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const getStudentStatus = (student) =>
  String(student?.status || "active").toLowerCase();

const ProgressReports = ({ role, user }) => {
  const normalizedRole = String(role || "").toLowerCase();
  const isTeacher = normalizedRole === "teacher";
  const isParent = normalizedRole === "parent";
  const isAdmin = normalizedRole === "admin";

  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("all");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [normalizedRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [getStudents(), getProgressReports()];
      if (isAdmin) {
        promises.push(getClasses());
      }
      const results = await Promise.all(promises);
      setStudents(Array.isArray(results[0]) ? results[0] : []);
      setReports(Array.isArray(results[1]) ? results[1] : []);
      if (isAdmin) {
        setClasses(Array.isArray(results[2]) ? results[2] : []);
      }
    } catch (error) {
      console.error("Failed to load progress reports", error);
      setStudents([]);
      setReports([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedStudents = useMemo(
    () =>
      [...students].sort((left, right) =>
        String(left.name || "").localeCompare(String(right.name || ""))
      ),
    [students]
  );

  const activeStudents = useMemo(
    () => sortedStudents.filter((student) => getStudentStatus(student) === "active"),
    [sortedStudents]
  );

  const filteredStudentsForFilterDropdown = useMemo(() => {
    if (!isAdmin || selectedClassFilter === "all") {
      return activeStudents;
    }
    return activeStudents.filter(
      (student) => getIdValue(student.classId) === selectedClassFilter
    );
  }, [activeStudents, selectedClassFilter, isAdmin]);

  const filteredReports = useMemo(() => {
    const base = [...reports].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
    );

    return base.filter((report) => {
      if (isAdmin && selectedClassFilter !== "all") {
        const studentClassId = getIdValue(report.studentId?.classId);
        if (studentClassId !== selectedClassFilter) return false;
      }
      if (selectedStudentFilter !== "all") {
        const studentId = getIdValue(report.studentId);
        if (studentId !== selectedStudentFilter) return false;
      }
      return true;
    });
  }, [reports, selectedClassFilter, selectedStudentFilter, isAdmin]);

  const latestReportsByStudent = useMemo(
    () =>
      activeStudents.map((student) => {
        const studentReports = reports
          .filter((report) => getIdValue(report.studentId) === getIdValue(student))
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

        return {
          student,
          latestReport: studentReports[0] || null,
          reportCount: studentReports.length,
        };
      }),
    [activeStudents, reports]
  );

  const latestReportDate = reports[0]?.createdAt
    ? new Date(reports[0].createdAt).toLocaleDateString()
    : "No reports yet";

  const handleClassFilterChange = (classId) => {
    setSelectedClassFilter(classId);
    setSelectedStudentFilter("all");
  };

  const openCreateModal = (studentId = "") => {
    setEditingReport(null);
    setForm({
      studentId,
      summary: "",
    });
    setShowModal(true);
  };

  const openEditModal = (report) => {
    setEditingReport(report);
    setForm({
      studentId: getIdValue(report.studentId),
      summary: report.summary || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReport(null);
    setForm(DEFAULT_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);

    try {
      if (editingReport) {
        await updateProgressReport(editingReport._id, form);
      } else {
        await createProgressReport(form);
      }

      closeModal();
      await fetchData();
    } catch (error) {
      alert("Failed to save progress report");
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Progress Reports</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage progress reports for your class{user?.classAssigned ? `: ${user.classAssigned}` : ""}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateModal(activeStudents[0]?._id || "")}
            className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Progress Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Active Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{activeStudents.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Reports Written</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{reports.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Latest Update</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{latestReportDate}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Latest Reports by Student</h3>
              <p className="text-sm text-gray-500 mt-1">
                Each active student in your class can have a progress note and report history.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <UserRound className="w-4 h-4 text-gray-400" />
              <select
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={selectedStudentFilter}
                onChange={(event) => setSelectedStudentFilter(event.target.value)}
              >
                <option value="all">All Students</option>
                {activeStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {latestReportsByStudent.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No students found in your class.
            </div>
          ) : (
            <div className="space-y-4">
              {latestReportsByStudent
                .filter(({ student }) =>
                  selectedStudentFilter === "all"
                    ? true
                    : getIdValue(student) === selectedStudentFilter
                )
                .map(({ student, latestReport, reportCount }) => (
                  <div
                    key={student._id}
                    className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl border-2 border-gray-300 bg-white shadow-sm items-start"
                  >
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-gray-900">{student.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {student.classId?.className || user?.classAssigned || "Assigned Class"}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          {reportCount} report{reportCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      {latestReport ? (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(latestReport.createdAt).toLocaleDateString()}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {latestReport.summary}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                          No progress report written yet for this student.
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 w-full md:w-auto md:min-w-[140px] pt-1">
                      <button
                        type="button"
                        onClick={() => openCreateModal(student._id)}
                        className="flex-1 md:flex-none w-full px-3 py-2 rounded-xl border border-accent/20 text-accent font-medium text-sm hover:bg-accent/5 flex justify-center items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> New Report
                      </button>
                      {latestReport && (
                        <button
                          type="button"
                          onClick={() => openEditModal(latestReport)}
                          className="flex-1 md:flex-none w-full px-3 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                          <Pencil className="w-4 h-4" /> Edit Latest
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Report History</h3>
            <p className="text-sm text-gray-500 mt-1">
              Recent reports written for your class.
            </p>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No reports found.</div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="w-3.5 h-3.5" />
                      {report.studentId?.name || "Student"}
                      <span>•</span>
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(report.createdAt).toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditModal(report)}
                    className="self-start px-3 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-white flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingReport ? "Edit Progress Report" : "Create Progress Report"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Save a progress note for a student in your class.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <select
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-sm bg-white"
                    value={form.studentId}
                    onChange={(event) =>
                      setForm({ ...form, studentId: event.target.value })
                    }
                    required
                  >
                    <option value="">Select student...</option>
                    {activeStudents.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Summary
                  </label>
                  <textarea
                    rows="8"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Write the student's learning progress, strengths, behavior, and any follow-up notes..."
                    value={form.summary}
                    onChange={(event) =>
                      setForm({ ...form, summary: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border rounded-xl font-medium text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-xl font-medium"
                  >
                    {formSubmitting
                      ? "Saving..."
                      : editingReport
                        ? "Update Report"
                        : "Create Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Reports</h2>
          <p className="text-gray-500 text-sm mt-1">
            View your child&apos;s learning updates and teacher progress notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Children Linked</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{students.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Reports Available</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{reports.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border-2 border-gray-300 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Latest Report</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{latestReportDate}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Child Reports</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select a child to focus on a specific report history.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <UserRound className="w-4 h-4 text-gray-400" />
              <select
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={selectedStudentFilter}
                onChange={(event) => setSelectedStudentFilter(event.target.value)}
              >
                <option value="all">All Children</option>
                {sortedStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
              No progress reports available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="rounded-2xl border-2 border-gray-300 bg-white shadow-sm p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">
                        {report.studentId?.name || "Student"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">
                        {report.studentId?.classId?.className || "Class not assigned"}
                      </p>
                      <p className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1.5">
                        <span>Posted by :</span>
                        <span className="text-gray-800 font-bold">{report.teacherId?.name || "Teacher"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(report.createdAt).toLocaleString()}
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {report.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-poppins">Child Progress Reports</h2>
          <p className="text-gray-500 text-sm mt-1">
            Review learning progress notes and development history submitted by teachers.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeStudents.length}</p>
            </div>
            <p className="text-xs text-gray-400 mt-4 font-medium">Active enrolled students</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reports Logged</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reports.length}</p>
            </div>
            <p className="text-xs text-gray-400 mt-4 font-medium">Total reports submitted by staff</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-gray-300 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest Update</p>
              <p className="text-lg font-bold text-gray-900 mt-2.5">{latestReportDate}</p>
            </div>
            <p className="text-xs text-gray-400 mt-4 font-medium">Date of most recent report entry</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Student Progress Feed</h3>
              <p className="text-sm text-gray-500 mt-1">
                Use the filters to narrow down reports by class and individual student.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <select
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer pr-4"
                  value={selectedClassFilter}
                  onChange={(event) => handleClassFilterChange(event.target.value)}
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.className}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Filter */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                <UserRound className="w-4 h-4 text-gray-400" />
                <select
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer pr-4"
                  value={selectedStudentFilter}
                  onChange={(event) => setSelectedStudentFilter(event.target.value)}
                >
                  <option value="all">All Students</option>
                  {filteredStudentsForFilterDropdown.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reports Grid/List */}
          {filteredReports.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No progress reports found matching your selection.</p>
              <p className="text-gray-400 text-sm mt-1">Teachers will create reports directly from their dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className="bg-white rounded-2xl border-2 border-gray-300 hover:border-accent/20 hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-gray-900 font-poppins">
                          {report.studentId?.name || "Student"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500">
                          <span className="font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {report.studentId?.classId?.className || "Awaiting Class"}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-accent bg-accent/5 px-2 py-0.5 rounded">
                            Posted by: {report.teacherId?.name || "Teacher"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-50 bg-gray-50/50 p-4 min-h-[100px]">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-poppins">
                        {report.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Logged on: {new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
      Progress reports are not available for this role.
    </div>
  );
};

export default ProgressReports;
