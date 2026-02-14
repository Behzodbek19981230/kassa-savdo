import api from './api';

export interface Sklad {
    id: number;
    name: string;
}

export interface SkladListResponse {
    results?: Sklad[];
    count?: number;
}

export const skladService = {
    getSkladlar: async (params?: { filial?: number }): Promise<Sklad[]> => {
        const queryParams = new URLSearchParams();
        if (params?.filial) queryParams.append('filial', params.filial.toString());
        const response = await api.get<SkladListResponse | Sklad[]>(`/v1/sklad?${queryParams.toString()}`);
        const data = response.data;
        if (Array.isArray(data)) return data;
        return (data as SkladListResponse)?.results ?? [];
    },
};
