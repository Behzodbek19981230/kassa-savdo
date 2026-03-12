/**
 * Application constants
 */

// Exchange rate
export const USD_RATE = 12180;

// API Configuration
export const API_BASE_URL =
	(import.meta.env as { VITE_API_BASE_URL?: string }).VITE_API_BASE_URL || 'https://api-savdo.elegantchinni.uz/api';

// Routes
export const ROUTES = {
	LOGIN: '/login',
	HOME: '/',
	ORDER: '/order',
	ORDER_CREATE: '/order',
	ORDER_EDIT: (id: number | string) => `/order/${id}`,
	ORDER_UPDATE: (id: number | string) => `/order/update/${id}`,
	ORDER_VIEW: (id: number | string) => `/order/show/${id}`,
	STATISTICS: '/statistika',
	DEBT_REPAYMENT: '/qarzlar',
	VOZVRAT_ORDER: '/tovar-qaytarish',
	EXPENSES: '/xarajatlar',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
	AUTH_TOKEN: 'auth_token',
	REFRESH_TOKEN: 'refresh_token',
	KASSIR: 'kassir',
	AUTH_EXPIRES_AT: 'auth_expires_at',
} as const;

// Timeouts
export const API_TIMEOUT = 30000; // 30 seconds
