import React, { useState, useEffect } from "react";
import { Loader2, Download, CheckCircle, Clock, Search, FileText, X, AlertCircle } from "lucide-react";
import { getMyPayslips } from "../../api/payroll";
import { downloadPayslipPdf } from "../../utils/payslipPdf";

const TeacherPayslips = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getMyPayslips();
      setSalaries(data);
    } catch (err) {
      console.error("Failed to fetch personal salary data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (m) => {
    return new Date(0, m - 1).toLocaleString("default", { month: "long" });
  };

  const formatMoney = (val) => Number(val || 0).toLocaleString("en-MY", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  const filteredSalaries = salaries.filter((s) =>
    getMonthName(s.month).toLowerCase().includes(search.toLowerCase()) ||
    s.year.toString().includes(search)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="font-medium">Fetching your payslips...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Payslips</h2>
          <p className="text-gray-500 text-sm mt-1">View your salary history and download official payslips.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by month or year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSalaries.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-3">
            <div className="p-4 bg-gray-50 rounded-full">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-bold text-gray-500">No payslips found</p>
            <p className="text-sm text-gray-400">Records will appear here once finalized by admin.</p>
          </div>
        ) : (
          filteredSalaries.map((salary) => (
            <div key={salary._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:border-indigo-100 transition-all group">
              <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">
                    {getMonthName(salary.month)} {salary.year}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                    ID: {salary._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  salary.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {salary.status}
                </span>
              </div>

              <div className="p-6 bg-gradient-to-br from-white to-gray-50/50 flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payable</span>
                  <span className="text-2xl font-black text-indigo-600">RM {salary.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-50 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedSlip(salary)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Details
                </button>
                <button
                  onClick={() => downloadPayslipPdf(salary)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSlip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 px-8 py-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Salary Breakdown</h3>
                <p className="text-indigo-100 text-xs mt-1">{getMonthName(selectedSlip.month)} {selectedSlip.year}</p>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Base Salary</span>
                <span className="font-bold text-gray-900">RM {selectedSlip.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              {/* Earnings */}
              {(selectedSlip.overtimePay > 0 || selectedSlip.totalAllowances > 0) && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-2">Earnings</p>
                  {selectedSlip.overtimePay > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Overtime ({selectedSlip.overtimeHours} hrs)</span>
                      <span className="font-bold text-emerald-600">+RM {selectedSlip.overtimePay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {selectedSlip.totalAllowances > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Allowances & Bonus</span>
                      <span className="font-bold text-emerald-600">+RM {selectedSlip.totalAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Statutory */}
              <div className="space-y-2 pt-2">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Statutory (EE)</p>
                <div className="space-y-1 bg-rose-50/30 p-3 rounded-xl border border-rose-100/50">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500">KWSP (EPF)</span>
                    <span className="font-bold text-rose-600">-RM {formatMoney(selectedSlip.statutory?.epf?.employee)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500">PERKESO (SOCSO)</span>
                    <span className="font-bold text-rose-600">-RM {formatMoney(selectedSlip.statutory?.socso?.employee)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500">SIP (EIS)</span>
                    <span className="font-bold text-rose-600">-RM {formatMoney(selectedSlip.statutory?.eis?.employee)}</span>
                  </div>
                  {selectedSlip.statutory?.pcb > 0 && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500">PCB (Tax)</span>
                      <span className="font-bold text-rose-600">-RM {formatMoney(selectedSlip.statutory?.pcb)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedSlip.deductions > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50 text-rose-600">
                  <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Other Deductions</span>
                  <span className="font-bold">-RM {selectedSlip.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-5 mt-4 bg-indigo-50 rounded-2xl px-6 border border-indigo-100">
                <span className="font-black text-indigo-700 uppercase tracking-widest text-[10px]">Total Net</span>
                <span className="font-black text-2xl text-indigo-700">RM {selectedSlip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              {selectedSlip.remarks && (
                <div className="p-4 bg-gray-50 rounded-2xl flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed"><span className="font-bold text-gray-600 uppercase text-[9px] tracking-widest block mb-1">Remarks</span>{selectedSlip.remarks}</p>
                </div>
              )}

              <button
                onClick={() => setSelectedSlip(null)}
                className="w-full mt-4 py-4 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPayslips;
