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

export interface ProductModel {
    id: number;
    name: string;
    branch_category?: number;
    sorting?: number;
    is_delete?: boolean;
}

export interface ProductType {
    id: number;
    name: string;
    model?: number;
    sorting?: number;
    is_delete?: boolean;
}

export interface ProductModelsResponse {
    pagination?: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: ProductModel[];
    filters?: any;
}

export interface ProductTypesResponse {
    pagination?: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: ProductType[];
    filters?: any;
}

export interface BranchCategoriesResponse {
    pagination?: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    results: BranchCategoryDetail[];
    filters?: any;
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
        branch_category?: number;
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
        if (params?.branch_category) queryParams.append('branch_category', params.branch_category.toString());
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

    // Product modellarni olish (branch_category bo'yicha filter)
    getProductModels: async (params?: {
        branch_category?: number;
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<ProductModelsResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.branch_category) {
            queryParams.append('branch_category', params.branch_category.toString());
        }
        if (params?.page) {
            queryParams.append('page', params.page.toString());
        }
        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.search) {
            queryParams.append('search', params.search);
        }
        const response = await api.get<ProductModelsResponse>(`/v1/product-model?${queryParams.toString()}`);
        return response.data;
    },

    // Product typelarni olish (model bo'yicha filter)
    getProductTypes: async (params?: {
        model?: number;
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<ProductTypesResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.model) {
            queryParams.append('model', params.model.toString());
        }
        if (params?.page) {
            queryParams.append('page', params.page.toString());
        }
        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.search) {
            queryParams.append('search', params.search);
        }
        const response = await api.get<ProductTypesResponse>(`/v1/product-type?${queryParams.toString()}`);
        return response.data;
    },

    // Branch categorylarni olish (product_branch bo'yicha filter)
    getBranchCategories: async (params?: {
        product_branch?: number;
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<BranchCategoriesResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.product_branch) {
            queryParams.append('product_branch', params.product_branch.toString());
        }
        if (params?.page) {
            queryParams.append('page', params.page.toString());
        }
        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }
        if (params?.search) {
            queryParams.append('search', params.search);
        }
        const response = await api.get<BranchCategoriesResponse>(`/v1/product-branch-category?${queryParams.toString()}`);
        return response.data;
    },
};
