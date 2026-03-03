import api from './api';

export interface ExchangeRate {
	id: number;
	dollar: number;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface ExchangeRateResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: ExchangeRate[];
}

export const exchangeRateService = {
	// Barcha exchange ratelarni olish
	getExchangeRates: async ({ filial }: { filial?: number }): Promise<ExchangeRateResponse> => {
		const params = new URLSearchParams();
		if (filial !== undefined) {
			params.append('filial', filial.toString());
		}
		const response = await api.get<ExchangeRateResponse>('/v1/exchange-rate', { params });
		return response.data;
	},

	// Faol exchange rateni olish
	getActiveExchangeRate: async (): Promise<ExchangeRate | null> => {
		const response = await api.get<ExchangeRateResponse>('/v1/exchange-rate/?is_active=true');
		const results = response.data.results;
		return results.length > 0 ? results[0] : null;
	},

	// Yangi exchange rate yaratish
	createExchangeRate: async (rate: number): Promise<ExchangeRate> => {
		const response = await api.post<ExchangeRate>('/v1/exchange-rate/', {
			rate,
			is_active: true,
		});
		return response.data;
	},

	// Exchange rateni yangilash
	updateExchangeRate: async (id: number, rate: number, is_active?: boolean): Promise<ExchangeRate> => {
		const payload: any = { rate };
		if (is_active !== undefined) {
			payload.is_active = is_active;
		}
		const response = await api.patch<ExchangeRate>(`/v1/exchange-rate/${id}/`, payload);
		return response.data;
	},
};
