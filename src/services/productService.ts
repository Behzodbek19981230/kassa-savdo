import api from './api';
import { ProductItem, ProductGroup } from '../types';

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

export interface BranchCategoryDetail {
    id: number;
    product_branch: number;
    name: string;
    sorting: number;
    is_delete: boolean;
}

// ProductResponse deprecated - ProductItem ishlatish kerak
export type ProductResponse = ProductItem;

export interface ProductsResponse {
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: ProductItem[];
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
    // Mahsulotlarni model bo'yicha guruhlab olish
    getProductsGroupedByModel: async (params?: {
        page?: number;
        per_page?: number;
        limit?: number;
        search?: string;
        filial?: number;
        branch?: number;
        model?: number;
        type?: number;
    }): Promise<{ results: ProductGroup[]; pagination?: { currentPage: number; lastPage: number; perPage: number; total: number } }> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        else if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.filial) queryParams.append('filial', params.filial.toString());
        if (params?.branch) queryParams.append('branch', params.branch.toString());
        if (params?.model) queryParams.append('model', params.model.toString());
        if (params?.type) queryParams.append('type', params.type.toString());
        const response = await api.get<any>(`/v1/product/group-by-model?${queryParams.toString()}`);
        return response.data;
    },
    // Mahsulotlarni olish
    getProducts: async (params?: {
        page?: number;
        per_page?: number;
        limit?: number;
        search?: string;
        filial?: number;
        branch?: number;
        model?: number;
        type?: number;
    }): Promise<ProductsResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        else if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.filial) queryParams.append('filial', params.filial.toString());
        if (params?.branch) queryParams.append('branch', params.branch.toString());
        if (params?.model) queryParams.append('model', params.model.toString());
        if (params?.type) queryParams.append('type', params.type.toString());

        const response = await api.get<ProductsResponse>(`/v1/product?${queryParams.toString()}`);
        return response.data;
    },

    // Branchlarni olish
    getBranches: async (): Promise<BranchesResponse> => {
        const response = await api.get<BranchesResponse>('/v1/product-branch');
        return response.data;
    },

    // Skladda mahsulot qoldig'i (product + sklad bo'yicha). API pagination qaytaradi — faqat birinchi natijani olamiz.
    getProductStock: async (params: {
        product: number;
        sklad: number;
    }): Promise<{ product: number; sklad: number; count: number }> => {
        const queryParams = new URLSearchParams();
        queryParams.append('product', params.product.toString());
        queryParams.append('sklad', params.sklad.toString());
        const response = await api.get<{ results?: { product: number; sklad: number; count: number }[] }>(
            `/v1/product-stock/?${queryParams.toString()}`,
        );
        const results = response.data?.results;
        const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
        return first != null
            ? { product: first.product, sklad: first.sklad, count: first.count ?? 0 }
            : { product: params.product, sklad: params.sklad, count: 0 };
    },

    // Mahsulot rasmlarini olish
    getProductImages: async (id: number): Promise<ProductImage[]> => {
        const queryParams = new URLSearchParams();
        queryParams.append('product', id.toString());
        const response = await api.get<{ results?: ProductImage[] } | ProductImage[]>(
            `/v1/product-image?${queryParams.toString()}`,
        );
        const data = response.data;
        return Array.isArray(data) ? data : (data?.results ?? []);
    },
};
