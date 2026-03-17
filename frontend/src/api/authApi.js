import client from "./client";

export const authApi = {
  login: async (payload) => {
    const { data } = await client.post("/auth/login", payload);
    return data;
  },
  registerAdmin: async (payload) => {
    const { data } = await client.post("/auth/register-admin", payload);
    return data;
  },
  me: async (config = {}) => {
    const { data } = await client.get("/auth/me", config);
    return data;
  },
  changePassword: async (payload) => {
    const { data } = await client.put("/auth/change-password", payload);
    return data;
  }
};
