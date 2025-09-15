import { createSelector } from '@ngrx/store';
import { AppState } from './app.state';
/*
// Community Selectors
export const selectCommunityState = (state: AppState) => state.community;
export const selectCurrentCommunity = createSelector(
  selectCommunityState,
  (state) => state.current
);
export const selectCommunityLoading = createSelector(
  selectCommunityState,
  (state) => state.loading
);
export const selectCommunityError = createSelector(
  selectCommunityState,
  (state) => state.error
);

// Theme Selectors
export const selectThemeState = (state: AppState) => state.theme;
export const selectCurrentTheme = createSelector(
  selectThemeState,
  (state) => state.current
);
export const selectThemeLoading = createSelector(
  selectThemeState,
  (state) => state.loading
);
export const selectThemeError = createSelector(
  selectThemeState,
  (state) => state.error
);

// Categories Selectors
export const selectCategoriesState = (state: AppState) => state.categories;
export const selectCategories = createSelector(
  selectCategoriesState,
  (state) => state.items
);
export const selectMegaMenuData = createSelector(
  selectCategoriesState,
  (state) => state.megaMenuData
);
export const selectCategoriesLoading = createSelector(
  selectCategoriesState,
  (state) => state.loading
);
export const selectCategoriesError = createSelector(
  selectCategoriesState,
  (state) => state.error
);
*/
// UI Selectors
export const selectUIState = (state: AppState) => state.ui;
export const selectIsMobileMenuOpen = createSelector(
  selectUIState,
  (state) => state.isMobileMenuOpen
);
export const selectGlobalLoading = createSelector(
  selectUIState,
  (state) => state.isLoading
);
export const selectGlobalError = createSelector(
  selectUIState,
  (state) => state.globalError
);

/*
// Combined Selectors
export const selectAppInitialized = createSelector(
  selectCurrentCommunity,
  selectCurrentTheme,
  selectCategories,
  (community, theme, categories) => 
    !!community && !!theme && categories.length > 0
);
*/