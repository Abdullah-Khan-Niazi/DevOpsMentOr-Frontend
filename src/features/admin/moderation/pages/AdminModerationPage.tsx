import '../styles/moderation-admin.css';
import {
  Button,
  Card,
  ErrorState,
  EmptyState,
  Icon,
  PageHeader,
  TabPanel,
  TabSwitcher,
  type TabSwitcherItem,
  TablePageSkeleton,
  toast,
} from '@/shared/components';
import { useUrlState } from '@/shared/hooks';
import { useAdminComments, useAdminReviews } from '../hooks/useAdminModeration';
import type { AdminCommentDto, AdminReviewDto } from '../types';

// SCR-F8-11: admin content moderation. Pending review queue with approve
// and delete actions, plus a comments tab with pin and hide controls.

const MODERATION_TAB_IDS = ['reviews', 'comments'] as const;
type ModerationTab = (typeof MODERATION_TAB_IDS)[number];

const MODERATION_TABS: ReadonlyArray<TabSwitcherItem<ModerationTab>> = [
  { id: 'reviews', label: 'Reviews', icon: 'star' },
  { id: 'comments', label: 'Comments', icon: 'chat' },
];

const REVIEW_TAB_IDS = ['pending', 'approved', 'all'] as const;
type ReviewTab = (typeof REVIEW_TAB_IDS)[number];

const REVIEW_TABS: ReadonlyArray<TabSwitcherItem<ReviewTab>> = [
  { id: 'pending', label: 'Pending', icon: 'pending' },
  { id: 'approved', label: 'Approved', icon: 'check-circle' },
  { id: 'all', label: 'All', icon: 'list' },
];

