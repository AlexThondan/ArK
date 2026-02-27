import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 12000
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("hrms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || "Request failed";
    const wrapped = new Error(message);
    wrapped.status = error?.response?.status;
    wrapped.code = error?.code;
    wrapped.isNetworkError = !error?.response;
    return Promise.reject(wrapped);
  }
);

export default client;
