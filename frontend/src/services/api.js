import axios from "axios";

// Determine the active API base URL with fallback to deployed Render backend
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // When running in production build or on non-localhost domain (e.g. Vercel, Render), route to deployed Render backend
  if (
    import.meta.env.PROD ||
    (typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1")
  ) {
    return "https://bank-fraud-pro.onrender.com/api";
  }
  return "http://localhost:5000/api";
};

export const API_BASE_URL = getApiBaseUrl();

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
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
