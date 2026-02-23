import axios from 'axios';

// Auto-detect backend URL based on environment
const getBackendURL = () => {
  // In development, try to connect to localhost:5000
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBackendURL();

console.log('🌐 Backend API URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    if (error.message === 'Network Error') {
      return Promise.reject({
        response: {
          data: {
            message: 'Network error: Unable to connect to server. Is the backend running on http://localhost:5000?'
          }
        }
      });
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        response: {
          data: {
            message: 'Request timeout: Server is taking too long to respond.'
          }
        }
      });
    }

    return Promise.reject(error);
  }
);

export default api;
