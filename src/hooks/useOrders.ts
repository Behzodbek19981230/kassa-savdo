import { useQuery } from '@tanstack/react-query';
import { orderService, OrderResponse } from '../services/orderService';

export interface UseOrdersParams {
	page?: number;
	page_size?: number;
	search?: string;
	date_from?: string;
	date_to?: string;
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
