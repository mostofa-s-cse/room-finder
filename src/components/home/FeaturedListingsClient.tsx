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
  location: string;
  images: string[];
  amenities: string[];
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  isAvailable: boolean;
  availableFrom: string;
  avgRating?: number;
  landlord: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
}

export function FeaturedListingsClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=6&featured=true');
        if (res.ok) {
          const data = await res.json();
          // Ensure we always set an array, even if the API response structure is unexpected
          const listingsData = Array.isArray(data.data) ? data.data : 
                               Array.isArray(data) ? data : 
                               Array.isArray(data.listings) ? data.listings : [];
          setListings(listingsData);
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
            <Link href="/for-rent">View All Rooms</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}