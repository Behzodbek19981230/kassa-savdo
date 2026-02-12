export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit:  string;
  category?: string;
  isFavorite?: boolean;
  image?: string;
  branchName?: string;
  productId?: number; // API dan kelgan id
  modelName?: string;
  typeName?: string;
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