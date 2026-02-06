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
}

// User ma'lumotlarini olish
export const userService = {
	getCurrentUser: async (): Promise<User> => {
		const response = await api.get<User>('/v1/user-view');
		return response.data;
	},
};
