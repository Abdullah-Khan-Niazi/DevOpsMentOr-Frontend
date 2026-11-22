import '../styles/community.css';
import { useState } from 'react';
import { Button, EmptyState, ErrorState, Icon, toast } from '@/shared/components';
import { useAuthStore } from '@/features/auth';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useLike,
  useUnlike,
} from '../hooks/useCommunity';
import { relativeTime } from '@/features/notifications';
import { ReportModal } from './ReportModal';
import { CommentThreadSkeleton } from './CommentThreadSkeleton';
import type { CommentDto } from '../types';

// SCR-F8-06: embedded comment thread for course/lab/news pages. Max depth
// 2 (top-level + one reply level); likes and replies are session-scoped.

interface CommentThreadProps {
  targetType: CommentDto['targetType'];
  targetId: number;
}

function CommentRow({
  comment,
  onReply,
  onLike,
  onUnlike,
  onDelete,
  isDeleting,
  isReply,
}: {
  comment: CommentDto;
  onReply: (comment: CommentDto) => void;
  onLike: (commentId: number) => void;
  onUnlike: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  isDeleting: boolean;
  isReply?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const [reportOpen, setReportOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  const isOwn = user?.userId === comment.author.userId;

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      onUnlike(comment.commentId);
    } else {
      setLiked(true);
      onLike(comment.commentId);
    }
  };

  return (
    <div className={`comment-row${isReply ? ' comment-row--reply' : ''}`}>
      <div className="comment-row__head">
        <span className="comment-row__author">
          {comment.author.fullName ?? `User ${comment.author.userId}`}
        </span>
        {comment.isPinned ? (
          <span className="comment-row__pinned" title="Pinned by moderator">
            <Icon name="pin" size={12} />
          </span>
        ) : null}
        <span className="comment-row__time">{relativeTime(comment.createdAt)}</span>
      </div>
      <p className="comment-row__content">{comment.content}</p>
      <div className="comment-row__actions">
        {user ? (
          <Button variant="ghost" size="sm" iconName="award" onClick={handleLike}>
            {comment.likesCount + (liked ? 1 : 0)}
          </Button>
        ) : null}
        {!isReply ? (
          <Button variant="ghost" size="sm" onClick={() => onReply(comment)}>
            Reply
          </Button>
        ) : null}
        {isOwn ? (
          <Button
            variant="ghost"
            size="sm"
            isLoading={isDeleting}
            disabled={isDeleting}
            onClick={() => onDelete(comment.commentId)}
          >
            Delete
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" iconName="flag" onClick={() => setReportOpen(true)}>
          Report
        </Button>
      </div>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="comment"
        targetId={comment.commentId}
      />
    </div>
  );
}

export function CommentThread({ targetType, targetId }: CommentThreadProps) {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, error, refetch, isRefetching } = useComments(
    targetType,
    targetId,
  );
  const createComment = useCreateComment(targetType, targetId);
  const deleteComment = useDeleteComment(targetType, targetId);
  const like = useLike('comment');
  const unlike = useUnlike('comment');
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentDto | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const comments = data?.data ?? [];
  const topLevel = comments.filter((comment) => comment.parentCommentId === null);
  const replies = (parentId: number) =>
    comments.filter((comment) => comment.parentCommentId === parentId);

  const submitTopLevel = () => {
    if (!draft.trim()) return;
    createComment.mutate(
      { targetType, targetId, content: draft.trim() },
      {
        onSuccess: () => {
          toast.success('Comment posted.');
          setDraft('');
        },
        onError: () => toast.error('Could not post the comment.'),
      },
    );
  };

  const submitReply = () => {
    if (!replyingTo || !replyDraft.trim()) return;
    createComment.mutate(
      { targetType, targetId, content: replyDraft.trim(), parentCommentId: replyingTo.commentId },
      {
        onSuccess: () => {
          toast.success('Reply posted.');
          setReplyDraft('');
          setReplyingTo(null);
        },
        onError: () => toast.error('Could not post the reply.'),
      },
    );
  };

  const handleDelete = (commentId: number) => {
    deleteComment.mutate(commentId, {
      onError: () => toast.error('Could not delete the comment.'),
    });
  };

  return (
    <section className="comment-thread" aria-label="Comments">
      <h2 className="comment-thread__heading">Comments</h2>

      {user ? (
        <div className="comment-thread__composer">
          <textarea
            className="comment-thread__textarea"
            placeholder="Share your thoughts…"
            rows={3}
            maxLength={2000}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="comment-thread__composer-actions">
            <Button size="sm" onClick={submitTopLevel} isLoading={createComment.isPending}>
              Post comment
            </Button>
          </div>
        </div>
      ) : (
        <p className="comment-thread__hint">
          <Icon name="users" size={14} /> Sign in to join the discussion.
        </p>
      )}

      {isError ? (
        <ErrorState
          title="Could not load comments"
          error={error}
          onRetry={() => void refetch()}
          retrying={isRefetching}
          compact
        />
      ) : isLoading ? (
        <CommentThreadSkeleton />
      ) : topLevel.length === 0 ? (
        <EmptyState title="No comments yet." icon="chat" className="py-6" />
      ) : (
        <ul className="comment-thread__list">
          {topLevel.map((comment) => (
            <li key={comment.commentId}>
              <CommentRow
                comment={comment}
                isReply={false}
                onReply={setReplyingTo}
                onLike={(id) => like.mutate(id)}
                onUnlike={(id) => unlike.mutate(id)}
                onDelete={handleDelete}
                isDeleting={
                  deleteComment.isPending && deleteComment.variables === comment.commentId
                }
              />
              {replies(comment.commentId).map((reply) => (
                <CommentRow
                  key={reply.commentId}
                  comment={reply}
                  isReply
                  onReply={setReplyingTo}
                  onLike={(id) => like.mutate(id)}
                  onUnlike={(id) => unlike.mutate(id)}
                  onDelete={handleDelete}
                  isDeleting={
                    deleteComment.isPending && deleteComment.variables === reply.commentId
                  }
                />
              ))}
            </li>
          ))}
        </ul>
      )}

      {replyingTo ? (
        <div className="comment-thread__reply-box">
          <p className="comment-thread__reply-target">
            Replying to {replyingTo.author.fullName ?? `User ${replyingTo.author.userId}`}
          </p>
          <textarea
            className="comment-thread__textarea"
            placeholder="Write a reply…"
            rows={2}
            maxLength={2000}
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
          />
          <div className="comment-thread__composer-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReplyingTo(null)}
              disabled={createComment.isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submitReply} isLoading={createComment.isPending}>
              Post reply
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default CommentThread;
