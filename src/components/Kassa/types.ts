export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: 'dona' | 'kg' | 'xizmat';
  category?: string;
  isFavorite?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  totalPrice: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'transfer' | 'credit';
  icon?: string;
  color?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

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