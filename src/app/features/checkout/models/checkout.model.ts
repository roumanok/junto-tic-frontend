export interface CheckoutItem {
  listing_id: string;
  quantity: number;
}

export interface CheckoutProduct {
  id: string;
  title: string;
  price: string;
  image_url?: string;
  delivery_methods?: DeliveryMethod[];
  advertiser_id?: string;
  max_quantity_per_order?: number;
  stock_quantity?: number;
}

export interface DeliveryMethod {
  id: string;
  type: 'pickup' | 'delivery';
  name: string;
  description?: string;
  cost: string;
  address?: string;
}

export interface CheckoutValidationRequest {
  items: CheckoutItem[];
  seller_id: string;
}

export interface CheckoutValidationResponse {
  valid: boolean;
  errors: ValidationError[];
  updated_items?: CheckoutItem[];
}

export interface ValidationError {
  listing_id: string;
  error_type: string;
  message: string;
  current_value?: any;
}

export interface CheckoutCalculationRequest {
  items: CheckoutItem[];
  seller_id: string;
  delivery_method_id?: string;
  discount_code?: string;
}

export interface CheckoutCalculationResponse {
  subtotal: string;
  shipping: string;
  discounts: string;
  taxes: string;
  total: string;
  errors?: string[];
}

export interface CreateOrderRequest {
  items: CheckoutItem[];    
  customer_identification_type: string;
  customer_identification_number: string;
  customer_email: string;
  billing_name: string;
  billing_phone: string;
  billing_address: string;
  billing_apartment?: string;
  billing_postal_code?: string;
  billing_city: string;
  billing_province: string;
  delivery_method_id: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_apartment?: string;
  delivery_postal_code?: string;
  delivery_city: string;
  delivery_province: string;
  delivery_notes?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  payment_url: string;
  status: string;
}