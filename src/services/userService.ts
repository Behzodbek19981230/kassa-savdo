import api from './api';

export interface Role {
	id: number;
	name: string;
	description: string;
}

export interface Filial {
	id: number;
	name: string;
	region: number;
	district: number;
	address: string;
	phone_number: string;
	logo: string | null;
	is_active: boolean;
	is_delete: boolean;
}

export interface User {
	id: number;
	username: string;
	full_name: string;
	is_active: boolean;
	date_of_birthday: string | null;
	gender: string;
	phone_number: string;
	avatar: string | null;
	email: string;
	date_joined: string;
	roles: number[];
	role_detail: Role[];
	filials: number[];
	filials_detail: Filial[];
	region: number | null;
	district: number | null;
	address: string;
	order_filial: number | null;
	order_filial_detail: Filial | null;
}

export interface UserListResponse {
	results?: User[];
	count?: number;
	next?: string | null;
	previous?: string | null;
}

// User ma'lumotlarini olish
export const userService = {
	getCurrentUser: async (): Promise<User> => {
		const response = await api.get<User>('/v1/user-view');
		return response.data;
	},

	// Userlar ro'yxati (filter dropdown va boshqalar uchun)
	getUsers: async (params?: { page?: number; page_size?: number; search?: string }): Promise<UserListResponse> => {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.append('page', params.page.toString());
		if (params?.page_size) queryParams.append('page_size', (params.page_size || 100).toString());
		if (params?.search) queryParams.append('search', params.search);
		const response = await api.get<UserListResponse | User[]>(`/v1/user?${queryParams.toString()}`);
		const data = response.data;
		if (Array.isArray(data)) return { results: data };
		return (data as UserListResponse)?.results ? (data as UserListResponse) : { results: [] };
	},
};
