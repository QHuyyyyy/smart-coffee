import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

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
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    isRefreshing = false;
    failedQueue = [];
};

api.interceptors.response.use(function onFulfilled(response) {
    return response;
}, async function onRejected(error) {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const state = useAuthStore.getState();

            if (state.token) {
                await state.refreshAccessToken();
                const newToken = useAuthStore.getState().token;

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                processQueue(null, newToken);
                return api(originalRequest);
            } else {
                throw new Error("No token available");
            }
        } catch (err) {
            processQueue(err, null);
            useAuthStore.getState().logout();
            return Promise.reject(err);
        }
    }

    return Promise.reject(error);
});

declare module 'axios' {
    interface AxiosRequestConfig {
        showSpinner?: boolean;
    }
}

export default api;