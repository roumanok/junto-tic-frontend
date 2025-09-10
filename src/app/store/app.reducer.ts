import { createReducer, on } from '@ngrx/store';
import { AppState } from './app.state';
import * as AppActions from './app.actions';

export const initialState: AppState = {
  community: {
    current: null,
    loading: false,
    error: null
  },
  theme: {
    current: null,
    loading: false,
    error: null
  },
  categories: {
    items: [],
    megaMenuData: [],
    loading: false,
    error: null
  },
  ui: {
    isMobileMenuOpen: false,
    isLoading: false,
    globalError: null
  }
};

export const appReducer = createReducer(
  initialState,
  
  // Community actions
  on(AppActions.loadCommunity, (state) => ({
    ...state,
    community: { ...state.community, loading: true, error: null }
  })),
  
  on(AppActions.loadCommunitySuccess, (state, { community }) => ({
    ...state,
    community: { current: community, loading: false, error: null }
  })),
  
  on(AppActions.loadCommunityFailure, (state, { error }) => ({
    ...state,
    community: { ...state.community, loading: false, error }
  })),

  // Theme actions
  on(AppActions.loadTheme, (state) => ({
    ...state,
    theme: { ...state.theme, loading: true, error: null }
  })),
  
  on(AppActions.loadThemeSuccess, (state, { theme }) => ({
    ...state,
    theme: { current: theme, loading: false, error: null }
  })),
  
  on(AppActions.loadThemeFailure, (state, { error }) => ({
    ...state,
    theme: { ...state.theme, loading: false, error }
  })),

  // UI actions
  on(AppActions.toggleMobileMenu, (state) => ({
    ...state,
    ui: { ...state.ui, isMobileMenuOpen: !state.ui.isMobileMenuOpen }
  })),
  
  on(AppActions.closeMobileMenu, (state) => ({
    ...state,
    ui: { ...state.ui, isMobileMenuOpen: false }
  }))
);