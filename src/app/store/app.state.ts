import { Community, CommunityTheme } from '../core/models/community.model';

export interface AppState {
  community: CommunityState;
  theme: ThemeState;
  categories: CategoriesState;
  ui: UIState;
}

export interface CommunityState {
  current: Community | null;
  loading: boolean;
  error: string | null;
}

export interface ThemeState {
  current: CommunityTheme | null;
  loading: boolean;
  error: string | null;
}

export interface CategoriesState {
  items: any[];
  megaMenuData: any[];
  loading: boolean;
  error: string | null;
}

export interface UIState {
  isMobileMenuOpen: boolean;
  isLoading: boolean;
  globalError: string | null;
}