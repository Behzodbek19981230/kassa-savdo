import api from './api';

export interface BranchDetail {
    id: number;
    name: string;
    sorting: number;
    is_delete: boolean;
}

export interface Branch {
    id: number;
    name: string;
    sorting: number;
    is_delete: boolean;
}

export interface ProductImage {
    id: number;
    file: string;
}

export interface ProductResponse {
    id: number;
    date: string;
    reserve_limit: number;
    filial: number;
    filial_detail: any;
    branch: number;
    branch_detail: BranchDetail;
    model: number;
    model_detail: any;
    type: number;
    type_detail: any;
    size: number;
    size_detail: any;
    count: number;
    real_price: string;
    unit_price: string;
    wholesale_price: string;
    min_price: string;
    note: string;
    is_delete: boolean;
    images: ProductImage[];
}

export interface ProductsResponse {
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: ProductResponse[];
    filters: any;
}

export interface BranchesResponse {
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: Branch[];
    filters: any;
}

export const productService = {
    // Mahsulotlarni olish
    getProducts: async (params?: {
        page?: number;
        per_page?: number;
        search?: string;
        filial?: number;
        branch?: number;
    }): Promise<ProductsResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.filial) queryParams.append('filial', params.filial.toString());
        if (params?.branch) queryParams.append('branch', params.branch.toString());

        const response = await api.get<ProductsResponse>(`/v1/product?${queryParams.toString()}`);
        return response.data;
    },

    // Branchlarni olish
    getBranches: async (): Promise<BranchesResponse> => {
        const response = await api.get<BranchesResponse>('/v1/product-branch');
        return response.data;
    },
};
