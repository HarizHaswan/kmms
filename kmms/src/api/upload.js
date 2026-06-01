import api from "./http";

export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.post("/upload/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return res.data;
};

export const uploadAttachment = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/upload/attachment", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return res.data;
};
