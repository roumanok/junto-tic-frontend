import { Advertiser } from "./advertiser.model";
import { Category } from "./category.model";

export interface Listing {
  id: string;
  public_token: string;
  title?: string;
  description?: string;
  short_description?: string;
  price?: number;
  list_price?: number;
  type: 'product' | 'service';
  max_quantity_per_order: number;
  stock_quantity: number;
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

export interface DeliveryMethod {
  id: string;
  type: 'pickup' | 'delivery';
  name: string;
  description?: string;
  cost: number;
  is_active: boolean;
}