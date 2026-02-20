import client from "./client";

export const dashboardApi = {
  employee: async () => (await client.get("/dashboard/employee")).data,
  admin: async () => (await client.get("/dashboard/admin")).data
};

export const employeeApi = {
  myProfile: async () => (await client.get("/employees/me")).data,
  updateMyProfile: async (payload) => (await client.put("/employees/me", payload)).data,
  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return (await client.put("/employees/me/avatar", formData)).data;
  },
  list: async (params) => (await client.get("/employees", { params })).data,
  create: async (payload) => (await client.post("/employees", payload)).data,
  update: async (id, payload) => (await client.put(`/employees/${id}`, payload)).data,
  remove: async (id) => (await client.delete(`/employees/${id}`)).data
};

export const attendanceApi = {
  checkIn: async () => (await client.post("/attendance/check-in")).data,
  checkOut: async () => (await client.post("/attendance/check-out")).data,
  my: async (params) => (await client.get("/attendance/me", { params })).data,
  admin: async (params) => (await client.get("/attendance/admin", { params })).data,
  exportCsvUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const base = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/attendance/admin/export`;
    return query ? `${base}?${query}` : base;
  }
};

export const leaveApi = {
  apply: async (payload) => (await client.post("/leaves", payload)).data,
  my: async (params) => (await client.get("/leaves/me", { params })).data,
  admin: async (params) => (await client.get("/leaves/admin", { params })).data,
  update: async (id, payload) => (await client.put(`/leaves/${id}`, payload)).data,
  review: async (id, payload) => (await client.patch(`/leaves/${id}/review`, payload)).data,
  analytics: async () => (await client.get("/leaves/analytics")).data
};

export const taskApi = {
  my: async (params) => (await client.get("/tasks/me", { params })).data,
  admin: async (params) => (await client.get("/tasks/admin", { params })).data,
  create: async (payload) => (await client.post("/tasks", payload)).data,
  updateStatus: async (id, payload) => (await client.patch(`/tasks/${id}/status`, payload)).data,
  uploadAttachment: async (id, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return (await client.post(`/tasks/${id}/attachments`, formData)).data;
  }
};

export const documentApi = {
  upload: async ({ file, type, visibility, category, description, expiresOn, tags, userId }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (type) formData.append("type", type);
    if (visibility) formData.append("visibility", visibility);
    if (category) formData.append("category", category);
    if (description) formData.append("description", description);
    if (expiresOn) formData.append("expiresOn", expiresOn);
    if (tags) formData.append("tags", tags);
    if (userId) formData.append("userId", userId);
    return (await client.post("/documents/upload", formData)).data;
  },
  my: async (params) => (await client.get("/documents/me", { params })).data
};

export const projectApi = {
  list: async (params) => (await client.get("/projects", { params })).data,
  create: async (payload) => (await client.post("/projects", payload)).data,
  update: async (id, payload) => (await client.patch(`/projects/${id}`, payload)).data
};

export const clientApi = {
  list: async (params) => (await client.get("/clients", { params })).data,
  create: async (payload) => (await client.post("/clients", payload)).data,
  update: async (id, payload) => (await client.patch(`/clients/${id}`, payload)).data
};

export const reportApi = {
  departmentProductivity: async () => (await client.get("/reports/department-productivity")).data,
  leaveTrends: async () => (await client.get("/reports/leave-trends")).data,
  performance: async () => (await client.get("/reports/performance")).data
};

export const notificationApi = {
  list: async (params) => (await client.get("/notifications", { params })).data,
  markRead: async (id) => (await client.patch(`/notifications/${id}/read`)).data,
  markAllRead: async () => (await client.patch("/notifications/read-all")).data
};
