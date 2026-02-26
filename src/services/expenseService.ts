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
    is_salary?: boolean;
    employee?: number;
}

export interface ExpensesResponse {
    count: number;
    results: Expense[];
}

export const expenseService = {
    getExpenses: async (params?: { page?: number; limit?: number; filial?: number | null }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.filial !== undefined && params?.filial !== null) query.append('filial', params.filial.toString());
        const res = await api.get<ExpensesResponse>(`/v1/expense?${query.toString()}`);
        return res.data;
    },

    getExpensesGroupedByDate: async (params?: {
        filial?: number | null;
        date_from?: string;
        date_to?: string;
        category?: number | null;
    }) => {
        const query = new URLSearchParams();
        if (params?.filial !== undefined && params?.filial !== null) query.append('filial', params.filial.toString());
        if (params?.date_from) query.append('date_from', params.date_from);
        if (params?.date_to) query.append('date_to', params.date_to);
        if (params?.category !== undefined && params?.category !== null)
            query.append('category', params.category.toString());
        // Note: user requested /api/v1/expense/group-by-date
        const res = await api.get<any>(`/v1/expense/group-by-date?${query.toString()}`);
        // API returns an object with pagination and `results` array; return results for ease of use
        return res.data?.results ?? res.data;
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
