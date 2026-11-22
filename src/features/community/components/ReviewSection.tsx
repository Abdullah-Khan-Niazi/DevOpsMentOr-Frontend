import '../styles/community.css';
import { useState } from 'react';
import { Button, Card, EmptyState, ErrorState, Icon, IconButton, toast } from '@/shared/components';
import { useAuthStore } from '@/features/auth';
import { useCreateReview, useReviews } from '../hooks/useCommunity';
import { relativeTime } from '@/features/notifications';
import { ReportModal } from './ReportModal';
import { ReviewSectionSkeleton } from './ReviewSectionSkeleton';
import type { ReviewDto, ReviewTargetType } from '../types';

// SCR-F8-05: embedded review section for course/lab pages. Shows the
// approved list publicly; the submit form is mounted only when the session
// is authenticated. Submitted reviews land pending-approval.

interface ReviewSectionProps {
  targetType: ReviewTargetType;
  targetId: number;
}

const RATINGS = [5, 4, 3, 2, 1];

/** One review card with a SCR-F8-07 report trigger. */
function ReviewCard({ review }: { review: ReviewDto }) {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <li>
      <Card className="review-section__card">
        <div className="review-section__card-head">
          <span className="review-section__author">
            {review.author.fullName ?? `User ${review.author.userId}`}
          </span>
          <span
            className="review-section__stars"
            aria-label={`${review.rating ?? 0} out of 5 stars`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <Icon key={i} name="star" size={14} filled={i < (review.rating ?? 0)} />
            ))}
          </span>
          <span className="review-section__time">{relativeTime(review.createdAt)}</span>
        </div>
        {review.title ? <h3 className="review-section__title">{review.title}</h3> : null}
        {review.content ? <p className="review-section__content">{review.content}</p> : null}
        <div className="review-section__actions">
          <Button variant="ghost" size="sm" iconName="flag" onClick={() => setReportOpen(true)}>
            Report
          </Button>
        </div>
      </Card>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="review"
        targetId={review.reviewId}
      />
    </li>
  );
}

function ratingBars(reviews: Array<{ rating: number | null }>) {
  const buckets = new Map<number, number>();
  for (const review of reviews) {
    if (review.rating === null) continue;
    buckets.set(review.rating, (buckets.get(review.rating) ?? 0) + 1);
  }
  const max = Math.max(1, ...buckets.values());
  return RATINGS.map((rating) => ({
    rating,
    count: buckets.get(rating) ?? 0,
    pct: ((buckets.get(rating) ?? 0) / max) * 100,
  }));
}

export function ReviewSection({ targetType, targetId }: ReviewSectionProps) {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, error, refetch, isRefetching } = useReviews(
    targetType,
    targetId,
  );
  const createReview = useCreateReview(targetType, targetId);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const canSubmit = user !== null;
  const reviews = data?.data ?? [];
  const bars = ratingBars(reviews);

  const handleSubmit = () => {
    createReview.mutate(
      {
        targetType,
        targetId,
        rating,
        title: title.trim() || null,
        content: content.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('Review submitted and pending approval.');
          setTitle('');
          setContent('');
        },
        onError: () => toast.error('Could not submit the review.'),
      },
    );
  };

  return (
    <section className="review-section" aria-label="Reviews">
      <h2 className="review-section__heading">Reviews</h2>

      {isError ? (
        <ErrorState
          title="Could not load reviews"
          error={error}
          onRetry={() => void refetch()}
          retrying={isRefetching}
          compact
        />
      ) : isLoading ? (
        <ReviewSectionSkeleton />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet." icon="star" />
      ) : (
        <>
          <div className="review-section__histogram">
            {bars.map(({ rating: barRating, count, pct }) => (
              <div key={barRating} className="review-section__bar-row">
                <span className="review-section__bar-label">
                  {barRating}
                  <Icon name="star" size={12} filled />
                </span>
                <div className="review-section__bar-track">
                  <div className="review-section__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="review-section__bar-count">{count}</span>
              </div>
            ))}
          </div>
          <ul className="review-section__list">
            {reviews.map((review) => (
              <ReviewCard key={review.reviewId} review={review} />
            ))}
          </ul>
        </>
      )}

      {canSubmit ? (
        <div className="review-section__form">
          <h3 className="review-section__form-title">Write a review</h3>
          <div className="review-section__rating" role="radiogroup" aria-label="Rating">
            {RATINGS.map((value) => (
              <IconButton
                key={value}
                icon="star"
                role="radio"
                aria-checked={rating === value}
                label={`${value} stars`}
                className="review-section__star"
                data-active={rating >= value}
                filled={rating >= value}
                showTooltip={false}
                onClick={() => setRating(value)}
              />
            ))}
          </div>
          <input
            className="review-section__input"
            placeholder="Title (optional)"
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <textarea
            className="review-section__textarea"
            placeholder="Share your experience (optional)"
            rows={4}
            maxLength={2000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <div className="review-section__actions">
            <Button onClick={handleSubmit} isLoading={createReview.isPending}>
              Submit review
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ReviewSection;
