import { Button, toast } from '@/shared/components';
import { useFollow } from '../hooks';

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
  isOwn: boolean;
}

export function FollowButton({ userId, isFollowing, isOwn }: FollowButtonProps) {
  const { follow, unfollow } = useFollow(userId);

  if (isOwn) {
    return null;
  }

  const pending = follow.isPending || unfollow.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollow.mutate(undefined, {
        onSuccess: () => toast.success('Unfollowed'),
        onError: (error) => toast.error(error.message),
      });
    } else {
      follow.mutate(undefined, {
        onSuccess: () => toast.success('Now following'),
        onError: (error) => toast.error(error.message),
      });
    }
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? 'secondary' : 'primary'}
      size="sm"
      isLoading={pending}
      onClick={handleClick}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}

export default FollowButton;
