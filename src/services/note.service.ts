import api from './api';
import { STORAGE_KEYS } from '../constants';

export interface NoteItem {
	id: number;
	sorting?: number;
	date?: string;
	title: string;
	text?: string;
	is_read?: boolean;
	status?: 'new' | 'done' | 'expired' | string;
	is_delete?: boolean;
	author_name?: string;
	created_by?: number;
	created_by_detail?: {
		id: number;
		username?: string;
		full_name?: string;
		phone_number?: string;
		email?: string;
		avatar?: string | null;
	};
	created_at?: string;
	updated_at?: string;
}

interface NotesListResponse {
	pagination?: {
		currentPage: number;
		lastPage: number;
		perPage: number;
		total: number;
	};
	results?: NoteItem[];
	filters?: unknown;
}

export interface NotePayload {
	sorting?: number;
	date: string;
	title: string;
	text: string;
	status?: string;
	is_read?: boolean;
	is_delete?: boolean;
}

const normalizeList = (response: NoteItem[] | NotesListResponse): NoteItem[] => {
	if (Array.isArray(response)) return response;
	return response?.results ?? [];
};

export const noteService = {
	getNotes: async (params?: Record<string, unknown>): Promise<NoteItem[]> => {
		const response = await api.get<NoteItem[] | NotesListResponse>('/v1/note', { params });
		return normalizeList(response.data);
	},
	createNote: async (data: NotePayload) => {
		return api.post<NoteItem>('/v1/note/', data);
	},
	updateNote: async (id: number, data: NotePayload) => {
		return api.put<NoteItem>(`/v1/note/${id}`, data);
	},
	deleteNote: async (id: number) => {
		return api.delete<void>(`/v1/note/${id}`);
	},
};

const toWsBaseUrl = (baseUrl: string) => {
	if (baseUrl.startsWith('https://')) return baseUrl.replace('https://', 'wss://');
	if (baseUrl.startsWith('http://')) return baseUrl.replace('http://', 'ws://');
	return baseUrl;
};

export const getNotesWsUrl = () => {
	const apiBaseUrl = import.meta.env.VITE_FILE_BASE_URL || '';
	const fallbackBase = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
	const wsBaseUrl = toWsBaseUrl(apiBaseUrl || fallbackBase).replace(/\/+$/, '');
	const wsUrl = `${wsBaseUrl}/ws/notes/notifications/`;
	return wsUrl;
};
