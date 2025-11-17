import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatThread, ChatMessage, User } from '@prisma/client';

export interface ChatState {
  threads: (ChatThread & {
    user: Pick<User, 'id' | 'name'>;
    landlord: Pick<User, 'id' | 'name'>;
    messages: (ChatMessage & {
      sender: Pick<User, 'id' | 'name'>;
    })[];
    lastMessage?: ChatMessage & {
      sender: Pick<User, 'id' | 'name'>;
    };
  })[];
  currentThread: string | null;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  typingUsers: Record<string, string[]>; // threadId -> userIds
}

const initialState: ChatState = {
  threads: [],
  currentThread: null,
  loading: false,
  error: null,
  unreadCount: 0,
  typingUsers: {},
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setThreads: (state, action: PayloadAction<ChatState['threads']>) => {
      state.threads = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentThread: (state, action: PayloadAction<string | null>) => {
      state.currentThread = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    addThread: (state, action: PayloadAction<ChatState['threads'][0]>) => {
      const existingIndex = state.threads.findIndex(thread => thread.id === action.payload.id);
      if (existingIndex === -1) {
        state.threads.unshift(action.payload);
      } else {
        state.threads[existingIndex] = action.payload;
      }
    },
    updateThread: (state, action: PayloadAction<ChatState['threads'][0]>) => {
      const index = state.threads.findIndex(thread => thread.id === action.payload.id);
      if (index !== -1) {
        state.threads[index] = action.payload;
      }
    },
    addMessage: (state, action: PayloadAction<{
      threadId: string;
      message: ChatMessage & {
        sender: Pick<User, 'id' | 'name'>;
      };
    }>) => {
      const { threadId, message } = action.payload;
      const threadIndex = state.threads.findIndex(thread => thread.id === threadId);
      
      if (threadIndex !== -1) {
        state.threads[threadIndex].messages.push(message);
        state.threads[threadIndex].lastMessage = message;
        
        // Move thread to top
        const thread = state.threads[threadIndex];
        state.threads.splice(threadIndex, 1);
        state.threads.unshift(thread);
      }
    },
    updateMessage: (state, action: PayloadAction<{
      threadId: string;
      messageId: string;
      updates: Partial<ChatMessage>;
    }>) => {
      const { threadId, messageId, updates } = action.payload;
      const threadIndex = state.threads.findIndex(thread => thread.id === threadId);
      
      if (threadIndex !== -1) {
        const messageIndex = state.threads[threadIndex].messages.findIndex(
          message => message.id === messageId
        );
        
        if (messageIndex !== -1) {
          state.threads[threadIndex].messages[messageIndex] = {
            ...state.threads[threadIndex].messages[messageIndex],
            ...updates,
          };
        }
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },
    setTypingUsers: (state, action: PayloadAction<{ threadId: string; userIds: string[] }>) => {
      const { threadId, userIds } = action.payload;
      if (userIds.length === 0) {
        delete state.typingUsers[threadId];
      } else {
        state.typingUsers[threadId] = userIds;
      }
    },
    addTypingUser: (state, action: PayloadAction<{ threadId: string; userId: string }>) => {
      const { threadId, userId } = action.payload;
      if (!state.typingUsers[threadId]) {
        state.typingUsers[threadId] = [];
      }
      if (!state.typingUsers[threadId].includes(userId)) {
        state.typingUsers[threadId].push(userId);
      }
    },
    removeTypingUser: (state, action: PayloadAction<{ threadId: string; userId: string }>) => {
      const { threadId, userId } = action.payload;
      if (state.typingUsers[threadId]) {
        state.typingUsers[threadId] = state.typingUsers[threadId].filter(id => id !== userId);
        if (state.typingUsers[threadId].length === 0) {
          delete state.typingUsers[threadId];
        }
      }
    },
    markThreadAsRead: (state, action: PayloadAction<string>) => {
      const threadId = action.payload;
      const threadIndex = state.threads.findIndex(thread => thread.id === threadId);
      
      if (threadIndex !== -1) {
        // Mark all messages in thread as read
        // This would be implemented with a read status field
        console.log(`Marking thread ${threadId} as read`);
      }
    },
    clearChat: (state) => {
      state.threads = [];
      state.currentThread = null;
      state.unreadCount = 0;
      state.typingUsers = {};
      state.error = null;
    },
  },
});

export const {
  setThreads,
  setCurrentThread,
  setLoading,
  setError,
  addThread,
  updateThread,
  addMessage,
  updateMessage,
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  markThreadAsRead,
  clearChat,
} = chatSlice.actions;