'use client';

import Link from 'next/link';
import { Building2, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const footerSections = [
  {
    title: 'For Renters',
    links: [
      { label: 'Find Rooms', href: '/for-rent' },
      { label: 'Search by Area', href: '/search' },
      { label: 'Price Calculator', href: '/tools/calculator' },
      { label: 'Moving Guide', href: '/guide/moving' },
      { label: 'Tenant Rights', href: '/guide/rights' },
    ],
  },
  {
    title: 'For Landlords',
    links: [
      { label: 'List Your Property', href: '/dashboard/landlord/listings/new' },
      { label: 'Landlord Dashboard', href: '/dashboard/landlord' },
      { label: 'Pricing Guide', href: '/guide/pricing' },
      { label: 'Property Management', href: '/guide/management' },
      { label: 'Legal Requirements', href: '/guide/legal' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Safety Tips', href: '/safety' },
      { label: 'Report Issue', href: '/report' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

const quickStats = [
  { label: 'Active Listings', value: '10,000+' },
  { label: 'Happy Tenants', value: '25,000+' },
  { label: 'Verified Landlords', value: '5,000+' },
  { label: 'Cities Covered', value: '50+' },
];

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      {/* Newsletter Section */}
      <div className="border-b">
        <div className="container py-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Get the latest room listings and updates directly in your inbox
              </p>
            </div>
            <div className="flex w-full max-w-sm space-x-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button type="submit">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-b">
        <div className="container py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {quickStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-12">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold">Room Finder</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Bangladesh&apos;s most trusted platform for finding and listing rental properties. 
              Connecting tenants with verified landlords across the country.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>+880-1700-000000</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>contact@roomfinder.bd</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-2 mt-4">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link href={social.href} aria-label={social.label}>
                    <social.icon className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Bottom Footer */}
      <div className="container py-6">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Room Finder. All rights reserved.
          </div>
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
            <Link href="/accessibility" className="hover:text-foreground transition-colors">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}