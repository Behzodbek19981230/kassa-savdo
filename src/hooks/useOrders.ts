import { useQuery } from '@tanstack/react-query';
import { orderService, OrderResponse } from '../services/orderService';

export interface UseOrdersParams {
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
}

export const useOrders = (params?: UseOrdersParams) => {
	return useQuery({
		queryKey: ['orders', params],
		queryFn: () => orderService.getOrders(params),
		staleTime: 30000, // 30 soniya
	});
};
export const useOrdersMySelf = (params?: UseOrdersParams) => {
	return useQuery({
		queryKey: ['orders-my-self', params],
		queryFn: () => orderService.getOrdersMySelf(params),
		staleTime: 30000, // 30 soniya
	});
};
