'use client';

import React, { useState } from 'react';
import { SearchFilters, SearchSortOption } from '@/lib/search/types';
import { RoomType } from '@prisma/client';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onReset: () => void;
  className?: string;
}

const COMMON_AMENITIES = [
  'WiFi', 'AC', 'Parking', 'Generator', 'Lift', 'Security',
  'Gym', 'Laundry', 'Kitchen', 'Balcony', 'Furnished'
];

const PRICE_RANGES = [
  { label: 'Under ৳5,000', min: 0, max: 5000 },
  { label: '৳5,000 - ৳10,000', min: 5000, max: 10000 },
  { label: '৳10,000 - ৳15,000', min: 10000, max: 15000 },
  { label: '৳15,000 - ৳25,000', min: 15000, max: 25000 },
  { label: '৳25,000 - ৳50,000', min: 25000, max: 50000 },
  { label: 'Above ৳50,000', min: 50000, max: Infinity }
];

export function SearchFiltersPanel({ 
  filters, 
  onFiltersChange, 
  onReset,
  className = ""
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePriceRangeChange = (min: number, max: number) => {
    onFiltersChange({
      minPrice: min,
      maxPrice: max === Infinity ? undefined : max,
      priceRange: [min, max === Infinity ? 100000 : max]
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    onFiltersChange({ amenities: newAmenities });
  };

  const handleSortChange = (sortBy: SearchSortOption) => {
    onFiltersChange({ sortBy, page: 1 });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.roomType) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    if (filters.minRating) count++;
    if (filters.verifiedOnly) count++;
    if (filters.newListingsOnly) count++;
    return count;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Sort Options */}
      <div className="p-4 border-b border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(SearchSortOption).map((option) => (
            <button
              key={option}
              onClick={() => handleSortChange(option)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                filters.sortBy === option
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => handlePriceRangeChange(range.min, range.max)}
                  className={`p-2 text-sm rounded-lg border text-left transition-colors ${
                    (filters.minPrice === range.min && 
                     (filters.maxPrice === range.max || (range.max === Infinity && !filters.maxPrice)))
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            
            {/* Custom Price Range */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  placeholder="Min price"
                  value={filters.minPrice || ''}
                  onChange={(e) => onFiltersChange({ 
                    minPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFiltersChange({ 
                    maxPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Room Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFiltersChange({ roomType: undefined })}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  !filters.roomType
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Any
              </button>
              {Object.values(RoomType).map((type) => (
                <button
                  key={type}
                  onClick={() => onFiltersChange({ roomType: type })}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.roomType === type
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.amenities?.includes(amenity) || false}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Minimum Rating</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onFiltersChange({ minRating: rating })}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.minRating === rating
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{rating}</span>
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verifiedOnly || false}
                onChange={(e) => onFiltersChange({ verifiedOnly: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Verified landlords only</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.newListingsOnly || false}
                onChange={(e) => onFiltersChange({ newListingsOnly: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">New listings only (last 30 days)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}