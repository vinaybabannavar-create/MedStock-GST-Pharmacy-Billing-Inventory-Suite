import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export default api;
