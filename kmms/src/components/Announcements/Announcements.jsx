import React, { useEffect, useState } from "react";
import { Bell, Trash2, PlusCircle, Image, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
} from "../../api/announcements";
import { uploadAttachment } from "../../api/upload";

const getAttachmentUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  let base = process.env.REACT_APP_API_URL || "http://localhost:5000";
  if (base.endsWith("/api")) {
    base = base.substring(0, base.length - 4);
  }
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetRole: "all",
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setAttachmentFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAttachmentPreview(previewUrl);
  };

  const handleClearImage = () => {
    setAttachmentFile(null);
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
      setAttachmentPreview("");
    }
  };

  // Search + Filters + Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Safe user retrieval
  const saved = localStorage.getItem("kmms-user");
  const currentUser = saved ? JSON.parse(saved) : null;
  const role = currentUser?.role?.toLowerCase() || "";

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    await deleteAnnouncement(id);
    loadAnnouncements();
  };

  if (loading) {
    return <p className="p-4 text-gray-600">Loading announcements...</p>;
  }

  // Filtering Logic
  const filtered = announcements
    .filter((a) => {
      // Frontend Role Filter (Only strictly applies if Admin uses the dropdown)
      if (roleFilter === "all") return true;
      return a.targetRole === roleFilter || a.targetRole === "all";
    })
    .filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.message.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-purple-600" />
          Announcements
        </h2>

        {/* Admin and Teacher: Add Announcement */}
        {(role === "admin" || role === "teacher") && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm font-medium"
          >
            <PlusCircle className="w-5 h-5" />
            New Announcement
          </button>
        )}
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search announcements..."
          className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* --- HIDE DROPDOWN IF NOT ADMIN --- */}
        {role === "admin" && (
          <select
            className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-gray-700"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">View All</option>
            <option value="teacher">Teacher Only</option>
            <option value="parent">Parent Only</option>
          </select>
        )}
      </div>

      {/* ADD ANNOUNCEMENT FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-300 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Create Announcement</h3>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setUploadingImage(true);
              const payload = { ...form };
              if (role === "teacher") {
                payload.targetRole = "parent";
                payload.targetClass = currentUser?.classAssigned || "";
              }
              try {
                if (attachmentFile) {
                  const uploadResult = await uploadAttachment(attachmentFile);
                  payload.attachment = uploadResult.url;
                }
                await addAnnouncement(payload);
                setShowForm(false);
                setForm({ title: "", message: "", targetRole: "all" });
                handleClearImage();
                loadAnnouncements();
              } catch (err) {
                console.error("Failed to add announcement:", err);
                alert("Failed to post announcement. Please try again.");
              } finally {
                setUploadingImage(false);
              }
            }}
          >
            <input
              type="text"
              placeholder="Announcement Title"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <textarea
              placeholder="Message content (Markdown is supported)"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none min-h-[120px]"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />

            {/* Image Attachment Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Attach Picture
              </label>
              
              {!attachmentPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50/50 hover:border-purple-300 transition group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mb-2 transition-colors" />
                    <p className="text-sm text-gray-500 font-semibold">
                      Click to upload a picture
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl border border-gray-150 overflow-hidden bg-gray-50/50 p-2 max-w-sm flex items-center gap-3">
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {attachmentFile?.name || "Image file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(attachmentFile?.size ? (attachmentFile.size / 1024 / 1024).toFixed(2) : 0)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="p-1.5 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600 transition shrink-0 mr-1"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {role === "admin" ? (
              <select
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-700"
                value={form.targetRole}
                onChange={(e) =>
                  setForm({ ...form, targetRole: e.target.value })
                }
              >
                <option value="all">All Users</option>
                <option value="teacher">Teachers Only</option>
                <option value="parent">Parents Only</option>
              </select>
            ) : (
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800 font-medium flex items-center gap-2">
                <span>Target Audience:</span> 
                <span className="bg-indigo-100 px-2 py-0.5 rounded-md text-indigo-700">Parents of {currentUser?.classAssigned || "your class"}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  handleClearImage();
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={uploadingImage}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadingImage ? "Uploading..." : "Post Announcement"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ANNOUNCEMENT LIST */}
      <div className="space-y-4">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No announcements found.</p>
          </div>
        ) : (
          paginated.map((a) => (
            <div
              key={a._id}
              className="bg-white p-5 rounded-2xl shadow-sm border-2 border-gray-300 flex justify-between items-start"
            >
              <div className="max-w-3xl w-full">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <p className="font-bold text-lg text-gray-900">{a.title}</p>
                  
                  {role === "admin" && a.targetRole !== "all" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 uppercase font-bold tracking-wider">
                      {a.targetRole}
                    </span>
                  )}
                  {a.targetClass && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase font-bold tracking-wider">
                      CLASS {a.targetClass}
                    </span>
                  )}
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 mb-3">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-medium">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {a.message}
                  </ReactMarkdown>
                </div>

                {a.attachment && (
                  <div className="mt-3 mb-4 overflow-hidden rounded-2xl border border-gray-150 max-w-md shadow-sm bg-gray-50/20 group cursor-pointer relative">
                    <img
                      src={getAttachmentUrl(a.attachment)}
                      alt="Announcement Attachment"
                      className="w-full h-auto object-cover max-h-[300px] hover:scale-[1.02] transition-transform duration-300"
                      onClick={() => window.open(getAttachmentUrl(a.attachment), "_blank")}
                    />
                  </div>
                )}

                <p className="text-xs text-gray-400 font-medium">
                  {new Date(a.createdAt).toLocaleDateString()} • {a.createdBy?.name || "Admin"}
                </p>
              </div>

              {/* Admin Delete Button */}
              {role === "admin" && (
                <button
                  onClick={() => handleDelete(a._id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors shrink-0 ml-4"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {filtered.length > pageSize && (
        <div className="flex justify-center gap-3 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={start + pageSize >= filtered.length}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}