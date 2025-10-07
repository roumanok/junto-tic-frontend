export interface OrderDetail {
  id: string;
  public_id: string;
  customer_id: string;
  community_id: string;
  subtotal: string;
  delivery_cost: string;
  total: string;
  delivery_method_type: string;
  status: string;
  payment_status: string;
  created_at: string;
  paid_at: string;
  customer_identification_type: string;
  customer_identification_number: string;
  billing_name: string;
  billing_phone_area_code: string;
  billing_phone_number: string;
  billing_address: string;
  billing_apartment: string;
  billing_postal_code: string;
  billing_city: string;
  billing_province: string;
  delivery_name: string;
  delivery_phone_area_code: string;
  delivery_phone_number: string;
  delivery_address: string;
  delivery_apartment: string;
  delivery_postal_code: string;
  delivery_city: string;
  delivery_province: string;
  delivery_notes: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_image_url?: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  advertiser_id: string;
  advertiser_name: string;
}

export interface Order {
  id: string;
  public_id: string;
  total: string;
  delivery_method_type: string;
  created_at: string;
  status: string;
  payment_status: string;
  items: any[];
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'issued' | 'in_process' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'deferred' | 'objected' | 'review' | 'validate' | 'overdue';