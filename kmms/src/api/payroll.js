import http from "./http";

export const getPayrollRecords = async (params) => {
  const res = await http.get("/payroll", { params });
  return res.data;
};

export const generatePayroll = async (data) => {
  const res = await http.post("/payroll/generate", data);
  return res.data;
};

export const getPayrollStats = async (params) => {
  const res = await http.get("/payroll/stats", { params });
  return res.data;
};

export const updatePayrollRecord = async (id, data) => {
  const res = await http.put(`/payroll/${id}`, data);
  return res.data;
};

export const markPayrollAsPaid = async (id) => {
  const res = await http.post(`/payroll/${id}/pay`);
  return res.data;
};

export const getMyPayslips = async () => {
  const res = await http.get("/payroll/my");
  return res.data;
};
