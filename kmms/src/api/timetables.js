import api from "./http";

// ADMIN: Create Slot
export const createTimetable = (data) =>
  api.post("/timetables", data).then((res) => res.data);

// ADMIN: Get Slots by Class
export const getTimetableByClass = async (classId) => {
  // If no classId is selected, return empty array immediately
  if (!classId) return [];
  const res = await api.get(`/timetables?classId=${classId}`);
  return res.data;
};

// ADMIN: Delete Slot (Add this!)
export const deleteTimetable = async (id) => {
  const res = await api.delete(`/timetables/${id}`);
  return res.data;
};

// TEACHER
export const getTeacherTimetable = async () => {
  const res = await api.get("/timetables/teacher");
  return res.data;
};

// PARENT
export const getParentTimetable = async () => {
  const res = await api.get("/timetables/parent");
  return res.data;
};

export const getParentTimetableToday = async () => {
  const res = await api.get("/timetables/parent/today");
  return res.data;
};