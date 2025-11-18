'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Search,
  Building2,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Menu,
  MapPin,
  Star,
  DollarSign,
  Shield,
  Plus,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/helpers';

const navigationItems = [
  {
    title: 'Home',
    href: '/',
    icon: Home,
    description: 'Browse available rooms and apartments',
  },
  {
    title: 'For Rent',
    href: '/search',
    icon: Building2,
    description: 'All available rental properties',
  },
  {
    title: 'Search',
    href: '/search',
    icon: Search,
    description: 'Advanced search with filters',
  },
  {
    title: 'Map View',
    href: '/map',
    icon: MapPin,
    description: 'Find rooms on interactive map',
  },
];

const priceRanges = [
  { label: 'Under ৳10,000', href: '/search?maxPrice=10000' },
  { label: '৳10,000 - ৳20,000', href: '/search?minPrice=10000&maxPrice=20000' },
  { label: '৳20,000 - ৳30,000', href: '/search?minPrice=20000&maxPrice=30000' },
  { label: 'Above ৳30,000', href: '/search?minPrice=30000' },
];

const areas = [
  { label: 'Dhanmondi', href: '/search?city=Dhanmondi' },
  { label: 'Gulshan', href: '/search?city=Gulshan' },
  { label: 'Banani', href: '/search?city=Banani' },
  { label: 'Uttara', href: '/search?city=Uttara' },
  { label: 'Mirpur', href: '/search?city=Mirpur' },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getUserDashboardLink = () => {
    if (!session?.user) return '/dashboard';
    switch (session.user.role) {
      case 'BACHELOR':
        return '/dashboard';
      case 'LANDLORD':
        return '/dashboard/landlord';
      case 'ADMIN':
        return '/admin';
      default:
        return '/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold">Room Finder</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50',
                      isActive(item.href) && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </NavigationMenuItem>
              ))}
              
              {/* Price Range Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Price Range
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-3 p-4">
                    <div className="row-span-3">
                      <h3 className="text-sm font-medium">Find by Budget</h3>
                      <p className="text-xs text-muted-foreground">
                        Browse rooms within your budget
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {priceRanges.map((range) => (
                        <Link
                          key={range.href}
                          href={range.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium">{range.label}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Areas Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Areas
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[300px] gap-3 p-4">
                    <div className="row-span-3">
                      <h3 className="text-sm font-medium">Popular Areas</h3>
                      <p className="text-xs text-muted-foreground">
                        Find rooms in prime locations
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {areas.map((area) => (
                        <Link
                          key={area.href}
                          href={area.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium">{area.label}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side - Auth & User Menu */}
        <div className="flex items-center space-x-4">
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session?.user ? (
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  3
                </Badge>
              </Button>

              {/* Messages */}
              <Link href="/dashboard/chat">
                <Button variant="ghost" size="sm" className="relative">
                  <MessageCircle className="h-4 w-4" />
                  <Badge
                    variant="secondary"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    2
                  </Badge>
                </Button>
              </Link>

              {/* Add Listing Button for Landlords */}
              {session.user.role === 'LANDLORD' && (
                <Link href="/dashboard/landlord/listings/new">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Listing
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={session.user.name || ''} />
                      <AvatarFallback>
                        {getInitials(session.user.name || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                      <Badge variant="outline" className="w-fit text-xs">
                        {session.user.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getUserDashboardLink()}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === 'BACHELOR' && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/recommendations">
                        <Star className="mr-2 h-4 w-4" />
                        Recommendations
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {session.user.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                        isActive(item.href) && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}