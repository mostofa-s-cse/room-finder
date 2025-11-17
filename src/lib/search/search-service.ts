import { 
  SearchFilters, 
  SearchResult, 
  SearchedListing, 
  SearchFacets,
  SearchSuggestion,
  SearchSortOption,
  SavedSearch,
  SearchAnalytics,
  AdvancedSearchOptions
} from './types';
import { prisma } from '../prisma';
import { calculateDistance } from '../maps/distance-utils';

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Main search function with advanced filtering and sorting
   */
  async searchListings(
    filters: SearchFilters,
    options: Partial<AdvancedSearchOptions> = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    try {
      // Build search query
      const query = this.buildSearchQuery(filters);
      
      // Execute search
      const [listings, total, facets] = await Promise.all([
        this.executeListingSearch(query, filters),
        this.getSearchResultCount(query),
        this.generateFacets(filters)
      ]);

      // Apply sorting and scoring
      const scoredListings = await this.scoreAndSortListings(
        listings,
        filters,
        options
      );

      // Apply pagination
      const { page = 1, limit = 20 } = filters;
      const startIndex = (page - 1) * limit;
      const paginatedListings = scoredListings.slice(startIndex, startIndex + limit);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(filters);

      const searchTime = Date.now() - startTime;

      // Log search analytics
      await this.logSearchAnalytics({
        searchId,
        userId: filters.userPreferences?.userId,
        query: filters.location || '',
        filters,
        resultCount: total,
        clickedListings: [],
        searchTime,
        userAgent: '',
        ipAddress: '',
        sessionId: '',
        timestamp: new Date()
      });

      return {
        listings: paginatedListings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        facets,
        suggestions,
        searchId,
        searchTime
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Build Prisma query based on filters
   */
  private buildSearchQuery(filters: SearchFilters) {
    const where: Record<string, unknown> = {
      status: 'APPROVED',
      isPublished: true,
    };

    // Location-based filtering
    if (filters.location) {
      where.OR = [
        { location: { contains: filters.location, mode: 'insensitive' } },
        { city: { contains: filters.location, mode: 'insensitive' } },
        { address: { contains: filters.location, mode: 'insensitive' } },
        { title: { contains: filters.location, mode: 'insensitive' } }
      ];
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    // Price range filtering
    if (filters.minPrice || filters.maxPrice) {
      where.monthlyRent = {};
      if (filters.minPrice) (where.monthlyRent as Record<string, unknown>).gte = filters.minPrice;
      if (filters.maxPrice) (where.monthlyRent as Record<string, unknown>).lte = filters.maxPrice;
    }

    if (filters.priceRange) {
      where.monthlyRent = {
        gte: filters.priceRange[0],
        lte: filters.priceRange[1]
      };
    }

    // Room type filtering
    if (filters.roomType) {
      where.roomType = filters.roomType;
    }

    // Amenities filtering
    if (filters.amenities && filters.amenities.length > 0) {
      where.amenities = {
        array_contains: filters.amenities
      };
    }

    if (filters.requiredAmenities && filters.requiredAmenities.length > 0) {
      where.amenities = {
        array_contains_all: filters.requiredAmenities
      };
    }

    // Rating filtering
    if (filters.minRating) {
      where.averageRating = { gte: filters.minRating };
    }

    // Verified listings only
    if (filters.verifiedOnly) {
      where.landlord = {
        isVerified: true
      };
    }

    // New listings only (last 30 days)
    if (filters.newListingsOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    }

    // Availability filtering
    if (filters.availableFrom) {
      where.availableFrom = { lte: filters.availableFrom };
    }

    return {
      where,
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                listings: true,
                reviews: true
              }
            }
          }
        },
        reviews: {
          select: {
            rating: true,
            createdAt: true
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            reviews: true,
            bookings: true
          }
        }
      }
    };
  }

  /**
   * Execute the search query
   */
  private async executeListingSearch(query: Record<string, unknown>, filters: SearchFilters) {
    const orderBy = this.buildOrderBy(filters.sortBy, filters.sortOrder);
    
    const listings = await prisma.listing.findMany({
      ...query,
      orderBy
    });

    return this.transformToSearchedListings(listings, filters);
  }

  /**
   * Transform database results to SearchedListing format
   */
  private transformToSearchedListings(listings: Array<Record<string, unknown>>, filters: SearchFilters): SearchedListing[] {
    return listings.map(listing => {
      const distance = filters.latitude && filters.longitude
        ? calculateDistance(
            filters.latitude,
            filters.longitude,
            listing.lat as number,
            listing.lng as number
          )
        : undefined;

      const reviews = listing.reviews as Array<{ rating: number }> || [];
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, review) => sum + review.rating, 0) / reviews.length
        : 0;

      const isNewListing = new Date(listing.createdAt as string) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const landlord = listing.landlord as Record<string, unknown>;
      const _count = listing._count as Record<string, unknown>;
      
      return {
        id: listing.id as string,
        title: listing.title as string,
        description: listing.description as string,
        monthlyRent: (listing.monthlyRent || listing.price) as number,
        location: (listing.location || listing.address) as string,
        city: listing.city as string,
        area: (listing.area || '') as string,
        coordinates: {
          lat: listing.lat as number,
          lng: listing.lng as number
        },
        roomType: (listing.roomType as 'SINGLE' | 'SHARED') || 'SINGLE',
        amenities: Array.isArray(listing.amenities) ? listing.amenities as string[] : [],
        images: listing.images as string[],
        averageRating,
        reviewCount: _count.reviews as number,
        availableFrom: (listing.availableFrom || new Date()) as Date,
        isVerified: landlord.status === 'VERIFIED',
        isNewListing,
        distance,
        relevanceScore: this.calculateRelevanceScore(listing, filters),
        priceScore: this.calculatePriceScore((listing.monthlyRent || listing.price) as number, filters),
        landlord: {
          id: landlord.id as string,
          name: landlord.name as string,
          rating: 4.5, // TODO: Calculate from landlord reviews
          responseRate: 85, // TODO: Calculate from response data
          isVerified: landlord.status === 'VERIFIED',
          profilePicture: landlord.profilePicture as string
        }
      };
    });
  }

  /**
   * Score and sort listings based on relevance and user preferences
   */
  private async scoreAndSortListings(
    listings: SearchedListing[],
    filters: SearchFilters,
    options: Partial<AdvancedSearchOptions> = {}
  ): Promise<SearchedListing[]> {
    // Apply advanced scoring if enabled
    if (options.applyMLRanking) {
      listings.forEach(listing => {
        listing.relevanceScore = this.calculateAdvancedRelevanceScore(listing, filters);
      });
    }

    // Apply location-based filtering if coordinates provided
    if (filters.latitude && filters.longitude && filters.radius) {
      const filteredListings = listings.filter(listing => {
        const distance = calculateDistance(
          filters.latitude!,
          filters.longitude!,
          listing.coordinates.lat,
          listing.coordinates.lng
        );
        return distance <= filters.radius!;
      });
      return this.sortListings(filteredListings, filters.sortBy, filters.sortOrder);
    }

    return this.sortListings(listings, filters.sortBy, filters.sortOrder);
  }

  /**
   * Sort listings based on sort option
   */
  private sortListings(
    listings: SearchedListing[],
    sortBy: SearchSortOption = SearchSortOption.RELEVANCE,
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): SearchedListing[] {
    const multiplier = sortOrder === 'DESC' ? -1 : 1;

    return listings.sort((a, b) => {
      switch (sortBy) {
        case SearchSortOption.PRICE_LOW_TO_HIGH:
          return (a.monthlyRent - b.monthlyRent) * multiplier;
        case SearchSortOption.PRICE_HIGH_TO_LOW:
          return (b.monthlyRent - a.monthlyRent) * multiplier;
        case SearchSortOption.DISTANCE:
          if (a.distance === undefined || b.distance === undefined) return 0;
          return (a.distance - b.distance) * multiplier;
        case SearchSortOption.RATING:
          return (b.averageRating - a.averageRating) * multiplier;
        case SearchSortOption.NEWEST:
          return (a.isNewListing ? 1 : 0) - (b.isNewListing ? 1 : 0) * multiplier;
        case SearchSortOption.RELEVANCE:
        default:
          return (b.relevanceScore - a.relevanceScore) * multiplier;
      }
    });
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderBy(sortBy?: SearchSortOption, sortOrder: string = 'desc'): Record<string, string> {
    switch (sortBy) {
      case SearchSortOption.PRICE_LOW_TO_HIGH:
        return { monthlyRent: 'asc' };
      case SearchSortOption.PRICE_HIGH_TO_LOW:
        return { monthlyRent: 'desc' };
      case SearchSortOption.RATING:
        return { averageRating: sortOrder.toLowerCase() };
      case SearchSortOption.NEWEST:
        return { createdAt: 'desc' };
      case SearchSortOption.RECENTLY_UPDATED:
        return { updatedAt: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  /**
   * Calculate relevance score based on search criteria
   */
  private calculateRelevanceScore(listing: Record<string, unknown>, filters: SearchFilters): number {
    let score = 0;

    // Base score
    score += 50;

    // Location match bonus
    if (filters.location) {
      const location = filters.location.toLowerCase();
      const title = listing.title as string || '';
      const listingLocation = listing.location as string || '';
      const city = listing.city as string || '';
      const description = listing.description as string || '';
      
      if (title.toLowerCase().includes(location)) score += 30;
      if (listingLocation.toLowerCase().includes(location)) score += 25;
      if (city.toLowerCase().includes(location)) score += 20;
      if (description.toLowerCase().includes(location)) score += 15;
    }

    // Price match bonus
    if (filters.minPrice && filters.maxPrice) {
      const price = (listing.monthlyRent || listing.price) as number;
      const midPoint = (filters.minPrice + filters.maxPrice) / 2;
      const priceDistance = Math.abs(price - midPoint);
      const maxDistance = (filters.maxPrice - filters.minPrice) / 2;
      score += Math.max(0, 20 * (1 - priceDistance / maxDistance));
    }

    // Amenities match bonus
    if (filters.amenities && filters.amenities.length > 0) {
      const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities as string[] : [];
      const matchedAmenities = filters.amenities.filter(amenity => 
        listingAmenities.includes(amenity)
      );
      score += (matchedAmenities.length / filters.amenities.length) * 25;
    }

    // Rating bonus
    const avgRating = (listing.averageRating as number) || 0;
    score += avgRating * 5;

    // Review count bonus
    const countData = listing._count as Record<string, unknown> || {};
    const reviewCount = (countData.reviews as number) || 0;
    score += Math.min(reviewCount * 2, 20);

    // Verified landlord bonus
    const landlord = listing.landlord as Record<string, unknown> || {};
    if (landlord.status === 'VERIFIED') {
      score += 10;
    }

    // New listing bonus
    const isNew = new Date(listing.createdAt as string) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (isNew) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Calculate advanced relevance score using ML-like algorithms
   */
  private calculateAdvancedRelevanceScore(listing: SearchedListing, filters: SearchFilters): number {
    let score = this.calculateRelevanceScore(listing as unknown as Record<string, unknown>, filters);

    // Apply user preference weighting
    if (filters.userPreferences) {
      const prefs = filters.userPreferences;
      
      // Preferred areas bonus
      if (prefs.preferredAreas.includes(listing.area)) {
        score += 15;
      }

      // Budget fit bonus
      if (prefs.maxBudget && listing.monthlyRent <= prefs.maxBudget) {
        const budgetFit = 1 - (listing.monthlyRent / prefs.maxBudget);
        score += budgetFit * 20;
      }

      // Amenity preference bonus
      const preferredAmenities = prefs.preferredAmenities.filter(amenity =>
        listing.amenities.includes(amenity)
      );
      score += (preferredAmenities.length / Math.max(prefs.preferredAmenities.length, 1)) * 15;

      // Room type preference
      if (prefs.preferredRoomType !== 'ANY' && listing.roomType === prefs.preferredRoomType) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate price score (how well price matches user's budget)
   */
  private calculatePriceScore(price: number, filters: SearchFilters): number {
    if (!filters.minPrice && !filters.maxPrice) return 50;

    const minPrice = filters.minPrice || 0;
    const maxPrice = filters.maxPrice || price * 2;
    
    if (price < minPrice || price > maxPrice) return 0;

    const range = maxPrice - minPrice;
    const midPoint = (minPrice + maxPrice) / 2;
    const distance = Math.abs(price - midPoint);
    
    return Math.max(0, 100 * (1 - distance / (range / 2)));
  }

  /**
   * Get search result count
   */
  private async getSearchResultCount(query: Record<string, unknown>): Promise<number> {
    return await prisma.listing.count(query as Parameters<typeof prisma.listing.count>[0]);
  }

  /**
   * Generate search facets for filtering
   */
  private async generateFacets(filters: SearchFilters): Promise<SearchFacets> {
    // Build base query without price and other facet filters
    const baseWhere = {
      status: 'APPROVED',
      isPublished: true
    };

    if (filters.location) {
      (baseWhere as Record<string, unknown>).OR = [
        { location: { contains: filters.location, mode: 'insensitive' } },
        { city: { contains: filters.location, mode: 'insensitive' } }
      ];
    }

    const [priceStats, locationStats, amenityStats, roomTypeStats, ratingStats] = await Promise.all([
      this.getPriceRangeFacets(baseWhere),
      this.getLocationFacets(baseWhere),
      this.getAmenityFacets(baseWhere),
      this.getRoomTypeFacets(baseWhere),
      this.getRatingFacets(baseWhere)
    ]);

    return {
      priceRanges: priceStats,
      locations: locationStats,
      amenities: amenityStats,
      roomTypes: roomTypeStats,
      ratings: ratingStats,
      availability: [] // TODO: Implement availability facets
    };
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(filters: SearchFilters): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    if (filters.location && filters.location.length >= 2) {
      // Location suggestions
      const locationSuggestions = await this.getLocationSuggestions(filters.location);
      suggestions.push(...locationSuggestions);

      // Popular amenity suggestions
      const amenitySuggestions = await this.getAmenitySuggestions(filters.location);
      suggestions.push(...amenitySuggestions);
    }

    return suggestions.slice(0, 10);
  }

  /**
   * Save search for alerts
   */
  async saveSearch(userId: string, name: string, filters: SearchFilters): Promise<SavedSearch> {
    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        name,
        filters: JSON.stringify(filters),
        alertEnabled: true
      }
    });

    return {
      id: savedSearch.id,
      name: savedSearch.name,
      filters: JSON.parse(savedSearch.filters),
      alertEnabled: savedSearch.alertEnabled,
      createdAt: savedSearch.createdAt
    };
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return savedSearches.map(search => ({
      id: search.id,
      name: search.name,
      filters: JSON.parse(search.filters as string) as SearchFilters,
      alertEnabled: search.alertEnabled,
      lastNotified: search.lastNotified || undefined,
      createdAt: search.createdAt,
    }));
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string, type: 'location' | 'amenity' | 'all' = 'all'): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    if (query.length < 2) return suggestions;

    if (type === 'location' || type === 'all') {
      const locationSuggestions = await this.getLocationSuggestions(query);
      suggestions.push(...locationSuggestions);
    }

    if (type === 'amenity' || type === 'all') {
      const amenitySuggestions = await this.getAmenitySuggestions(query);
      suggestions.push(...amenitySuggestions);
    }

    return suggestions.slice(0, 8);
  }

  // Helper methods for facets
  private async getPriceRangeFacets(where: Record<string, unknown>) {
    const ranges = [
      { label: '< ৳5,000', min: 0, max: 5000 },
      { label: '৳5,000 - ৳10,000', min: 5000, max: 10000 },
      { label: '৳10,000 - ৳15,000', min: 10000, max: 15000 },
      { label: '৳15,000 - ৳25,000', min: 15000, max: 25000 },
      { label: '৳25,000+', min: 25000, max: Infinity }
    ];

    const facets = await Promise.all(
      ranges.map(async range => {
        const count = await prisma.listing.count({
          where: {
            ...where,
            monthlyRent: {
              gte: range.min,
              lt: range.max === Infinity ? undefined : range.max
            }
          }
        });

        return {
          range: range.label,
          count,
          min: range.min,
          max: range.max === Infinity ? 0 : range.max
        };
      })
    );

    return facets.filter(f => f.count > 0);
  }

  private async getLocationFacets(where: Record<string, unknown>) {
    const locations = await prisma.listing.groupBy({
      by: ['city'],
      where,
      _count: true,
      orderBy: { _count: { city: 'desc' } },
      take: 10
    });

    return locations.map(loc => ({
      city: loc.city,
      area: '', // TODO: Group by area as well
      count: loc._count
    }));
  }

  private async getAmenityFacets(where: Record<string, unknown>) {
    // This is simplified - in reality you'd analyze the amenities array
    console.log('Amenity filtering with:', where);
    const commonAmenities = [
      'WiFi', 'AC', 'Parking', 'Generator', 'Lift', 'Security',
      'Gym', 'Laundry', 'Kitchen', 'Balcony'
    ];

    return commonAmenities.map(amenity => ({
      name: amenity,
      count: Math.floor(Math.random() * 100) // TODO: Implement proper counting
    }));
  }

  private async getRoomTypeFacets(where: Record<string, unknown>) {
    const roomTypes = await prisma.listing.groupBy({
      by: ['roomType'],
      where,
      _count: true
    });

    return roomTypes.map(rt => ({
      type: rt.roomType,
      count: rt._count
    }));
  }

  private async getRatingFacets(where: Record<string, unknown>) {
    console.log('Rating filtering with:', where);
    return [
      { rating: 4, count: 50 },
      { rating: 3, count: 30 },
      { rating: 2, count: 20 }
    ]; // TODO: Implement proper rating facets
  }

  private async getLocationSuggestions(query: string): Promise<SearchSuggestion[]> {
    const locations = await prisma.listing.findMany({
      where: {
        OR: [
          { city: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: { city: true, location: true, lat: true, lng: true },
      distinct: ['city'],
      take: 5
    });

    return locations.map(loc => ({
      type: 'LOCATION' as const,
      text: loc.city,
      value: loc.city,
      coordinates: {
        lat: loc.lat,
        lng: loc.lng
      }
    }));
  }

  private async getAmenitySuggestions(query: string): Promise<SearchSuggestion[]> {
    const amenities = ['WiFi', 'AC', 'Parking', 'Generator', 'Lift', 'Security']
      .filter(amenity => amenity.toLowerCase().includes(query.toLowerCase()));

    return amenities.map(amenity => ({
      type: 'AMENITY' as const,
      text: amenity,
      value: amenity
    }));
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logSearchAnalytics(analytics: SearchAnalytics): Promise<void> {
    try {
      await prisma.searchAnalytics.create({
        data: {
          searchId: analytics.searchId,
          userId: analytics.userId,
          query: analytics.query,
          filters: JSON.stringify(analytics.filters),
          resultCount: analytics.resultCount,
          searchTime: analytics.searchTime,
          timestamp: analytics.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to log search analytics:', error);
    }
  }
}

export const searchService = SearchService.getInstance();