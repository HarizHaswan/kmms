import React, { useState, useEffect } from "react";
import { 
  Users, 
  Camera, 
  MessageSquare, 
  Clock, 
  Loader2, 
  CalendarDays, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import LiveDateTime from "../Common/LiveDateTime";

import { getStudents } from "../../api/students";
import { getTeacherTimetable } from "../../api/timetables"; 

const TeacherDashboard = ({ setActiveTab, user }) => {
  const [stats, setStats] = useState({
    studentCount: 0,
    activityCount: 0,
    unreadMessages: 0,
  });
  
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const assignedClass = user?.classAssigned ? user.classAssigned.trim() : ""; 

        const studentsData = await getStudents();
        const myActiveStudents = studentsData.filter(student => {
          const isActive = student.status && student.status.toLowerCase() === "active";
          const studentClassName = student.classId?.className || "";
          const isMyClass = studentClassName.trim().toLowerCase() === assignedClass.toLowerCase();
          return isActive && isMyClass;
        });
        
        const timetableData = await getTeacherTimetable();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayName = days[new Date().getDay()];
        
        const todaySlots = (timetableData || []).filter(slot => slot.day === todayName);
        todaySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

        setStats({
          studentCount: myActiveStudents.length,
          activityCount: 0, 
          unreadMessages: 0, 
        });
        setTodayTimetable(todaySlots);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-brand-textSecondary font-bold font-poppins">Readying your classroom...</p>
      </div>
    );
  }

  const StatBox = ({ title, value, icon: Icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 hover:shadow-premium transition-all duration-300 cursor-pointer group active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-inherit/20 group-hover:rotate-6 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-brand-textSecondary text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-brand-text font-poppins">{value}</h3>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-accent-dark" />
            <span className="text-accent-dark font-bold text-sm uppercase tracking-widest">Happy Teaching!</span>
          </div>
          <h2 className="text-4xl font-bold text-brand-text font-poppins tracking-tight">Welcome, {user?.name?.split(' ')[0]}</h2>
          <p className="text-brand-textSecondary mt-1 text-lg font-medium italic">You have {todayTimetable.length} classes scheduled for today.</p>
        </div>
        <LiveDateTime />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatBox
          title="My Students"
          value={stats.studentCount}
          icon={Users}
          color="bg-primary shadow-primary/30"
          onClick={() => setActiveTab("students")}
        />
        <StatBox
          title="Activities Today"
          value={stats.activityCount}
          icon={Camera}
          color="bg-secondary shadow-secondary/30"
          onClick={() => setActiveTab("activities")}
        />
        <StatBox
          title="Notifications"
          value={stats.unreadMessages}
          icon={MessageSquare}
          color="bg-accent shadow-accent/30"
          onClick={() => setActiveTab("messages")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TIMETABLE PANEL */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-100/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <CalendarDays className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-brand-text font-poppins tracking-tight">Today's Schedule</h3>
            </div>
            <button onClick={() => setActiveTab("timetables")} className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
               Full Timetable <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {todayTimetable.length > 0 ? (
            <div className="grid gap-4">
              {todayTimetable.map((slot) => (
                <div
                  key={slot._id || slot.id}
                  className="p-5 bg-brand-bg/50 border border-transparent rounded-[1.5rem] flex flex-col sm:flex-row justify-between sm:items-center hover:bg-white hover:shadow-premium hover:border-gray-50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-primary">
                       {slot.startTime?.split(':')[0]}
                    </div>
                    <div>
                      <p className="font-extrabold text-brand-text text-lg group-hover:text-primary transition-colors">
                        {slot.classId?.className || slot.subject}
                      </p>
                      <p className="text-sm font-bold text-brand-textSecondary uppercase tracking-widest mt-0.5">
                        {slot.subject}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full font-bold text-sm border border-primary/20">
                    <Clock className="w-4 h-4" />
                    {slot.startTime} — {slot.endTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                  <CalendarDays className="w-10 h-10 text-gray-300" />
               </div>
               <p className="text-brand-textSecondary font-medium italic">No classes scheduled for today. Take some rest!</p>
            </div>
          )}
        </div>

        {/* QUICK ACTIONS / TOOLS */}
        <div className="bg-gradient-to-br from-primary to-primary-dark p-8 rounded-[2.5rem] shadow-lg shadow-primary/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
          
          <h3 className="text-2xl font-bold font-poppins mb-6 relative z-10">Quick Tools</h3>
          
          <div className="space-y-4 relative z-10">
            <button 
              onClick={() => setActiveTab("attendance")}
              className="w-full bg-white/20 hover:bg-white/30 p-4 rounded-2xl flex items-center gap-4 transition-all group backdrop-blur-sm border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold">Mark Attendance</p>
                <p className="text-xs text-white/70">Start daily roll call</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>

            <button 
              onClick={() => setActiveTab("activities")}
              className="w-full bg-white/20 hover:bg-white/30 p-4 rounded-2xl flex items-center gap-4 transition-all group backdrop-blur-sm border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-secondary flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold">Blast Activity</p>
                <p className="text-xs text-white/70">Share class moments</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>

            <button 
              onClick={() => setActiveTab("progress")}
              className="w-full bg-white/20 hover:bg-white/30 p-4 rounded-2xl flex items-center gap-4 transition-all group backdrop-blur-sm border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-white text-accent-dark flex items-center justify-center shadow-lg">
                <BarChart className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold">Update Progress</p>
                <p className="text-xs text-white/70">Log student milestones</p>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          </div>

          <div className="mt-10 p-4 bg-white/10 rounded-3xl border border-white/10">
             <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Teacher Tip</p>
             <p className="text-sm italic leading-relaxed">"A small spark of kindness can light up a child's whole day."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BarChart = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
);

export default TeacherDashboard;