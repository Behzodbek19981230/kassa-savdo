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

/**
 * @deprecated Product interface deprecated - ProductItem ishlatish kerak
 * ProductItem API dan kelgan to'g'ri strukturaga mos keladi
 */
export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    unit: string;
    image?: string;
    productId?: number; // API dan kelgan id    
    branch_category_detail?: BranchCategoryDetail;
    model_detail?: ModelDetail;
    type_detail?: TypeDetail;
    size_detail?: SizeDetail;
    branch_detail?: BranchDetail;
    sklad_detail?: SkladDetail;
    product_detail?: ProductDetail;
    order_history_detail?: OrderHistoryDetail;
    order_filial_detail?: OrderFilialDetail;

}
export interface OrderItem {
    id: number;
    date: string | null;
    order_history: number;
    order_history_detail: OrderHistoryDetail | null;
    vozvrat_order: number | null;
    vozvrat_order_detail: any | null;

    product: number;
    product_detail: ProductDetail;

    branch: number;
    branch_detail: BranchDetail;

    branch_category: number;
    branch_category_detail: BranchCategoryDetail;

    model: number;
    model_detail: ModelDetail;

    type: number;
    type_detail: TypeDetail;

    size: number;
    size_detail: SizeDetail;

    count: number;
    given_count: number;

    real_price: string;
    unit_price: string;
    wholesale_price: string;

    is_delete: boolean;
    cargo_terminal: any | null;
    price_difference: boolean;
    status_order: boolean;
    is_karzinka: boolean;

    sklad: number;
    sklad_detail: SkladDetail;

    price_dollar: string;
    price_sum: string;
}

/* ================= ORDER HISTORY ================= */

export interface OrderHistoryDetail {
    id: number;
    order: number | null;
    order_detail: any | null;

    client: number;
    client_detail: ClientDetail;

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

    created_time: string;
    created_by: number;
    created_by_detail: CreatedByDetail;

    order_filial: number;
    order_filial_detail: OrderFilialDetail;

    currency: number | null;
    currency_detail: any | null;
}

/* ================= DEBT REPAYMENT ================= */

export interface DebtRepayment {
    id?: number;
    filial: number;
    client: number;
    employee: number;
    exchange_rate: number;
    date: string;
    note: string;
    old_total_debt_client: number;
    total_debt_client: number;
    summa_total_dollar: number;
    summa_dollar: number;
    summa_naqt: number;
    summa_kilik: number;
    summa_terminal: number;
    summa_transfer: number;
    discount_amount: number;
    zdacha_dollar: number;
    zdacha_som: number;
    is_delete: boolean;
    debt_status: boolean;
}

/* ================= EXPENSE ================= */

export interface Expense {
    id?: number;
    filial: number;
    category?: number;
    summa_total_dollar?: number;
    summa_dollar?: number;
    summa_naqt?: number;
    summa_kilik?: number;
    summa_terminal?: number;
    summa_transfer?: number;
    date?: string;
    note?: string;
    is_delete?: boolean;
    is_salary?: boolean;
    employee?: number;
}
interface ExpenseItem {
    id: number;
    date: string;
    summa_total_dollar: string;
    summa_dollar?: string;
    summa_naqt?: string;
    summa_kilik?: string;
    summa_terminal?: string;
    summa_transfer?: string;
    note?: string;
    category?: number;
    category_detail?: { id: number; name?: string };
    employee_detail?: { full_name?: string };
    filial?: number;
    is_salary?: boolean;
}
export interface ExpenseGroup {
    date: string;
    items: ExpenseItem[];
    totals?: {
        summa_total_dollar?: string;
        summa_dollar?: string;
        summa_naqt?: string;
        summa_kilik?: string;
        summa_terminal?: string;
        summa_transfer?: string;
    };
}

/* ================= VOZVRAT ORDER ================= */

export interface VozvratOrder {
    id?: number;
    filial: number;
    client: number;
    employee: number;
    exchange_rate: number;
    date: string;
    note: string;
    old_total_debt_client: number;
    total_debt_client: number;
    summa_total_dollar: number;
    summa_dollar: number;
    summa_naqt: number;
    summa_kilik: number;
    summa_terminal: number;
    summa_transfer: number;
    discount_amount: number;
    is_delete: boolean;
    is_vazvrat_status: boolean;
}

