'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MessageCircle, ArrowLeft, Users, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'BACHELOR' | 'LANDLORD';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  listingId?: string;
  listingTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatListPage() {
  const { data: session, status } = useSession();
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    fetchChatThreads();
  }, [session, status]);

  // Listen for chat read updates to refresh the thread list
  useEffect(() => {
    const handleChatReadUpdate = () => {
      fetchChatThreads();
    };

    const handleFocus = () => {
      // Refresh when user comes back to this page
      fetchChatThreads();
    };

    window.addEventListener('chatReadUpdate', handleChatReadUpdate);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('chatReadUpdate', handleChatReadUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Filter chats based on search and unread filter
  useEffect(() => {
    let filtered = chatThreads;
    
    if (searchTerm) {
      filtered = filtered.filter(thread => 
        thread.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (thread.listingTitle && thread.listingTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        thread.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterUnread) {
      filtered = filtered.filter(thread => thread.unreadCount > 0);
    }
    
    setFilteredThreads(filtered);
  }, [chatThreads, searchTerm, filterUnread]);

  const fetchChatThreads = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chat/threads', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const threads = Array.isArray(data.data) ? data.data : [];
        setChatThreads(threads);
        setFilteredThreads(threads);
      } else {
        console.error('Failed to fetch chat threads:', response.status);
        setChatThreads([]);
        setFilteredThreads([]);
      }
    } catch (error) {
      console.error('Error fetching chat threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner size="lg" text="Loading messages..." />
      </div>
    );
  }

  const totalUnread = chatThreads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href={`/dashboard/${session?.user.role?.toLowerCase()}`}>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-3xl font-bold flex items-center gap-3">
                    <MessageCircle className="h-10 w-10" />
                    Messages
                    {totalUnread > 0 && (
                      <Badge variant="destructive" className="bg-red-500 text-white animate-pulse">
                        {totalUnread} new
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-blue-100 mt-2 text-lg">
                    {session?.user.role === 'LANDLORD' 
                      ? 'Connect with your tenants' 
                      : 'Chat with landlords'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 flex items-center gap-2 px-3 py-1">
                  <Users className="h-4 w-4" />
                  {chatThreads.length} chats
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search conversations, messages, or listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
                />
              </div>
              <Button
                variant={filterUnread ? "default" : "outline"}
                size="lg"
                onClick={() => setFilterUnread(!filterUnread)}
                className={`flex items-center gap-2 rounded-xl px-6 transition-all ${filterUnread ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-50'}`}
              >
                <Filter className="h-4 w-4" />
                {filterUnread ? 'All Chats' : 'Unread Only'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Threads */}
        <div className="space-y-4">
          {filteredThreads.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold mb-3">
                  {searchTerm || filterUnread ? 'No matching conversations' : 'No messages yet'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchTerm || filterUnread 
                    ? 'Try adjusting your search or filters to find conversations.'
                    : session?.user.role === 'LANDLORD'
                      ? 'Conversations with tenants will appear here when they contact you about your listings.'
                      : 'Start a conversation by contacting a landlord from a room listing.'
                  }
                </p>
                {!searchTerm && !filterUnread && (
                  <Link href={`/dashboard/${session?.user.role?.toLowerCase()}`}>
                    <Button className="mt-4">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredThreads.map((thread) => (
              <Link key={thread.id} href={`/chat/${thread.id}`}>
                <Card className={`cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg mb-3 ${thread.unreadCount > 0 ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500' : 'bg-white hover:bg-gray-50'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 ring-2 ring-white shadow-lg">
                          <AvatarImage src={thread.participantAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl">
                            {thread.participantName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {thread.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs font-bold">{thread.unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-xl truncate ${thread.unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                              {thread.participantName}
                            </h3>
                            {thread.listingTitle && (
                              <p className="text-sm text-blue-600 font-medium mb-1 truncate flex items-center">
                                🏠 {thread.listingTitle}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="text-xs text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-full">
                              {new Date(thread.lastMessageTime).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm line-clamp-2 leading-relaxed ${thread.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                          {thread.lastMessage}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}