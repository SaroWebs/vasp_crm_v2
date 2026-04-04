import axios from 'axios';
import { configureAxiosInstance } from './http';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

configureAxiosInstance(axiosInstance);

// Add request interceptor to include bearer token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('client_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('client_token');
            localStorage.removeItem('client_info');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

export default axiosInstance;
