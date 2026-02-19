import api from './api';

export interface Expense {
	id?: number;
	filial: number;
	category?: number;
	summa_total_dollar?: number;
	summa_dollar?: number;
	summa_naqt?: number;
	summa_kilik?: number;
	summa_terminal?: number;
	summa_transfer?: number;
	date?: string;
	note?: string;
	is_delete?: boolean;
}

export interface ExpensesResponse {
	count: number;
	results: Expense[];
}

export const expenseService = {
	getExpenses: async (params?: { page?: number; page_size?: number; filial?: number | null }) => {
		const query = new URLSearchParams();
		if (params?.page) query.append('page', params.page.toString());
		if (params?.page_size) query.append('page_size', params.page_size.toString());
		if (params?.filial !== undefined && params?.filial !== null) query.append('filial', params.filial.toString());
		const res = await api.get<ExpensesResponse>(`/v1/expense?${query.toString()}`);
		return res.data;
	},

	getExpense: async (id: number) => {
		const res = await api.get<Expense>(`/v1/expense/${id}`);
		return res.data;
	},

	createExpense: async (payload: Expense) => {
		const res = await api.post<Expense>('/v1/expense', payload);
		return res.data;
	},

	updateExpense: async (id: number, payload: Expense) => {
		const res = await api.put<Expense>(`/v1/expense/${id}`, payload);
		return res.data;
	},

	deleteExpense: async (id: number) => {
		const res = await api.delete(`/v1/expense/${id}`);
		return res.data;
	},
};

export default expenseService;
