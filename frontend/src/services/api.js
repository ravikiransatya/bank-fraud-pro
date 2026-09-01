import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to all requests if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bankguard_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error messaging
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.error || error.response?.data?.message || "Service temporarily unavailable. Please try again.",
      status: error.response?.status,
    };
    return Promise.reject(customError);
  }
);

export default API;
