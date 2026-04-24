import React, { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
import { Users, Camera, CheckCircle, XCircle, Clock, DollarSign, FileText } from "lucide-react";
import { getStudents } from "../../api/students";
import { getActivities } from "../../api/activities";
import { getInvoices } from "../../api/invoices";
import { getStudentAttendanceStatus } from "../../api/attendance";
import LiveDateTime from "../Common/LiveDateTime";


// IMPORTANT: ParentDashboard DOES NOT receive student data from context anymore.
// Instead, it loads REAL data from backend.

const ParentDashboard = ({ setActiveTab, user }) => {
  const [child, setChild] = useState(null);
  const [childActivities, setChildActivities] = useState([]);
  const [latestInvoice, setLatestInvoice] = useState(null); // most recent invoice for child
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const TODAY = new Date().toISOString().split("T")[0];

  // Parent ID comes from logged-in user
  //const parentId = user?._id || user?.id;

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      setLoading(true);

      // Load child — backend auto-filters by parentId
      const studentList = await getStudents();
      const myChild = studentList[0];
      setChild(myChild);

      // Load activities — backend auto-filters for parent's child
      try {
        const acts = await getActivities();
        setChildActivities(Array.isArray(acts) ? acts : []);
      } catch (_) {}

      // Load today's attendance status for the child
      if (myChild?._id) {
        try {
          const att = await getStudentAttendanceStatus(myChild._id, TODAY);
          setAttendanceStatus(att?.status || "Not Recorded");
        } catch (_) {
          setAttendanceStatus("Not Recorded");
        }
      }

      // Load invoices — backend auto-filters for parent's child via parentId→childStudentId
      try {
        const invoices = await getInvoices();
        if (Array.isArray(invoices) && invoices.length > 0) {
          // Sort by createdAt descending, pick the most recent unpaid first
          const sorted = [...invoices].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          // Prefer the first unpaid/partial, otherwise just the latest
          const unpaid = sorted.find(inv => inv.status === "unpaid" || inv.status === "partial");
          setLatestInvoice(unpaid || sorted[0]);
        }
      } catch (_) {}

    } catch (err) {
      console.error("Failed to load parent dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading your child’s data...</div>;
  }

  if (!child) {
    return <div className="p-6 text-gray-600">No child assigned yet.</div>;
  }

  return (
    <div className="space-y-6">
      <LiveDateTime />
      <h2 className="text-2xl font-bold text-gray-800">Parent Dashboard</h2>

      {/* Child Info */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold">{child.name}</h3>
            <p className="text-indigo-100">
              Age: {child.age} • Class: {child.className || child.classId?.className}
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Card 1 — Child's Attendance Today ✅ */}
        <DashboardCard
          title="Attendance Today"
          value={
            attendanceStatus === "Present" ? "✅ Present"
            : attendanceStatus === "Absent" ? "❌ Absent"
            : "— Not Recorded"
          }
          icon={
            attendanceStatus === "Present" ? CheckCircle
            : attendanceStatus === "Absent" ? XCircle
            : Clock
          }
          color={
            attendanceStatus === "Present" ? "bg-green-500"
            : attendanceStatus === "Absent" ? "bg-red-500"
            : "bg-gray-400"
          }
          onClick={() => setActiveTab("child-activities")}
        />

        {/* Card 2 — Progress Reports → progress ✅ */}
        <DashboardCard
          title="Progress Reports"
          value="View"
          icon={FileText}
          color="bg-indigo-500"
          onClick={() => setActiveTab("progress")}
        />

        {/* Card 3 — Payment Status → payments ✅ */}
        <DashboardCard
          title="Payment Status"
          value={
            !latestInvoice
              ? "No Invoice"
              : latestInvoice.status === "paid"
              ? "✅ Paid"
              : latestInvoice.status === "partial"
              ? "⚠️ Partial"
              : `Unpaid — RM${latestInvoice.amount ?? "—"}`
          }
          icon={DollarSign}
          color={
            !latestInvoice
              ? "bg-gray-400"
              : latestInvoice.status === "paid"
              ? "bg-green-500"
              : latestInvoice.status === "partial"
              ? "bg-amber-500"
              : "bg-yellow-500"
          }
          onClick={() => setActiveTab("payments")}
        />
      </div>

      {/* Today's Activities preview */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Today's Activities</h3>
          <button
            onClick={() => setActiveTab("child-activities")}
            className="text-sm text-indigo-600 font-semibold hover:underline"
          >
            View all →
          </button>
        </div>

        {childActivities.filter(a => a.date === TODAY).length > 0 ? (
          <div className="space-y-3">
            {childActivities
              .filter(a => a.date === TODAY)
              .map((act) => (
                <div
                  key={act._id}
                  className="p-4 bg-indigo-50 rounded-lg border border-indigo-200"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{act.activity}</p>
                      <p className="text-sm text-gray-600">{act.notes}</p>
                    </div>
                    <span className="text-xs text-indigo-600 shrink-0 ml-2">{act.time}</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No activities recorded today.</p>
            <button
              onClick={() => setActiveTab("child-activities")}
              className="mt-2 text-sm text-indigo-500 hover:underline"
            >
              View past activities →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
