import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL - environment variable dan olish yoki default qiymat
const API_BASE_URL = (import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || 'https://api-savdo.elegantchinni.uz/api';

// Axios instance yaratish
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 soniya
});

// Request interceptor - har bir so'rovdan oldin token qo'shish
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('auth_token');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - javoblarni boshqarish va token yangilash
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 401 xatosi bo'lsa va token yangilanishi kerak bo'lsa
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');

            // Refresh token mavjud bo'lsa, yangi access token olishga harakat qilish
            if (refreshToken) {
                try {
                    // Refresh token endpointiga so'rov yuborish (token qo'shmasdan)
                    const refreshResponse = await axios.post(
                        `${API_BASE_URL}/v1/auth/token/refresh`,
                        { refresh: refreshToken },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    const newAccessToken = refreshResponse.data.access;
                    localStorage.setItem('auth_token', newAccessToken);

                    // Original so'rovni yangi token bilan qayta yuborish
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }

                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh token ham yaroqsiz bo'lsa, logout qilish
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('kassir');

                    // Faqat login sahifasida bo'lmasa, login sahifasiga yo'naltirish
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } else {
                // Refresh token yo'q bo'lsa, logout qilish
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('kassir');

                // Faqat login sahifasida bo'lmasa, login sahifasiga yo'naltirish
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
