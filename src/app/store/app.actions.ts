import { createAction, props } from '@ngrx/store';
import { Community, CommunityTheme } from '../core/models/community.model';

// Community Actions
export const loadCommunity = createAction('[App] Load Community');
export const loadCommunitySuccess = createAction(
  '[App] Load Community Success',
  props<{ community: Community }>()
);
export const loadCommunityFailure = createAction(
  '[App] Load Community Failure',
  props<{ error: string }>()
);

// Theme Actions
export const loadTheme = createAction('[App] Load Theme');
export const loadThemeSuccess = createAction(
  '[App] Load Theme Success',
  props<{ theme: CommunityTheme }>()
);
export const loadThemeFailure = createAction(
  '[App] Load Theme Failure',
  props<{ error: string }>()
);

// Categories Actions
export const loadCategories = createAction('[App] Load Categories');
export const loadCategoriesSuccess = createAction(
  '[App] Load Categories Success',
  props<{ categories: any[]; megaMenuData?: any[] }>()
);
export const loadCategoriesFailure = createAction(
  '[App] Load Categories Failure',
  props<{ error: string }>()
);

// UI Actions
export const toggleMobileMenu = createAction('[UI] Toggle Mobile Menu');
export const closeMobileMenu = createAction('[UI] Close Mobile Menu');
export const setGlobalLoading = createAction(
  '[UI] Set Global Loading',
  props<{ isLoading: boolean }>()
);
export const setGlobalError = createAction(
  '[UI] Set Global Error',
  props<{ error: string }>()
);
export const clearGlobalError = createAction('[UI] Clear Global Error');