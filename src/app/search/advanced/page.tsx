'use client';

import React from 'react';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFiltersPanel } from '@/components/search/SearchFiltersPanel';
import { SearchResults } from '@/components/search/SearchResults';

export default function AdvancedSearchPage() {
  const {
    filters,
    searchResult,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    goToPage
  } = useAdvancedSearch();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Room Search</h1>
              <p className="text-gray-600 mt-1">Find exactly what you&apos;re looking for with powerful filters</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-6">
            <SearchBar
              onFiltersChange={updateFilters}
              placeholder="Search by location, area, or landmark..."
              className="max-w-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <SearchFiltersPanel
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={resetFilters}
              />
              
              {/* Search Statistics */}
              {searchResult && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Search Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Results:</span>
                      <span className="font-medium">{searchResult.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Search Time:</span>
                      <span className="font-medium">{searchResult.searchTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Page:</span>
                      <span className="font-medium">{searchResult.page} of {searchResult.totalPages}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Search Tips */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Advanced Search Tips</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use location-based search for distance filtering</li>
                  <li>• Combine multiple amenities for precise results</li>
                  <li>• Sort by relevance for best matches</li>
                  <li>• Enable verified-only for trusted listings</li>
                  <li>• Try different price ranges to expand options</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <SearchResults
              results={searchResult?.listings || []}
              isLoading={isLoading}
              error={error}
              total={searchResult?.total || 0}
              page={searchResult?.page || 1}
              limit={searchResult?.limit || 20}
              onPageChange={goToPage}
            />

            {/* Search Suggestions */}
            {searchResult?.suggestions && searchResult.suggestions.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Suggestions</h3>
                <div className="flex flex-wrap gap-2">
                  {searchResult.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (suggestion.type === 'LOCATION') {
                          updateFilters({ 
                            location: suggestion.value,
                            city: suggestion.value 
                          });
                        } else if (suggestion.type === 'AMENITY') {
                          updateFilters({ 
                            amenities: [suggestion.value] 
                          });
                        }
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Facets */}
            {searchResult?.facets && (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Refine Your Search</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Price Ranges */}
                  {searchResult.facets.priceRanges.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Price Distribution</h4>
                      <div className="space-y-2">
                        {searchResult.facets.priceRanges.slice(0, 5).map((range) => (
                          <button
                            key={range.range}
                            onClick={() => updateFilters({ 
                              minPrice: range.min, 
                              maxPrice: range.max || undefined 
                            })}
                            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                          >
                            <span>{range.range}</span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {range.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Areas */}
                  {searchResult.facets.locations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Areas</h4>
                      <div className="space-y-2">
                        {searchResult.facets.locations.slice(0, 5).map((location) => (
                          <button
                            key={location.city}
                            onClick={() => updateFilters({ city: location.city })}
                            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                          >
                            <span>{location.city}</span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {location.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Room Types */}
                  {searchResult.facets.roomTypes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Available Types</h4>
                      <div className="space-y-2">
                        {searchResult.facets.roomTypes.map((roomType) => (
                          <button
                            key={roomType.type}
                            onClick={() => updateFilters({ roomType: roomType.type as 'SINGLE' | 'SHARED' })}
                            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                          >
                            <span className="capitalize">{roomType.type.toLowerCase()}</span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {roomType.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}