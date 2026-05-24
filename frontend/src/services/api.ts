// SalesSphere AI – Axios API Service
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });
          const newToken = res.data.access_token;
          localStorage.setItem('access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string; remember_me?: boolean }) =>
    api.post('/auth/login', data),
  signup: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: Partial<{ name: string; phone: string; department: string; avatar_url: string }>) =>
    api.put('/auth/profile', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: (year?: number, month?: number) =>
    api.get('/dashboard/summary', { params: { year, month } }),
  getMonthlyRevenue: (year?: number) =>
    api.get('/dashboard/monthly-revenue', { params: { year } }),
  getCategorySales: (year?: number, month?: number) =>
    api.get('/dashboard/category-sales', { params: { year, month } }),
  getRegionSales: (year?: number) =>
    api.get('/dashboard/region-sales', { params: { year } }),
  getTopProducts: (limit?: number, year?: number) =>
    api.get('/dashboard/top-products', { params: { limit, year } }),
  getRecentSales: (limit?: number) =>
    api.get('/dashboard/recent-sales', { params: { limit } }),
  getAIPrediction: () => api.get('/dashboard/ai-prediction'),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/products/', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: unknown) => api.post('/products/', data),
  update: (id: number, data: unknown) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  createCategory: (data: unknown) => api.post('/products/categories', data),
  getLowStock: () => api.get('/products/low-stock'),
  getStats: () => api.get('/products/stats'),
};

// ── Sales ─────────────────────────────────────────────────────────────────────
export const salesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/sales/', { params }),
  getById: (id: number) => api.get(`/sales/${id}`),
  create: (data: unknown) => api.post('/sales/', data),
  update: (id: number, data: unknown) => api.put(`/sales/${id}`, data),
  cancel: (id: number) => api.delete(`/sales/${id}`),
  getStats: (year?: number) => api.get('/sales/stats', { params: { year } }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getRevenueTrend: (years?: number) =>
    api.get('/analytics/revenue-trend', { params: { years } }),
  getProductPerformance: (params?: Record<string, unknown>) =>
    api.get('/analytics/product-performance', { params }),
  getCustomerGrowth: (year?: number) =>
    api.get('/analytics/customer-growth', { params: { year } }),
  getForecast: () => api.get('/analytics/forecast'),
  getHeatmap: (year?: number) => api.get('/analytics/heatmap', { params: { year } }),
  getPerformers: (params?: Record<string, unknown>) =>
    api.get('/analytics/performers', { params }),
  getProfitExpense: (year?: number) =>
    api.get('/analytics/profit-expense', { params: { year } }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  getSummary: (params?: Record<string, unknown>) =>
    api.get('/reports/summary', { params }),
  exportCsv: (params?: Record<string, unknown>) =>
    api.get('/reports/export/csv', { params, responseType: 'blob' }),
  exportExcel: (params?: Record<string, unknown>) =>
    api.get('/reports/export/excel', { params, responseType: 'blob' }),
  exportPdf: (params?: Record<string, unknown>) =>
    api.get('/reports/export/pdf', { params, responseType: 'blob' }),
};

export const datasetsApi = {
  getAll: () => api.get('/datasets/'),
  getSources: () => api.get('/datasets/sources'),
  preview: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/datasets/preview', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  importFile: (file: File, name: string, source = 'upload') => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('source', source);
    return api.post('/datasets/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  importSource: (source: string) => api.post('/datasets/import-source', { source }),
  getAnalysis: (id: number) => api.get(`/datasets/${id}/analysis`),
  exportJson: (id: number) => api.get(`/datasets/${id}/export/json`, { responseType: 'blob' }),
};

export const invoicesApi = {
  getBySale: (saleId: number) => api.get(`/invoices/${saleId}`),
  downloadPdf: (saleId: number) => api.get(`/invoices/${saleId}/pdf`, { responseType: 'blob' }),
  email: (saleId: number) => api.post(`/invoices/${saleId}/email`),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    api.post('/ai/chat', { message, history }),
  getInsights: () => api.get('/ai/insights'),
  generateReport: (type: string, period: string) =>
    api.post('/ai/generate-report', { type, period }),
  getRecommendations: () => api.get('/ai/recommendations'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/notifications/', { params }),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/users/', { params }),
  update: (id: number, data: unknown) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};
