import React, { useState } from "react";
import { User, Menu, LogOut, Settings, Bell, Search, ChevronDown } from "lucide-react";
import NotificationBell from "../Common/NotificationBell";

const Navbar = ({ user, onMenuClick, onLogout }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100/50">
      <div className="w-full max-w-[95rem] px-6 py-4 flex items-center justify-between mx-auto">
        
        {/* Left: Mobile Menu & Breadcrumb-style title */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2.5 rounded-xl bg-brand-bg text-brand-textSecondary hover:text-primary transition-all active:scale-95"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-brand-text font-poppins tracking-tight">
              {user.role === 'admin' ? 'Admin Central' : user.role === 'teacher' ? 'Teacher Portal' : 'Parent Dashboard'}
            </h1>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-0.5">
              SmartKindy Management System
            </p>
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-1 mr-2">
            <NotificationBell />
          </div>

          <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden sm:block"></div>

          {/* User Profile Trigger */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-brand-bg transition-all group relative"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="font-bold text-sm uppercase">
                {user.name?.charAt(0)}
              </span>
            </div>
            
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-bold text-brand-text leading-none mb-1">
                {user.name}
              </span>
              <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-tighter">
                {user.role}
              </span>
            </div>

            <ChevronDown className={`w-4 h-4 text-brand-textSecondary transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            
            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 top-[120%] w-56 bg-white border border-gray-100 rounded-[1.5rem] shadow-premium py-3 z-[60] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 mb-2 border-b border-gray-50">
                   <p className="text-xs font-bold text-brand-textSecondary uppercase tracking-widest mb-1">Signed in as</p>
                   <p className="text-sm font-bold text-brand-text truncate">{user.email}</p>
                </div>

                <button className="flex w-full items-center gap-3 px-4 py-2.5 text-brand-textSecondary hover:text-primary hover:bg-primary/5 transition-all font-medium">
                  <User className="w-4 h-4" />
                  My Profile
                </button>

                <button className="flex w-full items-center gap-3 px-4 py-2.5 text-brand-textSecondary hover:text-primary hover:bg-primary/5 transition-all font-medium">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <div className="border-t border-gray-50 my-2"></div>

                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-status-error hover:bg-status-error/5 transition-all font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
