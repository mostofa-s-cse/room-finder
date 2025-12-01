'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/common/RatingStars';
import { MessageCircle, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reviewSchema } from '@/lib/validations';

interface ReviewFormProps {
  listingId: string;
  onReviewSubmitted?: (review: { id: string; rating: number; comment: string; reviewer: { id: string; name: string } }) => void;
  className?: string;
}

export function ReviewForm({ listingId, onReviewSubmitted, className = '' }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show form for authenticated BACHELOR users
  if (!session?.user || session.user.role !== 'BACHELOR') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    try {
      // Validate form data
      const validatedData = reviewSchema.parse({
        listingId,
        rating,
        comment,
      });

      setIsSubmitting(true);

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }

      // Success
      toast.success('Review submitted successfully!');
      
      // Reset form
      setRating(0);
      setComment('');
      
      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(result.data);
      }

    } catch (error) {
      console.error('Review submission error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already reviewed')) {
          toast.error('You have already reviewed this listing');
        } else if (error.message.includes('validation')) {
          toast.error('Please check your input and try again');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = rating > 0 && comment.trim().length >= 10;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageCircle className="h-5 w-5 mr-2" />
          Write a Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <RatingStars
                rating={rating}
                interactive={true}
                onChange={setRating}
                size="lg"
                className="cursor-pointer"
              />
              <span className="text-sm text-gray-600 ml-2">
                {rating === 0 && 'Click to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this room. What did you like? What could be improved?"
              className="min-h-[100px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{comment.length < 10 ? `Minimum 10 characters (${10 - comment.length} more needed)` : 'Looks good!'}</span>
              <span>{comment.length}/500</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Submitting Review...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>

          {!isFormValid && (
            <p className="text-sm text-gray-600 text-center">
              Please provide a rating and write at least 10 characters in your review.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}