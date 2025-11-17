'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecommendationResult } from '@/lib/recommendations/types';
import { 
  Star, 
  MapPin, 
  DollarSign, 
  Navigation, 
  Heart, 
  Eye, 
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RecommendationCardProps {
  result: RecommendationResult;
  className?: string;
  showScoreBreakdown?: boolean;
  onFavorite?: (listingId: string) => void;
  isFavorited?: boolean;
}

export function RecommendationCard({
  result,
  className = '',
  showScoreBreakdown = true,
  onFavorite,
  isFavorited = false
}: RecommendationCardProps) {
  const { listing, score, distance, travelTime, budgetFit, matchPercentage } = result;

  const getBudgetFitColor = (fit: string) => {
    switch (fit) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 0.8) return 'text-green-600';
    if (scoreValue >= 0.6) return 'text-blue-600';
    if (scoreValue >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(listing.id);
    }
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
          {/* Image */}
          <div className="relative h-48 md:h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            
            {/* Match percentage badge */}
            <div className="absolute top-3 right-3">
              <Badge className={cn(
                'font-semibold',
                getScoreColor(score.totalScore)
              )}>
                {matchPercentage}% match
              </Badge>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 p-6 space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold line-clamp-1">
                {listing.title}
              </h3>
              
              <p className="text-muted-foreground text-sm line-clamp-2">
                {listing.description}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">
                  ৳{listing.price.toLocaleString()}
                </span>
              </div>
              
              {distance && (
                <div className="flex items-center space-x-1">
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                  <span>{distance.toFixed(1)}km</span>
                </div>
              )}
              
              {travelTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{Math.round(travelTime)}min</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>
                  {listing.ratingAvg.toFixed(1)} ({listing.ratingCount})
                </span>
              </div>
            </div>

            {/* Room Type & Budget Fit */}
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {listing.roomType === 'SINGLE' ? 'Single Room' : 'Shared Room'}
              </Badge>
              <Badge className={getBudgetFitColor(budgetFit)}>
                {budgetFit} budget fit
              </Badge>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              {score.explanation.slice(0, 3).map((explanation, index) => (
                <div key={index} className="text-xs text-muted-foreground flex items-start space-x-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{explanation}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2">
              <Button asChild size="sm" className="flex-1">
                <Link href={`/rooms/${listing.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Link>
              </Button>
              <Button 
                size="sm" 
                variant={isFavorited ? "default" : "outline"}
                onClick={handleFavorite}
              >
                <Heart className={cn(
                  'w-4 h-4',
                  isFavorited && 'fill-current'
                )} />
              </Button>
            </div>
          </div>

          {/* Score Breakdown */}
          {showScoreBreakdown && (
            <div className="p-6 bg-muted/30 space-y-4">
              <div className="text-sm font-medium">Match Breakdown</div>
              
              <div className="space-y-3">
                {[
                  { 
                    label: 'Budget', 
                    score: score.budgetScore, 
                    icon: DollarSign,
                    reason: score.reasons?.find(r => r.type === 'budget')
                  },
                  { 
                    label: 'Location', 
                    score: score.distanceScore, 
                    icon: Navigation,
                    reason: score.reasons?.find(r => r.type === 'distance')
                  },
                  { 
                    label: 'Amenities', 
                    score: score.amenitiesScore, 
                    icon: CheckCircle,
                    reason: score.reasons?.find(r => r.type === 'amenities')
                  },
                  { 
                    label: 'Rating', 
                    score: score.ratingScore, 
                    icon: Star,
                    reason: score.reasons?.find(r => r.type === 'rating')
                  }
                ].map(({ label, score: scoreValue, icon: Icon, reason }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <Icon className="w-3 h-3" />
                        <span>{label}</span>
                      </div>
                      <span className={getScoreColor(scoreValue)}>
                        {Math.round(scoreValue * 100)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          scoreValue >= 0.8 ? 'bg-green-500' :
                          scoreValue >= 0.6 ? 'bg-blue-500' :
                          scoreValue >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${scoreValue * 100}%` }}
                      />
                    </div>
                    
                    {reason && (
                      <div className="text-xs text-muted-foreground">
                        {reason.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Overall Score */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Overall Match</span>
                  <span className={getScoreColor(score.totalScore)}>
                    {Math.round(score.totalScore * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className={cn(
                      'h-2 rounded-full transition-all',
                      score.totalScore >= 0.8 ? 'bg-green-500' :
                      score.totalScore >= 0.6 ? 'bg-blue-500' :
                      score.totalScore >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${score.totalScore * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}