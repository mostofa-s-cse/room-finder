import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auth selectors
export const useAuthState = () => useAppSelector(state => state.auth);
export const useCurrentUser = () => useAppSelector(state => state.auth.user);
export const useIsAuthenticated = () => useAppSelector(state => state.auth.isAuthenticated);

// Listings selectors
export const useListingsState = () => useAppSelector(state => state.listings);
export const useListings = () => useAppSelector(state => state.listings.listings);
export const useCurrentListing = () => useAppSelector(state => state.listings.currentListing);
export const useSearchResults = () => useAppSelector(state => state.listings.searchResults);

// Filters selectors
export const useFiltersState = () => useAppSelector(state => state.filters);
export const useSearchFilters = () => useAppSelector(state => state.filters.search);
export const useRecommendationFilters = () => useAppSelector(state => state.filters.recommendations);
export const useMapFilters = () => useAppSelector(state => state.filters.map);

// Chat selectors
export const useChatState = () => useAppSelector(state => state.chat);
export const useChatThreads = () => useAppSelector(state => state.chat.threads);
export const useCurrentThread = () => useAppSelector(state => state.chat.currentThread);
export const useUnreadCount = () => useAppSelector(state => state.chat.unreadCount);

// UI selectors
export const useUIState = () => useAppSelector(state => state.ui);
export const useTheme = () => useAppSelector(state => state.ui.theme);
export const useNotifications = () => useAppSelector(state => state.ui.notifications);
export const useModals = () => useAppSelector(state => state.ui.modals);
export const useLoadingStates = () => useAppSelector(state => state.ui.loading);