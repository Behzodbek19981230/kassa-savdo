import api from './api';

export interface CreateOrderRequest {
	order?: number;
	client: number;
	employee?: number;
	exchange_rate: number;
	date?: string;
	note?: string;
	all_profit_dollar?: number;
	total_debt_client?: number;
	total_debt_today_client?: number;
	all_product_summa?: number;
	summa_total_dollar?: number;
	summa_dollar?: number;
	summa_naqt?: number;
	summa_kilik?: number;
	summa_terminal?: number;
	summa_transfer?: number;
	discount_amount?: number;
	zdacha_dollar?: number;
	zdacha_som?: number;
	is_delete?: boolean;
	order_status?: boolean;
	update_status?: number;
	is_debtor_product?: boolean;
	status_order_dukon?: boolean;
	status_order_sklad?: boolean;
	driver_info?: string;
	is_karzinka?: boolean;
}

export interface RegionDetail {
	id: number;
	code: string;
	name: string;
}

export interface DistrictDetail {
	id: number;
	code: string;
	name: string;
	region: number;
}

export interface FilialDetail {
	id: number;
	name: string;
	region: number;
	region_detail: RegionDetail | null;
	district: number;
	district_detail: DistrictDetail | null;
	address: string;
	phone_number: string;
	logo: string | null;
	is_active: boolean;
	is_delete: boolean;
}

export interface ClientDetail {
	id: number;
	telegram_id?: number | null;
	full_name: string;
	is_active: boolean;
	date_of_birthday?: string | null;
	gender?: string | null;
	phone_number: string;
	region?: number | null;
	region_detail?: RegionDetail | null;
	district?: number | null;
	district_detail?: DistrictDetail | null;
	filial: number;
	filial_detail: FilialDetail | null;
	total_debt: string;
	keshbek: string;
	is_profit_loss: boolean;
	type: number;
	is_delete: boolean;
}

export interface OrderResponse {
	id: number;
	order?: number | null;
	order_detail?: any | null;
	client: number;
	client_detail: ClientDetail | null;
	employee: number;
	exchange_rate: string;
	date: string | null;
	note: string;
	all_profit_dollar: string;
	total_debt_client: string;
	total_debt_today_client: string;
	all_product_summa: string;
	summa_total_dollar: string;
	summa_dollar: string;
	summa_naqt: string;
	summa_kilik: string;
	summa_terminal: string;
	summa_transfer: string;
	discount_amount: string;
	zdacha_dollar: string;
	zdacha_som: string;
	is_delete: boolean;
	order_status: boolean;
	update_status: number;
	is_debtor_product: boolean;
	status_order_dukon: boolean;
	status_order_sklad: boolean;
	driver_info: string;
	is_karzinka: boolean;
}

// Order service
export const orderService = {
	// Yangi order yaratish
	createOrder: async (data: CreateOrderRequest): Promise<OrderResponse> => {
		const response = await api.post<OrderResponse>('/v1/order-history', {
			// order: data.order || 0,
			client: data.client,
			employee: data.employee || 0,
			exchange_rate: data.exchange_rate,
			// date: data.date || new Date().toISOString(),
			note: data.note || '',
			all_profit_dollar: data.all_profit_dollar || 0,
			total_debt_client: data.total_debt_client || 0,
			total_debt_today_client: data.total_debt_today_client || 0,
			all_product_summa: data.all_product_summa || 0,
			summa_total_dollar: data.summa_total_dollar || 0,
			summa_dollar: data.summa_dollar || 0,
			summa_naqt: data.summa_naqt || 0,
			summa_kilik: data.summa_kilik || 0,
			summa_terminal: data.summa_terminal || 0,
			summa_transfer: data.summa_transfer || 0,
			discount_amount: data.discount_amount || 0,
			zdacha_dollar: data.zdacha_dollar || 0,
			zdacha_som: data.zdacha_som || 0,
			is_delete: data.is_delete ?? false,
			order_status: data.order_status ?? true,
			update_status: data.update_status || 0,
			is_debtor_product: data.is_debtor_product ?? false,
			status_order_dukon: data.status_order_dukon ?? true,
			status_order_sklad: data.status_order_sklad ?? true,
			driver_info: data.driver_info || '',
			is_karzinka: data.is_karzinka ?? false,
		});
		return response.data;
	},

	// Order ma'lumotlarini olish
	getOrder: async (id: number): Promise<OrderResponse> => {
		const response = await api.get<OrderResponse>(`/v1/order-history/${id}`);
		return response.data;
	},

	// Order yangilash
	updateOrder: async (id: number, data: Partial<CreateOrderRequest>): Promise<OrderResponse> => {
		const response = await api.patch<OrderResponse>(`/v1/order-history/${id}`, data);
		return response.data;
	},

	// Order-historylar ro'yxatini olish
	getOrders: async (params?: {
		page?: number;
		page_size?: number;
		search?: string;
		date_from?: string;
		date_to?: string;
	}): Promise<{
		count: number;
		next: string | null;
		previous: string | null;
		results: OrderResponse[];
	}> => {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.append('page', params.page.toString());
		if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
		if (params?.search) queryParams.append('search', params.search);
		if (params?.date_from) queryParams.append('date_from', params.date_from);
		if (params?.date_to) queryParams.append('date_to', params.date_to);

		const response = await api.get<{
			count: number;
			next: string | null;
			previous: string | null;
			results: OrderResponse[];
		}>(`/v1/order-history?${queryParams.toString()}`);
		return response.data;
	},

	// Order o'chirish
	deleteOrder: async (id: number): Promise<void> => {
		await api.delete(`/v1/order-history/${id}`);
	},

	// Order-history-product yaratish
	createOrderProduct: async (data: { order_history?: number; count: number }): Promise<any> => {
		const response = await api.post('/v1/order-history-product', {
			// date: data.date || new Date().toISOString().split('T')[0],
			order_history: data.order_history,
			// vozvrat_order: data.vozvrat_order || 0,
			// branch: data.branch,
			// model: data.model,
			// type: data.type,
			// size: data.size,
			count: data.count,
			// given_count: data.given_count || data.count,
			// real_price: data.real_price,
			// unit_price: data.unit_price,
			// wholesale_price: data.wholesale_price || data.unit_price,
			// is_delete: data.is_delete ?? false,
			// cargo_terminal: data.cargo_terminal || '',
			// price_difference: data.price_difference ?? false,
			// status_order: data.status_order ?? true,
			// is_karzinka: data.is_karzinka ?? true,
		});
		return response.data;
	},

	// Order-history-product ro'yxatini olish (pagination + results struktura)
	getOrderProducts: async (orderHistoryId: number): Promise<any[]> => {
		const response = await api.get<{ results?: any[]; pagination?: unknown }>(
			`/v1/order-history-product?order_history=${orderHistoryId}`
		);
		const data = response.data;
		if (Array.isArray(data)) return data;
		if (data?.results && Array.isArray(data.results)) return data.results;
		return [];
	},

	// Order-history-product yangilash
	updateOrderProduct: async (id: number, data: { count?: number }): Promise<any> => {
		const response = await api.patch(`/v1/order-history-product/${id}`, data);
		return response.data;
	},

	// Order-history-product o'chirish
	deleteOrderProduct: async (id: number): Promise<void> => {
		await api.delete(`/v1/order-history-product/${id}`);
	},
};
