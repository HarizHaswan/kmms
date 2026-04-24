import http from "./http";

// GET all activities (backend filters by role automatically)
export const getActivities = async () => {
  const res = await http.get("/activities");
  return res.data;
};

// ADD new activity for a single student
export const addActivityApi = async (data) => {
  const res = await http.post("/activities", data);
  return res.data;
};

// BLAST activity to all students in teacher's class
export const blastActivityApi = async (data) => {
  const res = await http.post("/activities/blast", data);
  return res.data;
};

// DELETE activity
export const deleteActivityApi = async (id) => {
  const res = await http.delete(`/activities/${id}`);
  return res.data;
};
