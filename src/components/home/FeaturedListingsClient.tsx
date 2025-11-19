'use client';

import { useState, useEffect } from 'react';
import { ListingCard } from '@/components/ui/ListingCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  description: string;
  rent: number;
  price?: number; // API field
  monthlyRent?: number; // API field
  location: string;
  address?: string; // API field
  city?: string; // API field
  images: string[];
  amenities: string[];
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  isAvailable: boolean;
  availableFrom: string;
  avgRating?: number;
  ratingAvg?: number; // API field
  landlord: {
    id: string;
    name: string;
    profilePicture?: string;
    phone?: string; // API field
  };
  createdAt: string;
}

export function FeaturedListingsClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=6&sortBy=newest');
        if (res.ok) {
          const data = await res.json();
          // Ensure we always set an array, even if the API response structure is unexpected
          const listingsData = Array.isArray(data.data) ? data.data : 
                               Array.isArray(data) ? data : 
                               Array.isArray(data.listings) ? data.listings : [];
          
          // Process listings to handle rent display and map API fields
          const processedListings = listingsData.map((listing: Listing & { price?: number; monthlyRent?: number; address?: string; city?: string; ratingAvg?: number }) => ({
            ...listing,
            images: listing.images && listing.images.length > 0 ? listing.images : ['/images/default-room.svg'], // Ensure images is always an array
            rent: listing.price || listing.rent || listing.monthlyRent || 0, // Map price field to rent
            location: listing.address || listing.location || listing.city || 'Location not specified',
            avgRating: listing.ratingAvg || listing.avgRating || 0 // Map rating fields
          }));
          

          
          setListings(processedListings);
        } else {
          console.error('Failed to fetch listings:', res.status, res.statusText);
          setListings([]);
        }
      } catch (error) {
        console.error('Error fetching featured listings:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Rooms</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Loading featured rooms from our most trusted landlords...
            </p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Rooms</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              No featured listings available at the moment. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Rooms</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Handpicked rooms from our most trusted landlords in prime locations across Bangladesh
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.isArray(listings) && listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/search">View All Rooms</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}