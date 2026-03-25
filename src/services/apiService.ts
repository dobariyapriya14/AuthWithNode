import axios from 'axios';
import { createMMKV } from 'react-native-mmkv';
import { API_URL, endPoints } from '../constants/apiClients';

const storage = createMMKV();

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add authorization token
api.interceptors.request.use(
    (config) => {
        const token = storage.getString('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const apiService = {
    // Auth
    login: (data: any) => api.post(endPoints.login, data),
    signup: (data: any) => api.post(endPoints.signup, data),
    logout: () => api.post(endPoints.logout),
    sendOtp: (data: any) => api.post(endPoints.sendOtp, data),
    verifyOtp: (data: any) => api.post(endPoints.verifyOtp, data),

    // Todos
    getTodos: (page: number) => api.get(`${endPoints.todos}?page=${page}`),
    
    saveTodo: (formData: any, id?: string | null) => {
        if (id) {
            // Check if formData is actually FormData or just an object
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
