import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Camera,
  Calendar,
  Clock,
  ChevronDown,
  Loader2,
  Search,
  Star,
  StickyNote,
  User,
  AlertCircle,
  History,
  Sparkles,
} from "lucide-react";

import { getActivities } from "../../api/activities";
import { getStudents } from "../../api/students";

const BASE_URL = "http://localhost:5000"; // backend base for serving uploaded files

const getActivityPhotoUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// ─── Helper: group activities by date ─────────────────────────────────────────
const groupByDate = (activities) => {
  const groups = {};
  activities.forEach((act) => {
    const key = act.date || "Unknown Date";
    if (!groups[key]) groups[key] = [];
    groups[key].push(act);
  });
  // Sort dates descending
  return Object.entries(groups).sort(([a], [b]) => (a > b ? -1 : 1));
};

// ─── Helper: friendly date label ──────────────────────────────────────────────
const friendlyDate = (dateStr) => {
  if (!dateStr) return "Unknown Date";
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr).toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ─── Activity card colours (cycle through) ───────────────────────────────────
const CARD_COLORS = [
  { bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-400", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
  { bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-400", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  { bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-400", text: "text-sky-700", badge: "bg-sky-100 text-sky-700" },
  { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-400", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
];

// ─── Component ────────────────────────────────────────────────────────────────
const ParentActivities = ({ user }) => {
  const [child, setChild] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("today"); // "today" | "history" | "all"
  const [expandedDates, setExpandedDates] = useState({});

  // ─── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Backend auto-filters students by parentId
        const studentList = await getStudents();
        const myChild = Array.isArray(studentList) ? studentList[0] : null;
        setChild(myChild);

        if (!myChild) {
          setLoading(false);
          return;
        }

        // Backend auto-filters activities for parent's child
        const acts = await getActivities();
        const sorted = Array.isArray(acts)
          ? [...acts].sort((a, b) => {
              const dateCompare = (b.date || "").localeCompare(a.date || "");
              if (dateCompare !== 0) return dateCompare;
              return (b.time || "").localeCompare(a.time || "");
            })
          : [];
        setActivities(sorted);

        // Auto-expand the most recent date
        if (sorted.length > 0 && sorted[0].date) {
          setExpandedDates({ [sorted[0].date]: true });
        }
      } catch (err) {
        console.error("Error loading activities:", err);
        setErrorMsg("Could not load activities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ─── Toggle date group ─────────────────────────────────────────────────────
  const toggleDate = (dateKey) => {
    setExpandedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  // ─── Derived date constants ───────────────────────────────────────────────
  const TODAY = new Date().toISOString().split("T")[0];
  const totalToday = activities.filter((a) => a.date === TODAY).length;
  const totalHistory = activities.filter((a) => a.date !== TODAY).length;

  // ─── Filtered activities (tab + search) ───────────────────────────────────
  const filtered = activities.filter((a) => {
    // Tab filter
    if (activeFilter === "today" && a.date !== TODAY) return false;
    if (activeFilter === "history" && a.date === TODAY) return false;
    // Search filter
    if (
      searchQuery &&
      !a.activity?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const grouped = groupByDate(filtered);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-gray-400 font-medium">Loading activities...</p>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-red-500">
        <AlertCircle className="w-10 h-10" />
        <p className="font-medium">{errorMsg}</p>
      </div>
    );
  }

  // ─── No child assigned ────────────────────────────────────────────────────
  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-gray-400">
        <User className="w-12 h-12" />
        <p className="font-semibold text-lg">No child linked to your account.</p>
        <p className="text-sm">Please contact the administrator.</p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 rounded-xl">
            <Camera className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Daily Activities</h2>
            <p className="text-sm text-gray-500">
              Classroom activities recorded by{" "}
              <span className="font-semibold text-indigo-600">{child.name}</span>'s teacher
            </p>
          </div>
        </div>

        {/* Stats pill */}
        {totalToday > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold shadow-md shadow-indigo-200">
            <Star className="w-4 h-4" />
            {totalToday} activit{totalToday !== 1 ? "ies" : "y"} today
          </div>
        )}
      </div>

      {/* ── Child profile card ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-2xl shadow-xl p-6 text-white">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/10 rounded-full" />

        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border border-white/30">
            {child.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-0.5">
              My Child
            </p>
            <h3 className="text-2xl font-bold">{child.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-indigo-200 text-sm">
                Age {child.age}
              </span>
              <span className="w-1 h-1 rounded-full bg-indigo-300" />
              <span className="text-indigo-200 text-sm">
                {child.classId?.className || child.className || "—"}
              </span>
              <span className="w-1 h-1 rounded-full bg-indigo-300" />
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                <BookOpen className="w-3 h-3" />
                {activities.length} total records
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search activities or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition text-sm"
        />
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {[
          {
            id: "today",
            label: "Today",
            icon: Sparkles,
            count: totalToday,
            activeClass: "bg-indigo-600 text-white shadow-md shadow-indigo-200",
          },
          {
            id: "history",
            label: "History",
            icon: History,
            count: totalHistory,
            activeClass: "bg-white text-gray-800 shadow-sm",
          },
          {
            id: "all",
            label: "All",
            icon: BookOpen,
            count: activities.length,
            activeClass: "bg-white text-gray-800 shadow-sm",
          },
        ].map(({ id, label, icon: Icon, count, activeClass }) => (
          <button
            key={id}
            onClick={() => setActiveFilter(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeFilter === id
                ? activeClass
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeFilter === id
                  ? id === "today"
                    ? "bg-white/25 text-white"
                    : "bg-indigo-100 text-indigo-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Activity groups ──────────────────────────────────────────────────── */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-gray-500 font-semibold text-lg">
              {searchQuery
                ? "No matching activities found"
                : activeFilter === "today"
                ? "No activities recorded today"
                : activeFilter === "history"
                ? "No past activities yet"
                : "No activities recorded yet"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery
                ? "Try a different search term."
                : activeFilter === "today"
                ? "Check back after your child's teacher records today's activities."
                : "Activities recorded by the teacher will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateKey, dayActivities]) => {
            const isExpanded = !!expandedDates[dateKey];
            return (
              <div
                key={dateKey}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Date header (collapsible) */}
                <button
                  onClick={() => toggleDate(dateKey)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">
                        {friendlyDate(dateKey)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dayActivities.length} activit{dayActivities.length !== 1 ? "ies" : "y"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                      {dayActivities.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Activity cards */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 border-t border-gray-50 pt-3">
                    {dayActivities.map((act, idx) => {
                      const color = CARD_COLORS[idx % CARD_COLORS.length];
                      return (
                        <div
                          key={act._id}
                          className={`flex gap-4 p-4 rounded-xl border ${color.bg} ${color.border} transition-shadow hover:shadow-sm`}
                        >
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center pt-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0`} />
                            <div className="w-px flex-1 bg-gray-200 mt-1.5 min-h-[1rem]" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <h4 className={`font-bold text-base ${color.text}`}>
                                {act.activity}
                              </h4>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${color.badge}`}
                              >
                                <Clock className="w-3 h-3" />
                                {act.time}
                              </span>
                            </div>

                            {act.notes && (
                              <div className="mt-2 flex items-start gap-2">
                                <StickyNote className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {act.notes}
                                </p>
                              </div>
                            )}

                            {/* Activity photos */}
                            {act.photos && act.photos.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {act.photos.map((url, photoIdx) => (
                                  <a
                                    key={photoIdx}
                                    href={getActivityPhotoUrl(url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={getActivityPhotoUrl(url)}
                                      alt={`Activity photo ${photoIdx + 1}`}
                                      className="h-24 w-auto rounded-lg object-cover border border-white/60 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentActivities;