export interface ClientDetail {
    id: number;
    telegram_id: string | null;
    full_name: string;
    is_active: boolean;
    date_of_birthday: string | null;
    gender: string | null;
    phone_number: string;
    region: number | null;
    district: number | null;
    filial: number;
    total_debt: string;
    keshbek: string;
    is_profit_loss: boolean;
    type: number;
    is_delete: boolean;
}

export interface CreatedByDetail {
    id: number;
    full_name: string;
    phone_number: string;
}

export interface OrderFilialDetail {
    id: number;
    name: string;
    region: number;
    district: number;
    address: string;
    phone_number: string | null;
    logo: string | null;
    is_active: boolean;
    is_delete: boolean;
}

export interface FilialDetail {
    id: number;
    name: string;
    region: number;
    district: number;
    address: string;
    phone_number: string | null;
    logo: string | null;
    is_active: boolean;
    is_delete: boolean;
    is_head_office: boolean;
}

/* ================= PRODUCT ================= */

export interface ProductDetail {
    id: number;
    date: string;
    reserve_limit: number;
    filial: number;
    branch: number;
    branch_category: number;
    model: number;
    type: number;
    size: number;
    count: number;
    real_price: string;
    unit_price: string;
    wholesale_price: string;
    min_price: string;
    note: string;
    is_delete: boolean;
    is_active: boolean;
}

export interface BranchDetail {
    id: number;
    name: string;
    sorting: number;
    is_delete: boolean;
}

export interface BranchCategoryDetail {
    id: number;
    product_branch: number;
    name: string;
    sorting: number;
    is_delete: boolean;
}

export interface ModelDetail {
    id: number;
    name: string;
    branch: number | null;
    branch_detail: any | null;
    branch_category: number;
    branch_category_detail: BranchCategoryDetail;
    sorting: number;
    is_delete: boolean;
}

export interface TypeDetail {
    id: number;
    name: string;
    branch: number;
    branch_detail: BranchDetail;
    branch_category: number;
    branch_category_detail: BranchCategoryDetail;
    madel: number;
    madel_detail: ModelDetail;
    sorting: number;
    is_delete: boolean;
}

export interface SizeDetail {
    id: number;
    product_type: number;
    product_type_detail?: TypeDetail;
    name: string;
    unit?: number;
    unit_detail?: UnitDetail;
    unit_code?: string;
    sorting: number;
    is_delete: boolean;
}

export interface UnitDetail {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
}

export interface ProductImage {
    id: number;
    file: string;
}

export interface ProductItem {
    id: number;
    date: string;
    reserve_limit: number;
    filial: number;
    filial_detail: FilialDetail;
    branch: number;
    branch_detail: BranchDetail;
    branch_category: number;
    branch_category_detail: BranchCategoryDetail;
    model: number;
    model_detail: ModelDetail;
    type: number;
    type_detail: TypeDetail;
    size: number;
    size_detail: SizeDetail;
    count: number;
    real_price: string;
    unit_price: string;
    wholesale_price: string;
    min_price: string;
    note: string;
    is_delete: boolean;
    images: ProductImage | null;
    is_active: boolean;
}

export interface ProductGroup {
    model: number;
    model_detail: ModelDetail;
    total_product_count: number;
    items: ProductItem[];
}

/* ================= SKLAD ================= */

export interface SkladDetail {
    id: number;
    date: string | null;
    reserve_limit: number | null;
    filial: number;
    branch: number | null;
    branch_category: number | null;
    model: number | null;
    type: number | null;
    size: number | null;
    count: number | null;
    note: string | null;
    is_delete: boolean;
    is_active: boolean;
}

export interface CartItem extends Omit<ProductItem, 'id'> {
    id: string; // CartItem id string bo'lishi kerak (ProductItem.id number)
    quantity: number;
    // Optional currency breakdowns
    priceDollar?: number; // unit price in USD
    totalPriceDollar?: number; // total price in USD for the item
    priceSum?: number; // unit price in UZS (alias of price)
    totalPrice?: number; // total price for the item
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
    total_debt?: number;
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
export type { OrderResponse, CreateOrderRequest } from '../services/orderService';
