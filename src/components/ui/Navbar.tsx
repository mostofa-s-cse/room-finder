'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User, 
  Menu,
  MessageSquare
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { type Session } from 'next-auth';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NavLinks = ({ session }: { session: Session | null }) => (
  <>
    <Link href="/" className="text-foreground hover:text-primary transition-colors">
      Home
    </Link>
    <Link href="/for-rent" className="text-foreground hover:text-primary transition-colors">
      For Rent
    </Link>
    <Link href="/search" className="text-foreground hover:text-primary transition-colors">
      Search
    </Link>
    {session?.user?.role === 'BACHELOR' && (
      <Link href="/recommendations" className="text-foreground hover:text-primary transition-colors">
        Recommendations
      </Link>
    )}
    {session?.user?.role === 'LANDLORD' && (
      <Link href="/dashboard/landlord" className="text-foreground hover:text-primary transition-colors">
        Dashboard
      </Link>
    )}
    {session?.user?.role === 'BACHELOR' && (
      <Link href="/dashboard/bachelor" className="text-foreground hover:text-primary transition-colors">
        Dashboard
      </Link>
    )}
    {session?.user?.role === 'ADMIN' && (
      <Link href="/admin" className="text-foreground hover:text-primary transition-colors">
        Admin Panel
      </Link>
    )}
  </>
);

const AuthButtons = ({ session }: { session: Session | null }) => {
  if (session) {
    return (
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
            3
          </Badge>
        </Button>

        {/* Messages */}
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
            2
          </Badge>
        </Button>

        {/* Add Listing (Landlords only) */}
        {session.user.role === 'LANDLORD' && (
          <Link href="/dashboard/landlord/listings/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
          </Link>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                <AvatarFallback>
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session.user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
                <Badge variant="outline" className="w-fit text-xs">
                  {session.user.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${session.user.role.toLowerCase()}`}>
                  <Home className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/signin">
        <Button variant="ghost">Sign In</Button>
      </Link>
      <Link href="/auth/signup">
        <Button>Sign Up</Button>
      </Link>
    </div>
  );
};

export function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-8">
          <Home className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">RoomFinder</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 flex-1">
          <NavLinks session={session} />
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search rooms..."
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const query = (e.target as HTMLInputElement).value;
                  if (query) {
                    window.location.href = `/search?q=${encodeURIComponent(query)}`;
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex">
          <AuthButtons session={session} />
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden ml-auto">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const query = (e.target as HTMLInputElement).value;
                        if (query) {
                          window.location.href = `/search?q=${encodeURIComponent(query)}`;
                          setIsMenuOpen(false);
                        }
                      }
                    }}
                  />
                </div>

                {/* Mobile Navigation */}
                <div className="flex flex-col space-y-3 pt-4 border-t">
                  <NavLinks session={session} />
                </div>

                {/* Mobile Auth */}
                <div className="pt-4 border-t">
                  <AuthButtons session={session} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}