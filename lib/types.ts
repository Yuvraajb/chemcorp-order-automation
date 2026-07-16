export interface Brand {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  color: string;
  category: string;
  product_count?: number;
}

export interface Product {
  id: number;
  brand_id: number;
  name: string;
  slug: string;
  cas_number: string;
  category: string;
  grade: string;
  packaging: string;
  unit: string;
  price: number;
  min_order_qty: number;
  in_stock: number;
  brand_name?: string;
  brand_slug?: string;
  brand_color?: string;
}

export interface CartItem {
  productId: number;
  name: string;
  brandName: string;
  brandColor: string;
  grade: string;
  packaging: string;
  unit: string;
  price: number;
  minOrderQty: number;
  quantity: number;
}

export interface Order {
  id: number;
  order_number: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  gstin: string | null;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  brand_name: string;
  grade: string;
  packaging: string;
  unit: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}
