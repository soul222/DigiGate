import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default {
  // Auth
  register(data) {
    return api.post('/auth/register', data);
  },
  
  login(data) {
    return api.post('/auth/login', data);
  },
  
  verifyToken() {
    return api.get('/auth/verify');
  },
  
  // Vehicles
  getVehicles() {
    return api.get('/vehicles');
  },
  
  addVehicle(data) {
    return api.post('/vehicles', data);
  },
  
  updateVehicle(id, data) {
    return api.put(`/vehicles/${id}`, data);
  },
  
  deleteVehicle(id) {
    return api.delete(`/vehicles/${id}`);
  },
  
  checkVehicle(plateNumber) {
    return api.get(`/vehicles/check/${plateNumber}`);
  },
  
  // Access
  processAccess(formData) {
    return api.post('/access/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getAccessLogs(params) {
    return api.get('/access/logs', { params });
  },
  
  getStatistics() {
    return api.get('/access/statistics');
  },
  
  // Gate
  openGate(data) {
    return api.post('/gate/open', data);
  },
  
  closeGate(data) {
    return api.post('/gate/close', data);
  },
  
  getGateStatus() {
    return api.get('/gate/status');
  },
  
  // Visitors
  getVisitors() {
    return api.get('/visitors');
  },
  
  addVisitor(data) {
    return api.post('/visitors', data);
  },
  
  updateVisitor(id, data) {
    return api.put(`/visitors/${id}`, data);
  },
  
  deleteVisitor(id) {
    return api.delete(`/visitors/${id}`);
  },
  
  verifyVisitorQR(qrCode) {
    return api.post('/visitors/verify-qr', { qr_code: qrCode });
  },
  
  verifyVisitorQR(qrCode) {
    return api.post('/visitors/verify-qr', { qr_code: qrCode });
  },
  
  // OCR
  scanLicensePlate(formData) {
    return api.post('/ocr/scan-plate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  scanQRCode(formData) {
    return api.post('/ocr/scan-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  checkOCRHealth() {
    return api.get('/ocr/health');
  }
};