import axios from 'axios';

const API_BASE_URL = 'http://localhost:8085/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Interceptor to add Auth Token and Tenant ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantDomain = localStorage.getItem('tenantDomain') || 'default';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  config.headers['X-Tenant-Id'] = tenantDomain;
  
  return config;
});

// Interceptor to handle errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage only if it's a real user token, not an anonymous tracking token
      if (localStorage.getItem('token') && !localStorage.getItem('trackingId')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
