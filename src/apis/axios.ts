import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

// Vite chỉ expose biến env với prefix VITE_
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5037/api';

const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor
api.interceptors.request.use(function (config) {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Add a response interceptor
api.interceptors.response.use(function onFulfilled(response) {
    return response;
}, function onRejected(error) {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
        useAuthStore.getState().logout();
    }
    return Promise.reject(error);
});

declare module 'axios' {
    interface AxiosRequestConfig {
        showSpinner?: boolean;
    }
}

export default api;