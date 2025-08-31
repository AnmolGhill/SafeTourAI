import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateLocation: (data) => api.put('/users/location', data),
  getNearby: (params) => api.get('/users/nearby', { params }),
  getResponders: (params) => api.get('/users/responders', { params }),
};

// Emergency API
export const emergencyAPI = {
  create: (data) => api.post('/emergencies', data),
  getAll: (params) => api.get('/emergencies', { params }),
  getById: (id) => api.get(`/emergencies/${id}`),
  update: (id, data) => api.put(`/emergencies/${id}`, data),
  delete: (id) => api.delete(`/emergencies/${id}`),
  getNearby: (params) => api.get('/emergencies/nearby', { params }),
  getActive: () => api.get('/emergencies/active'),
  assignResponder: (id, responderId) => api.post(`/emergencies/${id}/assign`, { responderId }),
  updateStatus: (id, status) => api.put(`/emergencies/${id}/status`, { status }),
  addMedia: (id, formData) => api.post(`/emergencies/${id}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStatistics: (params) => api.get('/emergencies/statistics', { params }),
};

// Blockchain API
export const blockchainAPI = {
  getTransactions: (params) => api.get('/blockchain/transactions', { params }),
  getTransaction: (id) => api.get(`/blockchain/transactions/${id}`),
  createWallet: (userId) => api.post('/blockchain/wallet', { userId }),
  getWallet: (userId) => api.get(`/blockchain/wallet/${userId}`),
  recordTransaction: (data) => api.post('/blockchain/record', data),
  verifyTransaction: (hash) => api.get(`/blockchain/verify/${hash}`),
  getStatistics: () => api.get('/blockchain/statistics'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  subscribe: (token) => api.post('/notifications/subscribe', { token }),
  unsubscribe: (token) => api.post('/notifications/unsubscribe', { token }),
  sendTestNotification: (data) => api.post('/notifications/test', data),
};

// KYC API
export const kycAPI = {
  submit: (formData) => api.post('/kyc/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStatus: () => api.get('/kyc/status'),
  getAll: (params) => api.get('/kyc/applications', { params }),
  approve: (id) => api.put(`/kyc/${id}/approve`),
  reject: (id, reason) => api.put(`/kyc/${id}/reject`, { reason }),
  getStatistics: () => api.get('/kyc/statistics'),
};

// Health Check API
export const healthAPI = {
  check: () => api.get('/health'),
  detailed: () => api.get('/health/detailed'),
};

export default api;