/** Muted status glyph; the label is the tooltip and the accessible name. */
function StatusIcon({
  name,
  label,
}: {
  name: 'check-circle' | 'pending' | 'visibility' | 'visibility-off';
  label: string;
}) {
  return <Icon name={name} size={18} title={label} className="shrink-0 text-muted-foreground" />;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} of 5 stars`}
      className="inline-flex items-center gap-0.5 text-muted-foreground"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Icon key={index} name="star" size={14} filled={index < rating} />
      ))}
    </span>
  );
}

function ReviewCard({
  review,
  onApprove,
  onDelete,
  isPending,
}: {
  review: AdminReviewDto;
  onApprove: (reviewId: number) => void;
  onDelete: (reviewId: number) => void;
  isPending: boolean;
}) {
  return (
    <Card className="moderation-item">
      <div className="moderation-item__head">
        <span className="moderation-item__author">
          {review.author.fullName ?? `User ${review.author.userId}`}
        </span>
        <StatusIcon
          name={review.isApproved ? 'check-circle' : 'pending'}
          label={review.isApproved ? 'Approved' : 'Pending'}
        />
      </div>
      <p className="moderation-item__meta flex flex-wrap items-center gap-3">
        <span>
          {review.targetType} #{review.targetId}
        </span>
        <RatingStars rating={review.rating ?? 0} />
        <span>{new Date(review.createdAt).toLocaleString()}</span>
      </p>
      {review.title ? <h4 className="moderation-item__title">{review.title}</h4> : null}
      {review.content ? <p className="moderation-item__content">{review.content}</p> : null}
      <div className="moderation-item__actions">
        {!review.isApproved ? (
          <Button size="sm" onClick={() => onApprove(review.reviewId)} disabled={isPending}>
            Approve
          </Button>
        ) : null}
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(review.reviewId)}
          disabled={isPending}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

function CommentCard({
  comment,
  onPin,
  onHide,
  isPending,
}: {
  comment: AdminCommentDto;
  onPin: (commentId: number) => void;
  onHide: (commentId: number) => void;
  isPending: boolean;
}) {
  return (
    <Card className="moderation-item">
      <div className="moderation-item__head">
        <span className="moderation-item__author">
          {comment.author.fullName ?? `User ${comment.author.userId}`}
        </span>
        <StatusIcon
          name={comment.isHidden ? 'visibility-off' : 'visibility'}
          label={comment.isHidden ? 'Hidden' : 'Visible'}
        />
      </div>
      <p className="moderation-item__meta flex flex-wrap items-center gap-3">
        <span>
          {comment.targetType} #{comment.targetId}
        </span>
        {comment.parentCommentId !== null ? <span>Reply to #{comment.parentCommentId}</span> : null}
        <span>{new Date(comment.createdAt).toLocaleString()}</span>
      </p>
      <p className="moderation-item__content">{comment.content}</p>
      <div className="moderation-item__actions">
        <Button size="sm" onClick={() => onPin(comment.commentId)} disabled={isPending}>
          {comment.isPinned ? 'Unpin' : 'Pin'}
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onHide(comment.commentId)}
          disabled={isPending}
        >
          {comment.isHidden ? 'Unhide' : 'Hide'}
        </Button>
      </div>
    </Card>
  );
}

export function AdminModerationPage() {
  const [tab, setTab] = useUrlState<ModerationTab>('tab', MODERATION_TAB_IDS, 'reviews');
  const [reviewTab, setReviewTab] = useUrlState<ReviewTab>(
    'reviewStatus',
    REVIEW_TAB_IDS,
    'pending',
  );
  const { query, approve, remove } = useAdminReviews(reviewTab, 1);
  const { query: commentsQuery, pin, hide } = useAdminComments(1);

  return (
    <div className="moderation-admin-page">
      <PageHeader title="Content moderation" />

      <TabSwitcher
        items={MODERATION_TABS}
        value={tab}
        onChange={setTab}
        ariaLabel="Moderation sections"
        idPrefix="moderation"
      />

      <TabPanel idPrefix="moderation" id="reviews" active={tab === 'reviews'}>
        <div className="moderation-admin-page__sub-tabs">
          <TabSwitcher
            items={REVIEW_TABS}
            value={reviewTab}
            onChange={setReviewTab}
            ariaLabel="Review status"
          />
        </div>

        {query.isError ? (
          <ErrorState title="Could not load reviews" message="Please try again later." />
        ) : query.isLoading ? (
          <TablePageSkeleton />
        ) : query.data && query.data.data.length > 0 ? (
          <div className="moderation-admin-page__list">
            {query.data.data.map((review) => (
              <ReviewCard
                key={review.reviewId}
                review={review}
                onApprove={(reviewId) =>
                  approve.mutate(reviewId, {
                    onSuccess: () => toast.success('Review approved.'),
                    onError: () => toast.error('Could not approve the review.'),
                  })
                }
                onDelete={(reviewId) =>
                  remove.mutate(reviewId, {
                    onSuccess: () => toast.success('Review deleted.'),
                    onError: () => toast.error('Could not delete the review.'),
                  })
                }
                isPending={approve.isPending || remove.isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No reviews in this view." />
        )}
      </TabPanel>

      <TabPanel idPrefix="moderation" id="comments" active={tab === 'comments'}>
        {commentsQuery.isError ? (
          <ErrorState title="Could not load comments" message="Please try again later." />
        ) : commentsQuery.isLoading ? (
          <TablePageSkeleton />
        ) : commentsQuery.data && commentsQuery.data.data.length > 0 ? (
          <div className="moderation-admin-page__list">
            {commentsQuery.data.data.map((comment) => (
              <CommentCard
                key={comment.commentId}
                comment={comment}
                onPin={(commentId) =>
                  pin.mutate(commentId, {
                    onSuccess: (result) =>
                      toast.success(result.isPinned ? 'Comment pinned.' : 'Comment unpinned.'),
                    onError: () => toast.error('Could not update the comment.'),
                  })
                }
                onHide={(commentId) =>
                  hide.mutate(commentId, {
                    onSuccess: (result) =>
                      toast.success(result.isHidden ? 'Comment hidden.' : 'Comment unhidden.'),
                    onError: () => toast.error('Could not update the comment.'),
                  })
                }
                isPending={pin.isPending || hide.isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No comments yet." />
        )}
      </TabPanel>
    </div>
  );
}

export default AdminModerationPage;
