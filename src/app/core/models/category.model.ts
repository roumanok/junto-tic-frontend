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

export interface CategoryWithChildren extends Category {
  children?: Category[];
}

export interface MegaMenuCategory {
  id: string;
  title: string;
  subcategories: {
    title: string;
    links: {
      name: string;
      url: string;
    }[];
  }[];
}