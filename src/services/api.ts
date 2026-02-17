import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

// Axios instance yaratish
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - har bir so'rovdan oldin token qo'shish
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

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

            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

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
                    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newAccessToken);

                    // Original so'rovni yangi token bilan qayta yuborish
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }

                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh token ham yaroqsiz bo'lsa, logout qilish
                    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                    localStorage.removeItem(STORAGE_KEYS.KASSIR);

                    // Faqat login sahifasida bo'lmasa, login sahifasiga yo'naltirish
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } else {
                // Refresh token yo'q bo'lsa, logout qilish
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.KASSIR);

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
