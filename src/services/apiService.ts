import axios from 'axios';
import { API_URL, endPoints } from '../constants/apiClients';
import { storageService } from './storageService';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Separate Axios instance for silent token refresh to prevent infinite loops
const refreshAxios = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor to attach authorization token
api.interceptors.request.use(
    (config) => {
        const token = storageService.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to catch 401 Unauthorized errors and perform silent token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 Unauthorized and request has not already been retried
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            // Do not refresh if the failed request was the refresh endpoint itself
            if (originalRequest.url?.includes(endPoints.refresh)) {
                storageService.clearTokens();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue request while token refresh is in progress
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = storageService.getRefreshToken();
            if (!refreshToken) {
                isRefreshing = false;
                storageService.clearTokens();
                return Promise.reject(error);
            }

            try {
                const response = await refreshAxios.post(endPoints.refresh, { token: refreshToken });
                const newAccessToken = response.data?.accessToken || response.data?.data?.accessToken;

                if (newAccessToken) {
                    storageService.setTokens(newAccessToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);
                    isRefreshing = false;

                    return api(originalRequest);
                } else {
                    throw new Error('No access token returned from refresh endpoint');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                storageService.clearTokens();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const apiService = {
    // Auth
    login: (data: any) => api.post(endPoints.login, data),
    signup: (data: any) => api.post(endPoints.signup, data),
    logout: () => {
        const refreshToken = storageService.getRefreshToken();
        const promise = api.post(endPoints.logout, { token: refreshToken });
        storageService.clearTokens();
        return promise;
    },
    refreshToken: (token: string) => refreshAxios.post(endPoints.refresh, { token }),
    sendOtp: (data: any) => api.post(endPoints.sendOtp, data),
    verifyOtp: (data: any) => api.post(endPoints.verifyOtp, data),

    // Todos
    getTodos: (page: number) => api.get(`${endPoints.todos}?page=${page}`),
    
    saveTodo: (formData: any, id?: string | null) => {
        if (id) {
            const isFormData = formData instanceof FormData;
            return api.put(`${endPoints.todos}/${id}`, formData, {
                headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
            });
        }
        const isFormData = formData instanceof FormData;
        return api.post(endPoints.todos, formData, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },

    deleteTodo: (id: string) => api.delete(`${endPoints.todos}/${id}`),

    // Payment
    createPaymentIntent: (data: { amount: number }) => api.post('payment/create-intent', data),
};

export default apiService;
