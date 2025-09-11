export interface Category {
  id: string;
  name?: string;
  slug: string;
  description?: string;
  parent_id: string;
  icon_url?: string;
  is_featured: boolean;
  sort_order: number;
}
