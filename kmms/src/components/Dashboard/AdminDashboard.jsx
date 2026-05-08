import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  CheckCircle,
  ClipboardList,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { getStudents } from "../../api/students";
import { getTeachers } from "../../api/teachers";
import { getClasses } from "../../api/classes";
import { getAttendance } from "../../api/attendance";
import { getAllLeaves, updateLeaveStatus } from "../../api/leaves";

import LiveDateTime from "../Common/LiveDateTime";

export default function AdminDashboard({ setActiveTab }) {
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeTeachers, setActiveTeachers] = useState(0);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState({
    present: 0,
    total: 0,
  });
  const [teacherAttendanceCount, setTeacherAttendanceCount] = useState({
    present: 0,
    total: 0,
  });
  const [pendingLeavesList, setPendingLeavesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const studentsData = await getStudents();
      const activeStudents = studentsData.filter(s =>
        s.status && s.status.toLowerCase() === "active"
      );
      const pendingStudents = studentsData.filter(s =>
        s.status && s.status.toLowerCase() === "pending"
      );
      setTotalStudents(activeStudents.length);
      setPendingEnrollments(pendingStudents);

      const teachersData = await getTeachers();
      const activeTeachersList = teachersData.filter(t =>
        t.status && t.status.toLowerCase() === "active"
      );
      setActiveTeachers(activeTeachersList.length);

      const dateObj = new Date();
      const today = dateObj.toISOString().split('T')[0];

      const allClasses = await getClasses();
      const attendancePromises = allClasses.map(cls =>
        getAttendance(today, cls._id).catch(() => null)
      );

      const results = await Promise.all(attendancePromises);

      let totalPresent = 0;
      results.forEach((record) => {
        if (record && record.records) {
          const classPresent = record.records.filter(r => 
            r.status?.toLowerCase() === "present" && (r.studentId?.status || "active").toLowerCase() === "active"
          ).length;
          totalPresent += classPresent;
        }
      });

      setAttendanceToday({
        present: totalPresent,
        total: activeStudents.length,
      });

      try {
        const leavesData = await getAllLeaves();
        const todayMs = new Date(today).getTime();

        const absentTeacherIds = new Set(
          leavesData.filter(leave => {
            if (leave.status?.toLowerCase() === "approved") {
              const st = new Date(new Date(leave.startDate).toISOString().split('T')[0]).getTime();
              const en = new Date(new Date(leave.endDate || leave.startDate).toISOString().split('T')[0]).getTime();
              return todayMs >= st && todayMs <= en;
            }
            return false;
          }).map(leave => leave.teacher?._id).filter(Boolean)
        );

        const activeTeacherIds = new Set(activeTeachersList.map(t => t._id));
        const absentActiveTeachersCount = [...absentTeacherIds].filter(id => activeTeacherIds.has(id)).length;
        
        setTeacherAttendanceCount({
          present: Math.max(activeTeachersList.length - absentActiveTeachersCount, 0),
          total: activeTeachersList.length
        });

        setPendingLeavesList(leavesData.filter(l => l.status?.toLowerCase() === "pending"));
      } catch (leaveErr) {
        console.warn("Could not fetch leaves:", leaveErr);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleReviewLeave = async (id, action) => {
    try {
      await updateLeaveStatus(id, action);
      loadDashboardData();
    } catch (err) {
      console.error("Failed to review leave:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-brand-textSecondary font-medium">Preparing your dashboard...</p>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, onClick, trend }) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 hover:shadow-premium transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-brand-textSecondary text-sm font-bold uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-brand-text font-poppins">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-status-success text-xs font-bold">
               <TrendingUp className="w-3 h-3" />
               <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-brand-text font-poppins tracking-tight">System Overview</h2>
          <p className="text-brand-textSecondary mt-2 text-lg font-medium">Everything is running smoothly today.</p>
        </div>
        <LiveDateTime />
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard
          title="Students"
          value={totalStudents}
          icon={Users}
          color="from-primary to-primary-dark"
          onClick={() => setActiveTab("users")}
          trend="+4 new this month"
        />
        <StatCard
          title="Teachers"
          value={activeTeachers}
          icon={BookOpen}
          color="from-secondary to-secondary-dark"
          onClick={() => setActiveTab("teachers")}
        />
        <StatCard
          title="Student Attendance"
          value={`${attendanceToday.present}/${attendanceToday.total}`}
          icon={CheckCircle}
          color="from-accent to-accent-dark"
          onClick={() => setActiveTab("attendance")}
        />
        <StatCard
          title="Pending Registration"
          value={pendingEnrollments.length}
          icon={UserPlus}
          color="from-pink-400 to-pink-600"
          onClick={() => setActiveTab("users")}
        />
      </div>

      {/* BOTTOM PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* PENDING ENROLLMENTS */}
        <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100/50 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-primary/10 rounded-2xl">
                 <UserPlus className="w-6 h-6 text-primary" />
               </div>
               <h3 className="text-2xl font-bold text-brand-text font-poppins tracking-tight">New Enrollments</h3>
            </div>
            <button onClick={() => setActiveTab("users")} className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
               View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {pendingEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-gray-300" />
               </div>
               <p className="text-brand-textSecondary font-medium italic">No pending applications at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEnrollments.slice(0, 4).map(student => (
                <div key={student._id} className="p-5 border border-gray-50 rounded-3xl bg-brand-bg/30 flex items-center justify-between group hover:bg-white hover:shadow-premium hover:border-transparent transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-bold text-primary uppercase">
                       {student.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-brand-text group-hover:text-primary transition-colors">{student.name}</p>
                      <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-wider mt-0.5">
                        {student.classId?.className || 'Awaiting Placement'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("users")}
                    className="rounded-xl font-bold border-2 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-transparent transition-all"
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PENDING LEAVE */}
        <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100/50 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="p-3 bg-accent/10 rounded-2xl">
                 <AlertCircle className="w-6 h-6 text-accent-dark" />
               </div>
               <h3 className="text-2xl font-bold text-brand-text font-poppins tracking-tight">Leave Requests</h3>
            </div>
            <button onClick={() => setActiveTab("leave")} className="text-accent-dark font-bold text-sm hover:underline flex items-center gap-1">
               Manage <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {pendingLeavesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-10 h-10 text-gray-300" />
               </div>
               <p className="text-brand-textSecondary font-medium italic">All staff are accounted for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLeavesList.slice(0, 4).map(leave => (
                <div key={leave._id} className="p-5 border border-gray-50 rounded-3xl bg-brand-bg/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white hover:shadow-premium transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                       <GraduationCap className="w-6 h-6 text-accent-dark" />
                    </div>
                    <div>
                      <p className="font-bold text-brand-text">{leave.teacher?.name || 'Staff'}</p>
                      <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-tighter">
                        {new Date(leave.startDate).toLocaleDateString()}
                        {leave.endDate && ` — ${new Date(leave.endDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReviewLeave(leave._id, 'approve')}
                      className="p-3 bg-secondary/10 text-secondary-dark rounded-xl hover:bg-secondary hover:text-white transition-all shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleReviewLeave(leave._id, 'reject')}
                      className="p-3 bg-status-error/10 text-status-error rounded-xl hover:bg-status-error hover:text-white transition-all shadow-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Loader2 = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

const X = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const GraduationCap = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);