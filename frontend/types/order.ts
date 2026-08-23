export interface OrderItem {
  productId: string;
  size: string;
  qty: number;
  priceAtOrder: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CouponSnapshot {
  code: string | null;
  discount: number;
  type: 'flat' | 'percentage' | null;
}

export interface Order {
  _id: string;
  userId: string | { _id: string, name: string, email: string };
  items: OrderItem[];
  subtotal: number;
  coupon: CouponSnapshot;
  total: number;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
