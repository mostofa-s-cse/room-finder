import { 
  UserPreferences, 
  ListingForRecommendation, 
  RecommendationScore, 
  RecommendationResult, 
  RecommendationFilter, 
  RecommendationReason,
  DEFAULT_PRIORITY_WEIGHTS,
  BUDGET_THRESHOLDS,
  TRANSPORT_SPEED_KMH
} from './types';
import { DistanceCalculator } from '@/lib/maps/utils';
import { MapLocation } from '@/lib/maps/types';

export class RecommendationEngine {
  /**
   * Generate personalized recommendations for a user
   */
  static async generateRecommendations(
    userPreferences: UserPreferences,
    listings: ListingForRecommendation[],
    filter: RecommendationFilter = {}
  ): Promise<RecommendationResult[]> {
    const {
      maxResults = 10,
      minScore = 0.3,
      budgetFlexibility = 0.1,
      maxDistance = 50,
      requiredAmenities = [],
      excludeListings = []
    } = filter;

    // Filter listings based on basic criteria
    const filteredListings = listings.filter(listing => {
      // Exclude specific listings
      if (excludeListings.includes(listing.id)) return false;
      
      // Only published listings
      if (!listing.isPublished) return false;
      
      // Budget filter with flexibility
      if (userPreferences.affordablePrice) {
        const maxBudget = userPreferences.affordablePrice * (1 + budgetFlexibility);
        if (listing.price > maxBudget) return false;
      }
      
      // Required amenities check
      if (requiredAmenities.length > 0) {
        const hasAllRequired = requiredAmenities.every(amenity => 
          listing.amenities.includes(amenity)
        );
        if (!hasAllRequired) return false;
      }
      
      return true;
    });

    // Calculate scores for each listing
    const scoredListings = await Promise.all(
      filteredListings.map(async listing => {
        const score = await this.calculateRecommendationScore(
          userPreferences,
          listing,
          maxDistance
        );
        
        if (score.totalScore < minScore) return null;
        
        const distance = userPreferences.workLocation 
          ? DistanceCalculator.calculateDistance(
              userPreferences.workLocation,
              { lat: listing.lat, lng: listing.lng }
            )
          : undefined;
        
        const travelTime = distance && userPreferences.transportMode
          ? (distance / TRANSPORT_SPEED_KMH[userPreferences.transportMode]) * 60 // minutes
          : undefined;
        
        const budgetFit = this.getBudgetFit(
          listing.price,
          userPreferences.income || userPreferences.affordablePrice
        );
        
        return {
          listing,
          score,
          distance,
          travelTime,
          budgetFit,
          matchPercentage: Math.round(score.totalScore * 100)
        } as RecommendationResult;
      })
    );

    // Filter out null results and sort by score
    const validResults = scoredListings
      .filter((result): result is RecommendationResult => result !== null)
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
      .slice(0, maxResults);

    return validResults;
  }

  /**
   * Calculate comprehensive recommendation score for a listing
   */
  private static async calculateRecommendationScore(
    userPreferences: UserPreferences,
    listing: ListingForRecommendation,
    maxDistance: number
  ): Promise<RecommendationScore> {
    const weights = userPreferences.priorityWeights || DEFAULT_PRIORITY_WEIGHTS;
    const reasons: RecommendationReason[] = [];
    const explanation: string[] = [];

    // 1. Budget Score (0-1)
    const budgetScore = this.calculateBudgetScore(
      listing.price,
      userPreferences.income,
      userPreferences.affordablePrice,
      reasons
    );

    // 2. Distance Score (0-1)
    const distanceScore = await this.calculateDistanceScore(
      listing,
      userPreferences.workLocation,
      maxDistance,
      reasons
    );

    // 3. Amenities Score (0-1)
    const amenitiesScore = this.calculateAmenitiesScore(
      listing.amenities,
      userPreferences.preferredAmenities || [],
      reasons
    );

    // 4. Rating Score (0-1)
    const ratingScore = this.calculateRatingScore(
      listing.ratingAvg,
      listing.ratingCount,
      reasons
    );

    // 5. Room Type Bonus
    const roomTypeBonus = this.calculateRoomTypeScore(
      listing.roomType,
      userPreferences.preferredRoomTypes || [],
      reasons
    );

    // Calculate weighted total score
    const baseScore = (
      budgetScore * weights.budget +
      distanceScore * weights.distance +
      amenitiesScore * weights.amenities +
      ratingScore * weights.rating
    );

    const totalScore = Math.min(1, baseScore + roomTypeBonus * 0.1); // Room type gives max 10% bonus

    // Generate explanations
    this.generateExplanations(reasons, explanation);

    return {
      listingId: listing.id,
      totalScore,
      budgetScore,
      distanceScore,
      amenitiesScore,
      ratingScore,
      explanation,
      reasons
    };
  }

