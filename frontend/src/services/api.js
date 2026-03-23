import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalize API errors for UI
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

