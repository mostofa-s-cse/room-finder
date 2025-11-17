'use client';

import { useState } from 'react';
import { ChatPage } from '@/components/chat/ChatPage';

export default function Chat() {
  // For testing, we'll use a mock user ID and token
  // In a real app, these would come from authentication
  const [userId] = useState('mock-user-id');
  const [token] = useState('mock-jwt-token');

  return (
    <div className="h-screen">
      <ChatPage userId={userId} token={token} />
    </div>
  );
}