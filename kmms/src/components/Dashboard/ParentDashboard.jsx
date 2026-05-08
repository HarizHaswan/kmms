import React, { useEffect, useState } from "react";
import { 
  Users, 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Sparkles,
  ArrowRight,
  Heart,
  Baby,
  Calendar,
  Loader2
} from "lucide-react";
import { getStudents } from "../../api/students";
import { getActivities } from "../../api/activities";
import { getInvoices } from "../../api/invoices";
import { getStudentAttendanceStatus } from "../../api/attendance";
import LiveDateTime from "../Common/LiveDateTime";

const ParentDashboard = ({ setActiveTab, user }) => {
  const [children, setChildren] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [allActivities, setAllActivities] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const TODAY = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadParentData();
  }, []);

  // When active child changes, update child-specific data
  useEffect(() => {
    if (activeChild) {
      updateChildSpecificData(activeChild._id);
    }
  }, [activeChild]);

  const loadParentData = async () => {
    try {
      setLoading(true);
      const studentList = await getStudents();
      setChildren(studentList);
      
      if (studentList.length > 0) {
        setActiveChild(studentList[0]);
      }

      try {
        const acts = await getActivities();
        setAllActivities(Array.isArray(acts) ? acts : []);
      } catch (_) {}

      try {
        const invoices = await getInvoices();
        setAllInvoices(Array.isArray(invoices) ? invoices : []);
      } catch (_) {}

    } catch (err) {
      console.error("Failed to load parent dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateChildSpecificData = async (childId) => {
    try {
      const att = await getStudentAttendanceStatus(childId, TODAY);
      setAttendanceStatus(att?.status || "Not Recorded");
    } catch (_) {
      setAttendanceStatus("Not Recorded");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-brand-textSecondary font-bold font-poppins">Gathering children's updates...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
         <Baby className="w-16 h-16 text-gray-300 mb-4" />
         <p className="text-brand-textSecondary font-bold text-xl font-poppins">No child assigned yet.</p>
         <p className="text-brand-textSecondary/60 mt-2">Please contact the administrator to link your account.</p>
      </div>
    );
  }

  // Derived data for the active child
  const childActivities = allActivities.filter(a => a.studentId?._id === activeChild?._id || a.studentId === activeChild?._id);
  const childInvoices = allInvoices.filter(inv => inv.studentId?._id === activeChild?._id || inv.studentId === activeChild?._id);
  
  let latestInvoice = null;
  if (childInvoices.length > 0) {
    const sorted = [...childInvoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unpaid = sorted.find(inv => inv.status === "unpaid" || inv.status === "partial");
    latestInvoice = unpaid || sorted[0];
  }

  const SummaryCard = ({ title, value, icon: Icon, color, onClick, statusText }) => (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 hover:shadow-premium transition-all duration-300 cursor-pointer group active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-brand-textSecondary text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-brand-text font-poppins">{value}</h3>
          {statusText && <p className="text-[10px] font-bold text-brand-textSecondary/60 uppercase mt-1 tracking-tighter">{statusText}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-secondary-dark fill-secondary-dark" />
            <span className="text-secondary-dark font-bold text-sm uppercase tracking-widest">Parent Portal</span>
          </div>
          <h2 className="text-4xl font-bold text-brand-text font-poppins tracking-tight">Hi, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-brand-textSecondary mt-1 text-lg font-medium italic">
            {children.length > 1 
              ? `You have ${children.length} children enrolled. Select one to see details.`
              : `Check out what ${activeChild?.name.split(' ')[0]} is doing today.`
            }
          </p>
        </div>
        <LiveDateTime />
      </div>

      {/* CHILD SELECTOR TABS (If multiple children) */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-6">
          {children.map((child) => (
            <button
              key={child._id}
              onClick={() => setActiveChild(child)}
              className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] transition-all duration-300 border-2 ${
                activeChild?._id === child._id
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/25"
                  : "bg-white border-gray-100 text-brand-textSecondary hover:border-primary/30"
              }`}
            >
              <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${activeChild?._id === child._id ? 'border-white' : 'border-primary/20'}`}>
                 <img src={`https://api.dicebear.com/7.x/big-smile/svg?seed=${child.name}`} alt="" className="scale-125" />
              </div>
              <span className="font-bold font-poppins tracking-tight">{child.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* CHILD PROFILE CARD */}
      <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100/50 p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-bl-full group-hover:scale-110 transition-transform duration-700" />
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary to-secondary p-1 shadow-xl">
             <div className="w-full h-full rounded-[1.8rem] bg-white flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/big-smile/svg?seed=${activeChild?.name}`} alt="child" className="w-full h-full scale-110" />
             </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h3 className="text-3xl font-extrabold text-brand-text font-poppins mb-2">{activeChild?.name}</h3>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <div className="px-4 py-2 bg-primary/10 text-primary rounded-2xl font-bold text-sm flex items-center gap-2">
                  <Baby className="w-4 h-4" />
                  {activeChild?.age || activeChild?.dateOfBirth && Math.floor((new Date() - new Date(activeChild.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365.25))} Years Old
               </div>
               <div className="px-4 py-2 bg-secondary/10 text-secondary-dark rounded-2xl font-bold text-sm flex items-center gap-2">
                  <School className="w-4 h-4" />
                  {activeChild?.className || activeChild?.classId?.className}
               </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab("settings")}
            className="hidden lg:flex items-center gap-2 text-brand-textSecondary hover:text-primary transition-all font-bold text-sm bg-brand-bg px-5 py-3 rounded-2xl hover:shadow-md"
          >
            Update Profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SummaryCard
          title="Today's Attendance"
          value={
            attendanceStatus === "Present" ? "Present"
            : attendanceStatus === "Absent" ? "Absent"
            : "Not Marked"
          }
          icon={
            attendanceStatus === "Present" ? CheckCircle 
            : attendanceStatus === "Absent" ? XCircle 
            : Clock
          }
          color={
            attendanceStatus === "Present" ? "bg-status-success shadow-status-success/30"
            : attendanceStatus === "Absent" ? "bg-status-error shadow-status-error/30"
            : "bg-brand-textSecondary shadow-gray-400/30"
          }
          statusText={attendanceStatus === "Present" ? "Arrived on time" : "Waiting for record"}
          onClick={() => setActiveTab("child-activities")}
        />

        <SummaryCard
          title="Progress Level"
          value="View Report"
          icon={FileText}
          color="bg-primary shadow-primary/30"
          onClick={() => setActiveTab("progress")}
          statusText="Updated last week"
        />

        <SummaryCard
          title="Recent Invoice"
          value={
            !latestInvoice ? "No Invoice"
            : latestInvoice.status === "paid" ? "Paid"
            : latestInvoice.status === "partial" ? "Partial"
            : `RM ${latestInvoice.amount ?? "—"}`
          }
          icon={DollarSign}
          color={
            !latestInvoice ? "bg-gray-400"
            : latestInvoice.status === "paid" ? "bg-status-success shadow-status-success/30"
            : latestInvoice.status === "partial" ? "bg-status-warning shadow-status-warning/30"
            : "bg-accent shadow-accent/30 text-accent-dark"
          }
          statusText={!latestInvoice ? "N/A" : `Status: ${latestInvoice.status}`}
          onClick={() => setActiveTab("payments")}
        />
      </div>

      {/* RECENT ACTIVITIES PANEL */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-100/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-2xl">
              <Camera className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-brand-text font-poppins tracking-tight">Today's Activities</h3>
          </div>
          <button
            onClick={() => setActiveTab("child-activities")}
            className="text-secondary font-bold text-sm hover:underline flex items-center gap-1"
          >
            All Activities <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {childActivities.filter(a => a.date === TODAY).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childActivities
              .filter(a => a.date === TODAY)
              .map((act) => (
                <div
                  key={act._id}
                  className="p-5 bg-brand-bg/40 border border-transparent rounded-[1.5rem] hover:bg-white hover:shadow-premium hover:border-gray-50 transition-all duration-300 group flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-bold text-secondary text-xs">
                     {act.time?.split(' ')[0]}
                  </div>
                  <div className="flex-1">
                     <p className="font-extrabold text-brand-text text-lg group-hover:text-secondary transition-colors leading-tight mb-1">{act.activity}</p>
                     <p className="text-sm text-brand-textSecondary leading-relaxed">{act.notes}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
             <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                <Camera className="w-10 h-10 text-gray-300" />
             </div>
             <p className="text-brand-textSecondary font-medium italic">No activities logged yet for today.</p>
             <button
                onClick={() => setActiveTab("child-activities")}
                className="mt-3 text-sm font-bold text-secondary hover:underline"
              >
                View History
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

const School = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

export default ParentDashboard;
