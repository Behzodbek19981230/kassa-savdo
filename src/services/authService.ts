import api from './api';

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	access: string;
	refresh: string;
}

export interface RefreshTokenResponse {
	access: string;
}

// Login funksiyasi
export const authService = {
	login: async (username: string, password: string): Promise<LoginResponse> => {
		const response = await api.post<LoginResponse>('/v1/auth/token', {
			username,
			password,
		});
		return response.data;
	},

	refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
		const response = await api.post<RefreshTokenResponse>('/v1/auth/token/refresh', {
			refresh: refreshToken,
		});
		return response.data;
	},

	logout: () => {
		localStorage.removeItem('auth_token');
		localStorage.removeItem('refresh_token');
		localStorage.removeItem('kassir');
	},
};
