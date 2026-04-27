import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Users,
  User,
  Trash2,
  Send,
  Loader2,
  CheckCircle,
  ChevronDown,
  Clock,
  Calendar,
  ImagePlus,
  X,
  Image,
} from "lucide-react";

import {
  getActivities,
  addActivityApi,
  blastActivityApi,
  deleteActivityApi,
  uploadActivityPhoto,
} from "../../api/activities";

import { getStudents } from "../../api/students";

const BASE_URL = "http://localhost:5000"; // backend base for serving static files

const ActivitiesTracking = ({ user }) => {
  const [students, setStudents] = useState([]);   // active students only
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);       // File object
  const [photoPreview, setPhotoPreview] = useState(null); // data-URL for preview
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    studentId: "", // "" = blast to all
    activity: "",
    notes: "",
  });

  // ─── Load students & activities on mount ───────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [studentsData, activitiesData] = await Promise.all([
          getStudents(),
          getActivities(),
        ]);

        // ✅ Only show active students in the dropdown
        const active = Array.isArray(studentsData)
          ? studentsData.filter((s) => s.status === "active")
          : [];
        setStudents(active);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      } catch (err) {
        console.error("Error loading data:", err);
        setErrorMsg("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getTimestamp = () => {
    const now = new Date();
    return {
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // ─── Photo handlers ────────────────────────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file.");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.activity.trim()) {
      showError("Please enter an activity name.");
      return;
    }

    setSaving(true);
    const { date, time } = getTimestamp();

    try {
      // Upload photo first if one is selected
      let photoUrl = null;
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          photoUrl = await uploadActivityPhoto(photoFile);
        } catch (uploadErr) {
          showError("Photo upload failed — activity will be saved without photo.");
        } finally {
          setUploadingPhoto(false);
        }
      }

      const photos = photoUrl ? [photoUrl] : [];

      if (form.studentId) {
        // ── Single student ──────────────────────────────────────────────────
        const newRec = await addActivityApi({
          studentId: form.studentId,
          activity: form.activity.trim(),
          notes: form.notes.trim(),
          date,
          time,
          photos,
        });
        setActivities((prev) => [newRec, ...prev]);
        showSuccess("Activity recorded for student.");
      } else {
        // ── Blast to all active students in class ───────────────────────────
        const newRecs = await blastActivityApi({
          activity: form.activity.trim(),
          notes: form.notes.trim(),
          date,
          time,
          photos,
        });
        setActivities((prev) => [
          ...(Array.isArray(newRecs) ? [...newRecs].reverse() : [newRecs]),
          ...prev,
        ]);
        showSuccess(`Activity blasted to all ${students.length} active students! 🎉`);
      }

      // Reset form + photo
      setForm({ studentId: "", activity: "", notes: "" });
      clearPhoto();
    } catch (err) {
      console.error("Error saving activity:", err);
      showError(err?.response?.data?.message || "Failed to save activity.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteActivityApi(id);
      setActivities((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Error deleting activity:", err);
      showError("Failed to delete activity.");
    }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────
  const isBlastMode = form.studentId === "";
  const selectedStudent = students.find((s) => s._id === form.studentId);

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-gray-500 font-medium">Loading activities...</p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-xl">
          <BookOpen className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daily Activities</h2>
          <p className="text-sm text-gray-500">
            Record and track classroom activities for your students
          </p>
        </div>
      </div>

      {/* Toast messages */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-in slide-in-from-top-2 duration-300">
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Record Activity Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-500" />
          Record New Activity
        </h3>

        <div className="space-y-4">
          {/* Student selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Target
            </label>
            <div className="relative">
              <select
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                className="w-full p-3 pr-10 border border-gray-200 rounded-xl appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              >
                <option value="">🔊 Blast to All Active Students ({students.length} students)</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    👤 {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Target badge */}
            <div className="mt-2">
              {isBlastMode ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  <Users className="w-3.5 h-3.5" />
                  Will send to all {students.length} active students
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                  <User className="w-3.5 h-3.5" />
                  Individual: {selectedStudent?.name}
                </span>
              )}
            </div>
          </div>

          {/* Activity name */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Activity Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="activity"
              placeholder="e.g. Art Class, Story Time, Outdoor Play..."
              value={form.activity}
              onChange={handleChange}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Notes / Observations
            </label>
            <textarea
              name="notes"
              placeholder="How did the activity go? Any observations?"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 transition resize-none"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Activity Photo <span className="text-gray-400 font-normal">(optional)</span>
            </label>

            {photoPreview ? (
              /* Preview + remove */
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full max-h-56 object-cover"
                />
                <button
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                  <Image className="w-3 h-3" />
                  {photoFile?.name}
                </div>
              </div>
            ) : (
              /* Upload trigger */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all duration-200"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-sm font-medium">Click to attach a photo</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSave}
            disabled={saving || uploadingPhoto}
            className={`w-full p-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2.5 transition-all duration-200 ${
              isBlastMode
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadingPhoto ? "Uploading photo..." : isBlastMode ? "Blasting to all students..." : "Saving..."}
              </>
            ) : isBlastMode ? (
              <>
                <Users className="w-5 h-5" />
                Blast to All {students.length} Active Students
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Save Activity
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Recent Activities
          </span>
          <span className="text-sm font-normal text-gray-400">
            {activities.length} record{activities.length !== 1 ? "s" : ""}
          </span>
        </h3>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No activities recorded yet.</p>
              <p className="text-gray-300 text-sm mt-1">
                Use the form above to record your first activity.
              </p>
            </div>
          ) : (
            activities.map((act) => {
              const student = students.find((s) => s._id === act.studentId);

              return (
                <div
                  key={act._id}
                  className="p-4 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 rounded-xl border border-indigo-100 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-sm">
                        {student?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-indigo-900 truncate">
                          {student?.name ?? (
                            <span className="text-gray-400 italic">Unknown student</span>
                          )}
                        </p>
                        <p className="text-sm font-medium text-indigo-600 mt-0.5">
                          {act.activity}
                        </p>
                        {act.notes && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {act.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {act.date}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {act.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(act._id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Activity photo(s) */}
                  {act.photos && act.photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {act.photos.map((url, idx) => (
                        <a
                          key={idx}
                          href={`${BASE_URL}${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={`${BASE_URL}${url}`}
                            alt={`Activity photo ${idx + 1}`}
                            className="h-28 w-auto rounded-lg object-cover border border-indigo-100 hover:scale-105 transition-transform cursor-pointer shadow-sm"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesTracking;
