import api from "./http";

export const getAttendance = async (date, classId) => {
  const res = await api.get(`/attendance?date=${date}&classId=${classId}`);
  return res.data;
};

export const saveAttendance = async (data) => {
  const res = await api.post("/attendance", data);
  return res.data;
};

// NEW FUNCTION
export const getMonthlyStats = async (classId, month) => {
  const res = await api.get(`/attendance/stats?classId=${classId}&month=${month}`);
  return res.data;
};

// GET a single student's attendance status for a specific date
// Returns: { status: "Present" | "Absent" | "Not Recorded", reason, date, studentId }
export const getStudentAttendanceStatus = async (studentId, date) => {
  const res = await api.get(`/attendance/student/${studentId}?date=${date}`);
  return res.data;
};