'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home, 
  User, 
  Settings, 
  Bell, 
  MessageCircle, 
  Calendar, 
  Building,
  BarChart3,
  Plus,
  Search,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const BachelorSidebarItems = [
  { icon: Home, label: 'Overview', href: '/dashboard/bachelor' },
  { icon: Search, label: 'Recommendations', href: '/dashboard/bachelor?tab=recommendations' },
  { icon: MessageCircle, label: 'Messages', href: '/dashboard/bachelor?tab=chats' },
  { icon: Calendar, label: 'Bookings', href: '/dashboard/bachelor?tab=bookings' },
  { icon: User, label: 'Profile', href: '/profile/edit' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

const LandlordSidebarItems = [
  { icon: Home, label: 'Overview', href: '/dashboard/landlord' },
  { icon: Building, label: 'My Listings', href: '/dashboard/landlord?tab=listings' },
  { icon: Calendar, label: 'Bookings', href: '/dashboard/landlord?tab=bookings' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/landlord?tab=analytics' },
  { icon: Plus, label: 'Add Listing', href: '/dashboard/landlord/listings/new' },
  { icon: User, label: 'Profile', href: '/profile/edit' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const sidebarItems = session?.user?.role === 'BACHELOR' 
    ? BachelorSidebarItems 
    : LandlordSidebarItems;

  const isActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      return pathname === path && window.location.search.includes(query);
    }
    return pathname === href;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-card border-r flex-col">
        {/* User Profile Section */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback>
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {session?.user?.role}
                </Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Bell className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  size="sm"
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {(title || description) && (
          <div className="bg-card border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold">{title}</h1>}
                {description && (
                  <p className="text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              
              {/* Mobile menu button - could be implemented */}
              <div className="md:hidden">
                <Button variant="ghost" size="icon">
                  {/* Menu icon for mobile */}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}