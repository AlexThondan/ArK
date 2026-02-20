import client from "./client";

export const authApi = {
  login: async (payload) => {
    const { data } = await client.post("/auth/login", payload);
    return data;
  },
  me: async () => {
    const { data } = await client.get("/auth/me");
    return data;
  },
  changePassword: async (payload) => {
    const { data } = await client.put("/auth/change-password", payload);
    return data;
  }
};
