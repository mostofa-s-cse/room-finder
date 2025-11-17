'use client';

import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function RatingStars({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showValue = false,
  className = '' 
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const stars = [];
  
  for (let i = 1; i <= maxRating; i++) {
    const isFullStar = i <= rating;
    const isHalfStar = i - 0.5 <= rating && i > rating;
    
    stars.push(
      <Star
        key={i}
        className={`${sizeClasses[size]} ${
          isFullStar 
            ? 'fill-yellow-400 text-yellow-400' 
            : isHalfStar 
              ? 'fill-yellow-400 text-yellow-400 opacity-50'
              : 'text-gray-300'
        }`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {stars}
      </div>
      {showValue && (
        <span className="text-sm font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}