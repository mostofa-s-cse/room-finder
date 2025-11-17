import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: async (headers) => {
    // Get session for authentication
    const session = await getSession();
    if (session?.user) {
      headers.set('authorization', `Bearer ${session.user.id}`);
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Listing',
    'Review',
    'Booking',
    'ChatThread',
    'ChatMessage',
    'Recommendation',
  ],
  endpoints: () => ({}),
});