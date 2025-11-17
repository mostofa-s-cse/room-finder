'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ChatThread {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  listingTitle: string;
}

export default function ChatListPage() {
  const { data: session, status } = useSession();
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    fetchChatThreads();
  }, [session, status]);

  const fetchChatThreads = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now
      const mockThreads: ChatThread[] = [
        {
          id: 'cmi3gx3x6002higul3lggsetf',
          participantName: 'Ahmed Khan',
          participantAvatar: '',
          lastMessage: 'Hello! I saw your interest in the apartment. When would you like to visit?',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 2,
          listingTitle: 'Cozy Studio in Dhanmondi'
        },
        {
          id: 'cmi3gx3x6002higul3lggsetg',
          participantName: 'Sarah Rahman',
          participantAvatar: '',
          lastMessage: 'The room is still available. Would you like to schedule a viewing?',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          unreadCount: 0,
          listingTitle: 'Modern Apartment in Gulshan'
        }
      ];
      
      setChatThreads(mockThreads);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href={`/dashboard/${session?.user.role?.toLowerCase()}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Messages
            </h1>
            <p className="text-muted-foreground">
              Your conversations with landlords and tenants
            </p>
          </div>
        </div>
      </div>

      {/* Chat Threads */}
      <div className="space-y-4">
        {chatThreads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                Start a conversation by contacting a landlord from a room listing.
              </p>
            </CardContent>
          </Card>
        ) : (
          chatThreads.map((thread) => (
            <Link key={thread.id} href={`/chat/${thread.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={thread.participantAvatar} />
                      <AvatarFallback>{thread.participantName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{thread.participantName}</h3>
                        <span className="text-sm text-muted-foreground">
                          {new Date(thread.lastMessageTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{thread.listingTitle}</p>
                      <p className="text-sm mt-1 line-clamp-2">{thread.lastMessage}</p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}