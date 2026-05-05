export interface OrderBuyer {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface OrderItem {
  name: string;
  qty?: number;
  price?: number;
  image?: string;
  product?: string;
}

export interface Order {
  _id: string;
  buyer: OrderBuyer | string;
  items: OrderItem[];
  status: string;
  totalAmount?: number;
  shippingAddress?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt?: string;
  order_type?: string;
}