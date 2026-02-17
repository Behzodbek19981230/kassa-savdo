import api from './api';

export interface Currency {
    id: number;
    code: string;
    name: string;
}

export interface CurrencyResponse {
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: Currency[];
    filters: null;
}

export const currencyService = {
    // Currency ro'yxatini olish
    getCurrencies: async (): Promise<Currency[]> => {
        const response = await api.get<CurrencyResponse>('/v1/currency/');
        return response.data.results;
    },
};