  /**
   * Calculate budget score based on income and affordable price
   */
  private static calculateBudgetScore(
    listingPrice: number,
    income?: number,
    affordablePrice?: number,
    reasons: RecommendationReason[] = []
  ): number {
    let score = 0;
    let message = '';
    let isPositive = false;

    if (income && listingPrice <= income * BUDGET_THRESHOLDS.EXCELLENT) {
      score = 1.0;
      message = `Excellent budget fit: Only ${Math.round((listingPrice / income) * 100)}% of income`;
      isPositive = true;
    } else if (income && listingPrice <= income * BUDGET_THRESHOLDS.GOOD) {
      score = 0.8;
      message = `Good budget fit: ${Math.round((listingPrice / income) * 100)}% of income`;
      isPositive = true;
    } else if (income && listingPrice <= income * BUDGET_THRESHOLDS.FAIR) {
      score = 0.6;
      message = `Fair budget fit: ${Math.round((listingPrice / income) * 100)}% of income`;
      isPositive = false;
    } else if (affordablePrice && listingPrice <= affordablePrice) {
      score = 0.9;
      message = `Within your budget of ৳${affordablePrice.toLocaleString()}`;
      isPositive = true;
    } else if (affordablePrice && listingPrice <= affordablePrice * 1.1) {
      score = 0.7;
      message = `Slightly above budget (+${Math.round(((listingPrice / affordablePrice) - 1) * 100)}%)`;
      isPositive = false;
    } else {
      score = 0.3;
      message = income 
        ? `High cost: ${Math.round((listingPrice / income) * 100)}% of income`
        : 'Above your specified budget';
      isPositive = false;
    }

    reasons.push({
      type: 'budget',
      score,
      message,
      isPositive
    });

    return score;
  }

  /**
   * Calculate distance score based on work location
   */
  private static async calculateDistanceScore(
    listing: ListingForRecommendation,
    workLocation?: MapLocation & { address: string },
    maxDistance: number = 50,
    reasons: RecommendationReason[] = []
  ): Promise<number> {
    if (!workLocation) {
      reasons.push({
        type: 'distance',
        score: 0.5,
        message: 'No work location specified',
        isPositive: false
      });
      return 0.5; // Neutral score if no work location
    }

    const distance = DistanceCalculator.calculateDistance(
      workLocation,
      { lat: listing.lat, lng: listing.lng }
    );

    let score = 0;
    let message = '';
    let isPositive = false;

    if (distance <= 2) {
      score = 1.0;
      message = `Very close to work: ${distance.toFixed(1)}km`;
      isPositive = true;
    } else if (distance <= 5) {
      score = 0.9;
      message = `Close to work: ${distance.toFixed(1)}km`;
      isPositive = true;
    } else if (distance <= 10) {
      score = 0.7;
      message = `Moderate distance: ${distance.toFixed(1)}km`;
      isPositive = true;
    } else if (distance <= 20) {
      score = 0.5;
      message = `Far from work: ${distance.toFixed(1)}km`;
      isPositive = false;
    } else if (distance <= maxDistance) {
      score = 0.3;
      message = `Very far from work: ${distance.toFixed(1)}km`;
      isPositive = false;
    } else {
      score = 0.1;
      message = `Too far from work: ${distance.toFixed(1)}km`;
      isPositive = false;
    }

    reasons.push({
      type: 'distance',
      score,
      message,
      isPositive
    });

    return score;
  }

  /**
   * Calculate amenities matching score
   */
  private static calculateAmenitiesScore(
    listingAmenities: string[],
    preferredAmenities: string[],
    reasons: RecommendationReason[] = []
  ): number {
    if (preferredAmenities.length === 0) {
      reasons.push({
        type: 'amenities',
        score: 0.5,
        message: 'No amenity preferences specified',
        isPositive: false
      });
      return 0.5; // Neutral if no preferences
    }

    const matchedAmenities = preferredAmenities.filter(amenity =>
      listingAmenities.includes(amenity)
    );

    const matchRatio = matchedAmenities.length / preferredAmenities.length;
    const score = matchRatio;

    let message = '';
    let isPositive = false;

    if (matchRatio >= 0.8) {
      message = `Excellent amenity match: ${matchedAmenities.length}/${preferredAmenities.length} preferred amenities`;
      isPositive = true;
    } else if (matchRatio >= 0.6) {
      message = `Good amenity match: ${matchedAmenities.length}/${preferredAmenities.length} preferred amenities`;
      isPositive = true;
    } else if (matchRatio >= 0.4) {
      message = `Some amenity match: ${matchedAmenities.length}/${preferredAmenities.length} preferred amenities`;
      isPositive = false;
    } else {
      message = `Few amenities match: ${matchedAmenities.length}/${preferredAmenities.length} preferred amenities`;
      isPositive = false;
    }

    reasons.push({
      type: 'amenities',
      score,
      message,
      isPositive
    });

    return score;
  }

