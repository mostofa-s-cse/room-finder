import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  notifications: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }[];
  modals: {
    loginModal: boolean;
    signupModal: boolean;
    listingModal: boolean;
    filterModal: boolean;
    chatModal: boolean;
    imageModal: {
      open: boolean;
      images: string[];
      currentIndex: number;
    };
  };
  loading: {
    global: boolean;
    listings: boolean;
    user: boolean;
    chat: boolean;
  };
}

const initialState: UIState = {
  theme: 'system',
  sidebarOpen: false,
  mobileMenuOpen: false,
  notifications: [],
  modals: {
    loginModal: false,
    signupModal: false,
    listingModal: false,
    filterModal: false,
    chatModal: false,
    imageModal: {
      open: false,
      images: [],
      currentIndex: 0,
    },
  },
  loading: {
    global: false,
    listings: false,
    user: false,
    chat: false,
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
    },
    
    // Sidebar and menus
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Modals
    setModalOpen: (state, action: PayloadAction<{ modal: keyof Omit<UIState['modals'], 'imageModal'>; open: boolean }>) => {
      const { modal, open } = action.payload;
      state.modals[modal] = open;
    },
    openModal: (state, action: PayloadAction<keyof Omit<UIState['modals'], 'imageModal'>>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof Omit<UIState['modals'], 'imageModal'>>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      state.modals.loginModal = false;
      state.modals.signupModal = false;
      state.modals.listingModal = false;
      state.modals.filterModal = false;
      state.modals.chatModal = false;
      state.modals.imageModal.open = false;
    },
    
    // Image modal
    openImageModal: (state, action: PayloadAction<{ images: string[]; currentIndex?: number }>) => {
      state.modals.imageModal = {
        open: true,
        images: action.payload.images,
        currentIndex: action.payload.currentIndex || 0,
      };
    },
    closeImageModal: (state) => {
      state.modals.imageModal = {
        open: false,
        images: [],
        currentIndex: 0,
      };
    },
    setImageModalIndex: (state, action: PayloadAction<number>) => {
      state.modals.imageModal.currentIndex = action.payload;
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    
    // Reset UI state
    resetUI: () => initialState,
  },
});

export const {
  setTheme,
  setSidebarOpen,
  toggleSidebar,
  setMobileMenuOpen,
  toggleMobileMenu,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setModalOpen,
  openModal,
  closeModal,
  closeAllModals,
  openImageModal,
  closeImageModal,
  setImageModalIndex,
  setLoading,
  setGlobalLoading,
  resetUI,
} = uiSlice.actions;