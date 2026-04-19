import http from "./http";

export const getFeeTemplates = async () => {
  const res = await http.get("/fee-templates");
  return res.data;
};

export const createFeeTemplate = async (data) => {
  const res = await http.post("/fee-templates", data);
  return res.data;
};

export const updateFeeTemplate = async (id, data) => {
  const res = await http.put(`/fee-templates/${id}`, data);
  return res.data;
};

export const deleteFeeTemplate = async (id) => {
  const res = await http.delete(`/fee-templates/${id}`);
  return res.data;
};