  /**
   * Calculate rating score
   */
  private static calculateRatingScore(
    ratingAvg: number,
    ratingCount: number,
    reasons: RecommendationReason[] = []
  ): number {
    let score = 0;
    let message = '';
    let isPositive = false;

    if (ratingCount === 0) {
      score = 0.5;
      message = 'No reviews yet';
      isPositive = false;
    } else if (ratingAvg >= 4.5 && ratingCount >= 10) {
      score = 1.0;
      message = `Excellent rating: ${ratingAvg.toFixed(1)}/5 (${ratingCount} reviews)`;
      isPositive = true;
    } else if (ratingAvg >= 4.0) {
      score = 0.8;
      message = `Good rating: ${ratingAvg.toFixed(1)}/5 (${ratingCount} reviews)`;
      isPositive = true;
    } else if (ratingAvg >= 3.5) {
      score = 0.6;
      message = `Average rating: ${ratingAvg.toFixed(1)}/5 (${ratingCount} reviews)`;
      isPositive = false;
    } else if (ratingAvg >= 3.0) {
      score = 0.4;
      message = `Below average rating: ${ratingAvg.toFixed(1)}/5 (${ratingCount} reviews)`;
      isPositive = false;
    } else {
      score = 0.2;
      message = `Poor rating: ${ratingAvg.toFixed(1)}/5 (${ratingCount} reviews)`;
      isPositive = false;
    }

    reasons.push({
      type: 'rating',
      score,
      message,
      isPositive
    });

    return score;
  }

  /**
   * Calculate room type preference score
   */
  private static calculateRoomTypeScore(
    listingRoomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT',
    preferredRoomTypes: ('SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT')[],
    reasons: RecommendationReason[] = []
  ): number {
    if (preferredRoomTypes.length === 0) return 0;

    const isPreferred = preferredRoomTypes.includes(listingRoomType);
    const score = isPreferred ? 1.0 : 0.0;

    reasons.push({
      type: 'roomType',
      score,
      message: isPreferred 
        ? `Matches your preference: ${listingRoomType.toLowerCase()} room`
        : `Doesn't match preference: ${listingRoomType.toLowerCase()} room`,
      isPositive: isPreferred
    });

    return score;
  }

  /**
   * Generate human-readable explanations
   */
  private static generateExplanations(
    reasons: RecommendationReason[],
    explanation: string[]
  ): void {
    const positiveReasons = reasons.filter(r => r.isPositive).sort((a, b) => b.score - a.score);
    const negativeReasons = reasons.filter(r => !r.isPositive).sort((a, b) => a.score - b.score);

    // Add top positive reasons
    positiveReasons.slice(0, 2).forEach(reason => {
      explanation.push(`✓ ${reason.message}`);
    });

    // Add main concerns if any
    if (negativeReasons.length > 0) {
      explanation.push(`⚠ ${negativeReasons[0].message}`);
    }
  }

  /**
   * Determine budget fit category
   */
  private static getBudgetFit(
    price: number,
    incomeOrBudget?: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!incomeOrBudget) return 'fair';

    const ratio = price / incomeOrBudget;

    if (ratio <= BUDGET_THRESHOLDS.EXCELLENT) return 'excellent';
    if (ratio <= BUDGET_THRESHOLDS.GOOD) return 'good';
    if (ratio <= BUDGET_THRESHOLDS.FAIR) return 'fair';
    return 'poor';
  }

  /**
   * Get similar users for collaborative filtering
   */
  static findSimilarUsers(
    targetUser: UserPreferences,
    allUsers: UserPreferences[]
  ): (UserPreferences & { similarity: number })[] {
    return allUsers
      .filter(user => user.userId !== targetUser.userId)
      .map(user => ({
        ...user,
        similarity: this.calculateUserSimilarity(targetUser, user)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 similar users
  }

  /**
   * Calculate similarity between two users
   */
  private static calculateUserSimilarity(
    user1: UserPreferences,
    user2: UserPreferences
  ): number {
    let similarity = 0;
    let factors = 0;

    // Income similarity
    if (user1.income && user2.income) {
      const incomeRatio = Math.min(user1.income, user2.income) / Math.max(user1.income, user2.income);
      similarity += incomeRatio * 0.3;
      factors += 0.3;
    }

    // Transport mode similarity
    if (user1.transportMode && user2.transportMode) {
      similarity += (user1.transportMode === user2.transportMode ? 0.2 : 0);
      factors += 0.2;
    }

    // Amenities similarity
    if (user1.preferredAmenities && user2.preferredAmenities) {
      const common = user1.preferredAmenities.filter(a => 
        user2.preferredAmenities!.includes(a)
      ).length;
      const total = new Set([...user1.preferredAmenities, ...user2.preferredAmenities]).size;
      similarity += (common / total) * 0.3;
      factors += 0.3;
    }

    // Location similarity (if both have work locations)
    if (user1.workLocation && user2.workLocation) {
      const distance = DistanceCalculator.calculateDistance(user1.workLocation, user2.workLocation);
      const locationSimilarity = Math.max(0, 1 - (distance / 50)); // 50km max distance
      similarity += locationSimilarity * 0.2;
      factors += 0.2;
    }

    return factors > 0 ? similarity / factors : 0;
  }
}