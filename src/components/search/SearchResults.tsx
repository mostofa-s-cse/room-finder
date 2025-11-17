'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchedListing } from '@/lib/search/types';

interface SearchResultsProps {
  results: SearchedListing[];
  isLoading?: boolean;
  error?: string | null;
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
}

export function SearchResults({
  results,
  isLoading = false,
  error = null,
  total = 0,
  page = 1,
  limit = 20,
  onPageChange
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex space-x-4">
                <div className="w-48 h-32 bg-gray-300 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg font-medium">{error}</div>
        <p className="text-gray-500 mt-2">Please try again or refine your search.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5a2 2 0 00-2 2v8a2 2 0 002 2h14m-5-10v18m0 0l-3-3m3 3l3-3" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No listings found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your search criteria or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {total.toLocaleString()} listings found
          </h2>
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.map((listing) => (
          <SearchResultCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          <div className="flex space-x-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, page - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface SearchResultCardProps {
  listing: SearchedListing;
}

function SearchResultCard({ listing }: SearchResultCardProps) {
  const mainImage = listing.images?.[0] || '/images/placeholder-room.jpg';

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4">
        <div className="flex space-x-4">
          {/* Image */}
          <div className="relative w-48 h-32 flex-shrink-0">
            <Image
              src={mainImage}
              alt={listing.title}
              fill
              className="object-cover rounded-lg"
            />
            {listing.isNewListing && (
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                New
              </div>
            )}
            {listing.isVerified && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
                ✓ Verified
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {listing.title}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
                {listing.distance && (
                  <span className="ml-2 text-gray-400">
                    • {listing.distance.toFixed(1)} km away
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="capitalize">{listing.roomType.toLowerCase()}</span>
              {listing.averageRating > 0 && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{listing.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400">({listing.reviewCount})</span>
                </div>
              )}
            </div>

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {listing.amenities.slice(0, 4).map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {amenity}
                  </span>
                ))}
                {listing.amenities.length > 4 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                    +{listing.amenities.length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2">
              {listing.description}
            </p>
          </div>

          {/* Price & Action */}
          <div className="flex flex-col items-end justify-between">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ৳{listing.monthlyRent.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">per month</div>
              {listing.priceScore !== undefined && listing.priceScore > 80 && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  Great Value
                </div>
              )}
            </div>

            <div className="text-right text-sm text-gray-500">
              <div>By {listing.landlord.name}</div>
              {listing.landlord.isVerified && (
                <div className="text-blue-600 font-medium">Verified Host</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}