/**
 * Centralized type definitions
 */

// Auth Types
export interface Kassir {
	id: number;
	username: string;
	full_name: string;
	email: string;
	phone_number: string;
	avatar: string | null;
}

// Product Types
export interface Product {
	id: string;
	name: string;
	price: number;
	stock: number;
	unit: string;
	category?: string;
	isFavorite?: boolean;
	image?: string;
	branchName?: string;
	productId?: number; // API dan kelgan id
	modelName?: string;
	typeName?: string;
	branchCategoryName?: string; // branch_category_detail.name
    
	size?: number | string;
	unitCode?: string;
	branchId?: number;
	modelId?: number;
	typeId?: number;
	sizeId?: number;
	unitPrice?: number; // unit_price
	wholesalePrice?: number; // wholesale_price
}

export interface CartItem extends Product {
	quantity: number;
	totalPrice: number;
}

// Payment Types
export interface PaymentMethod {
	id: string;
	name: string;
	type: 'cash' | 'card' | 'transfer' | 'credit';
	icon?: string;
	color?: string;
}

// Customer Types
export interface Customer {
	id: string;
	name: string;
	phone?: string;
	email?: string;
}

// Sale Types
export interface Sale {
	id: string;
	orderNumber: string;
	date: Date;
	items: CartItem[];
	totalAmount: number;
	paidAmount: number;
	customer?: Customer;
	kassirName?: string;
	paymentMethods: { [key: string]: number };
}

// Re-export service types
export type { User, Role, Filial, UserListResponse } from '../services/userService';
export type {
	OrderResponse,
	CreateOrderRequest,
	ClientDetail,
	OrderFilialDetail,
} from '../services/orderService';
