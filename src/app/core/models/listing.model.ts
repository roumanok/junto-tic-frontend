export interface Listing {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  type: 'product' | 'service';
  categoryId: string;
  categoryName: string;
  advertiserName: string;
  advertiserId: string;
  images: ListingImage[];
  isActive: boolean;
  maxQuantity?: number;
  deliveryMethods?: DeliveryMethod[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingImage {
  id: string;
  url: string;
  altText?: string;
  isMain: boolean;
  sortOrder: number;
}

export interface DeliveryMethod {
  id: string;
  type: 'pickup' | 'delivery';
  name: string;
  description?: string;
  cost: number;
  isActive: boolean;
}