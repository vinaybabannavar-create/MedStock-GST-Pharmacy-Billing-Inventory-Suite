import axios from 'axios';

// Using relative URL so Vite dev server proxies to backend (no CORS issues)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export default api;
