import React from "react";

const DashboardCard = ({ title, value, icon: Icon, color, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-100/50 hover:shadow-premium transition-all duration-300 cursor-pointer group active:scale-[0.98] relative overflow-hidden"
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-brand-textSecondary text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-brand-text font-poppins">{value}</h3>
        </div>
        <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] rounded-bl-[4rem] -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110`} />
    </div>
  );
};

export default DashboardCard;
