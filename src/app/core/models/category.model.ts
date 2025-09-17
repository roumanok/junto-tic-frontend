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

// Para el mega menú transformado
export interface CategoryLink {
  name: string;
  url: string;
  icon?: string;
  description?: string;
}

export interface Subcategory {
  id?: string;
  title: string;
  description?: string;
  links: CategoryLink[];
  image?: string;
}

export interface MMCategory {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  image?: string;
  subcategories: Subcategory[];
  featured?: boolean;
  order?: number;
}

export interface FeaturedCategory {
  name: string;
  url: string;
  active: boolean;
  icon?: string;
}

// Para la navegación
export interface NavigationConfig {
  featuredCategories: FeaturedCategory[];
  showMobileUserActions: boolean;
}