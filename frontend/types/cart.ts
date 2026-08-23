import { Product } from './product';

export interface CartItem {
  productId: string;
  product: Product;
  size: string;
  qty: number;
  lineTotal: number;
  inStock: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}
