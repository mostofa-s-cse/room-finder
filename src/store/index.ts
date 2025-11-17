import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authSlice } from './slices/authSlice';
import { listingsSlice } from './slices/listingsSlice';
import { filtersSlice } from './slices/filtersSlice';
import { chatSlice } from './slices/chatSlice';
import { uiSlice } from './slices/uiSlice';
import { api } from './api';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    listings: listingsSlice.reducer,
    filters: filtersSlice.reducer,
    chat: chatSlice.reducer,
    ui: uiSlice.reducer,
    api: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;