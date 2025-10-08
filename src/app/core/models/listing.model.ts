import { Advertiser } from "./advertiser.model";
import { Category } from "./category.model";

export interface Listing {
  id: string;
  public_token: string;
  title?: string;
  description?: string;
  short_description?: string;
  price?: string;
  list_price?: string;
  type: 'product' | 'service';
  max_quantity_per_order: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  category: Category;
  advertiser: Advertiser;
  primary_image: ListingImage; 
  created_at: string;  
}

export interface ListingImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ListingDetail extends Listing {
  images: ListingImage[];
  slug?: string;
  meta_description?: string;
  tags?: string[];
  delivery_methods?: DeliveryMethod[];
  related_listings?: Listing[];
}

export interface DeliveryMethod {
  id: string;
  type: 'pickup' | 'delivery';
  name: string;
  description?: string;
  cost: number;
  is_active: boolean;
}

export interface MyListing {
  id: string;
  title: string;
  description: string;
  price: number;
  list_price?: number;
  stock: number;
  total_sold?: number;
  status: 'active' | 'inactive';
  type?: 'product' | 'service'; // ← NUEVO campo
  image_url?: string;
  created_at: string;
  updated_at: string;
  category?: string;
}

export interface DashboardStats {
  total_listings: number;
  active_listings: number;
  inactive_listings: number;
  featured_listings: number;
  out_of_stock_listings: number;
  total_sales: number;
  total_stock: number;
  inventory_value: number;
  estimated_revenue: number;
  average_price: number;
  low_stock_count: number;
  inactive_with_stock: number;
}