import { useLogout } from '../hooks';
import { Button } from '@/shared/components';

export function LogoutButton() {
  const logout = useLogout();

  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={logout.isPending}
      disabled={logout.isPending}
      onClick={() => logout.mutate()}
      aria-label="Log out"
    >
      Log out
    </Button>
  );
}
