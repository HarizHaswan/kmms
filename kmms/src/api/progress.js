import http from "./http";

export const getProgressReports = async () => {
  const res = await http.get("/progress");
  return res.data;
};

export const createProgressReport = async (data) => {
  const res = await http.post("/progress", data);
  return res.data;
};

export const updateProgressReport = async (id, data) => {
  const res = await http.put(`/progress/${id}`, data);
  return res.data;
};
