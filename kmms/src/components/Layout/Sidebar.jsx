import React from "react";
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  Camera,
  CheckCircle,
  DollarSign,
  BarChart,
  LogOut,
  Bell,
  X,
  Banknote,
  Settings,
  MessageCircle,
  LayoutDashboard,
  GraduationCap
} from "lucide-react";

const Sidebar = ({
  role,
  activeTab,
  setActiveTab,
  onLogout,
  isOpen,
  onClose
}) => {
  const common = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  ];

  const adminTabs = [
    { id: "users", label: "Student List", icon: Users },
    { id: "teachers", label: "Teacher Staff", icon: GraduationCap },
    { id: "attendance", label: "Attendance", icon: CheckCircle },
    { id: "timetables", label: "Timetables", icon: Calendar },
    { id: "leave", label: "Leave Requests", icon: FileText },
    { id: "salary", label: "Staff Salary", icon: Banknote },
    { id: "payments", label: "Fee Management", icon: DollarSign },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "reports", label: "Analytics", icon: BarChart },
    { id: "settings", label: "System Settings", icon: Settings },
  ];

  const teacherTabs = [
    { id: "students", label: "My Students", icon: Users },
    { id: "attendance", label: "Take Attendance", icon: CheckCircle },
    { id: "activities", label: "Activity Blast", icon: Camera },
    { id: "timetables", label: "My Schedule", icon: Calendar },
    { id: "progress", label: "Progress Reports", icon: BarChart },
    { id: "salary", label: "Payslips", icon: Banknote },
    { id: "leave-request", label: "Apply Leave", icon: FileText },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "settings", label: "Profile Settings", icon: Settings },
  ];

  const parentTabs = [
    { id: "child-activities", label: "Daily Feed", icon: Camera },
    { id: "timetables", label: "School Schedule", icon: Calendar },
    { id: "progress", label: "Child Progress", icon: BarChart },
    { id: "payments", label: "Fee Payments", icon: DollarSign },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "messages", label: "Chat", icon: MessageCircle },
    { id: "settings", label: "Profile Settings", icon: Settings },
  ];

  const navItems =
    role === "admin"
      ? [...common, ...adminTabs]
      : role === "teacher"
        ? [...common, ...teacherTabs]
        : [...common, ...parentTabs];

  const NavButton = ({ id, label, icon: Icon, isActive }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-semibold transition-all duration-300 group
        ${isActive
          ? "bg-primary text-white shadow-lg shadow-primary/25"
          : "text-brand-textSecondary hover:bg-primary/5 hover:text-primary"
        }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
      <span className="font-poppins">{label}</span>
    </button>
  );

  const sidebarContent = (
    <div className="h-full flex flex-col p-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl">
             <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-brand-text font-poppins tracking-tight">SmartKindy</h2>
        </div>
        <button
          className="md:hidden p-2 rounded-xl hover:bg-brand-bg text-brand-textSecondary"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-hide">
        {navItems.map((item) => (
          <NavButton 
            key={item.id} 
            {...item} 
            isActive={item.id === activeTab} 
          />
        ))}
      </nav>

      {/* Footer Info */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-status-error hover:bg-status-error/5 rounded-2xl text-sm font-bold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-poppins">Sign Out</span>
        </button>
        <p className="mt-4 text-[10px] text-center text-brand-textSecondary/50 font-bold uppercase tracking-widest">
          Version 2.1.0
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 bg-white border-r border-gray-100 animate-in slide-in-from-left duration-700">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden animate-in fade-in duration-300">
          <div className="w-72 bg-white h-full shadow-2xl animate-in slide-in-from-left duration-500">
            {sidebarContent}
          </div>
          <div
            className="flex-1 bg-brand-text/20 backdrop-blur-sm"
            onClick={onClose}
          />
        </div>
      )}
    </>
  );
};

export default Sidebar;
