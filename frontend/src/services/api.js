import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

// Stops
export const getAllStops = () => api.get('/stops');
export const createStop = (data) => api.post('/stops', data);

// Routes
export const searchRoute = (from, to, strategy) =>
  api.get(`/routes/search?from=${from}&to=${to}&strategy=${strategy}`);
export const createRoute = (data) => api.post('/routes', data);
export const getMapData = () => api.get('/routes/map');

// Bookings
export const createBooking = (data) => api.post('/bookings', data);
export const getBooking = (id) => api.get(`/bookings/${id}`);

export default api;