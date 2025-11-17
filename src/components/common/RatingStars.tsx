'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const displayRating = interactive && isHovering ? hoverRating : rating;

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setIsHovering(false);
      setHoverRating(0);
    }
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isPartiallyFilled = !isFilled && starValue - 0.5 <= displayRating;

          return (
            <button
              key={index}
              type="button"
              className={cn(
                'relative transition-colors duration-150',
                interactive && 'hover:scale-110 cursor-pointer',
                !interactive && 'cursor-default'
              )}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-150',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : isPartiallyFilled
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : interactive && isHovering && starValue <= hoverRating
                    ? 'fill-yellow-300 text-yellow-300'
                    : 'text-gray-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-muted-foreground ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Alternative compact rating display
interface RatingBadgeProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function RatingBadge({ rating, count, size = 'sm', className }: RatingBadgeProps) {
  if (rating === 0) return null;

  return (
    <div className={cn(
      'inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full',
      size === 'sm' ? 'text-xs' : 'text-sm',
      className
    )}>
      <Star className={cn(
        'fill-current',
        size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
      )} />
      <span className="font-medium">{rating.toFixed(1)}</span>
      {count && (
        <span className="text-yellow-600">({count})</span>
      )}
    </div>
  );
}

// Rating summary component
interface RatingSummaryProps {
  ratings: { rating: number; count: number }[];
  totalRating: number;
  totalCount: number;
  className?: string;
}

export function RatingSummary({ 
  ratings, 
  totalRating, 
  totalCount, 
  className 
}: RatingSummaryProps) {
  const maxCount = Math.max(...ratings.map(r => r.count));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Rating */}
      <div className="flex items-center space-x-4">
        <div className="text-4xl font-bold">{totalRating.toFixed(1)}</div>
        <div className="flex-1">
          <RatingStars rating={totalRating} size="lg" />
          <div className="text-sm text-muted-foreground mt-1">
            Based on {totalCount} reviews
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {ratings.reverse().map(({ rating, count }) => (
          <div key={rating} className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-sm w-12">
              <span>{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground w-8 text-right">
              {count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}