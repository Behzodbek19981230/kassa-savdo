import api from './api';

export interface Client {
    id: number;
    telegram_id?: number;
    full_name: string;
    is_active: boolean;
    date_of_birthday?: string | null;
    gender?: string;
    phone_number: string;
    region?: number;
    district?: number;
    filial?: number;
    total_debt?: number;
    keshbek?: number;
    is_profit_loss?: boolean;
    type?: number;
    is_delete?: boolean;
}

export interface CreateClientRequest {
    telegram_id?: number;
    full_name: string;
    is_active?: boolean;
    date_of_birthday?: string;
    gender?: string;
    phone_number: string;
    region?: number;
    district?: number;
    filial?: number;
    total_debt?: number;
    keshbek?: number;
    is_profit_loss?: boolean;
    type?: number;
    is_delete?: boolean;
}

export interface ClientListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Client[];
}

// Client service
export const clientService = {
    // Mijozlar ro'yxatini olish
    getClients: async (search?: string): Promise<ClientListResponse> => {
        const params = new URLSearchParams();
        if (search) {
            params.append('search', search);
        }
        const response = await api.get<ClientListResponse>(`/v1/client?${params.toString()}`);
        return response.data;
    },

    // Mijoz yaratish
    createClient: async (data: CreateClientRequest): Promise<Client> => {
        const response = await api.post<Client>('/v1/client', {
            full_name: data.full_name,
            phone_number: data.phone_number,
            filial: data.filial || 0,
            total_debt: data.total_debt || 0,
            keshbek: data.keshbek || 0,
            is_profit_loss: data.is_profit_loss ?? true,
            type: data.type || 0,
            is_delete: data.is_delete ?? false,
        });
        return response.data;
    },

    // Mijoz ma'lumotlarini olish
    getClient: async (id: number): Promise<Client> => {
        const response = await api.get<Client>(`/v1/client/${id}`);
        return response.data;
    },
};
