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

export interface CreatedByDetail {
    id: number;
    full_name: string;
    phone_number?: string;
}

export interface OrderFilialDetail {
    id: number;
    name: string;
    region?: number;
    district?: number;
    address?: string;
    phone_number?: string | null;
    logo?: string | null;
    is_active?: boolean;
    is_delete?: boolean;
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
    created_time?: string | null;
    created_by?: number | null;
    created_by_detail?: CreatedByDetail | null;
    order_filial?: number | null;
    order_filial_detail?: OrderFilialDetail | null;
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

    // Order-historylar ro'yxatini olish (barcha filterlar backend params orqali)
    getOrdersMySelf: async (params?: {
        page?: number;
        page_size?: number;
        search?: string;
        date_from?: string;
        date_to?: string;
        created_by?: number;
        is_karzinka?: boolean;
        all_product_summa_min?: number;
        total_debt_today_client_min?: number;
        total_debt_client_min?: number;
        summa_total_min?: number;
    }): Promise<{
        count: number;
        next: string | null;
        previous: string | null;
        results: OrderResponse[];
        pagination?: { currentPage: number; lastPage: number; perPage: number; total: number };
    }> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.date_from) queryParams.append('date_from', params.date_from);
        if (params?.date_to) queryParams.append('date_to', params.date_to);
        if (params?.created_by != null) queryParams.append('created_by', params.created_by.toString());
        if (params?.is_karzinka !== undefined) queryParams.append('is_karzinka', String(params.is_karzinka));
        if (params?.all_product_summa_min != null) queryParams.append('all_product_summa_min', params.all_product_summa_min.toString());
        if (params?.total_debt_today_client_min != null) queryParams.append('total_debt_today_client_min', params.total_debt_today_client_min.toString());
        if (params?.total_debt_client_min != null) queryParams.append('total_debt_client_min', params.total_debt_client_min.toString());
        if (params?.summa_total_min != null) queryParams.append('summa_total_min', params.summa_total_min.toString());

        const response = await api.get<{
            count?: number;
            next?: string | null;
            previous?: string | null;
            results: OrderResponse[];
            pagination?: { currentPage: number; lastPage: number; perPage: number; total: number };
        }>(`/v1/order-history/self?${queryParams.toString()}`);
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
    createOrderProduct: async (data: {
        order_history?: number;
        count: number;
        product?: number;
        unit_price?: number;
        wholesale_price?: number;
        sklad?: number;
    }): Promise<any> => {
        const requestData: any = {
            order_history: data.order_history,
            product: data.product,
            count: data.count,
            unit_price: data.unit_price ?? 0,
            wholesale_price: data.wholesale_price ?? 0,
            sklad: data.sklad ?? null,
        };
        const response = await api.post('/v1/order-history-product', requestData);
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
