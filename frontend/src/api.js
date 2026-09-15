import axios from 'axios';

// Contoh konfigurasi axios yang benar
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', 
});

// Interceptor: Menempelkan Token ke setiap request secara otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;