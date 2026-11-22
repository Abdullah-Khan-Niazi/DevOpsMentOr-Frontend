import { refreshAccessToken } from '@/shared/services';
import { authService } from '../services';
import { useAuthStore } from '../stores/authStore';
import type { AuthUser } from '../types';

/**
 * Re-mint the access token from the refresh cookie and reload the identity.
 * Used after a mutation that changes the caller's roles (create organization,
 * join a class, accept an invitation) and by the boot-time silent refresh.
 * Roles and permissions are embedded in the JWT, so updating only the client
 * store would leave the API denying the workspace the user just entered.
 *
 * Returns true only when both the token and the display identity are fresh.
 * On failure the caller stays on the personal surface; the server remains the
 * authorization source.
 */
export async function refreshAuthSession(): Promise<boolean> {
  const accessToken = await refreshAccessToken();
  if (!accessToken) {
    return false;
  }

  try {
    const freshMe = await authService.getMe();
    const current = useAuthStore.getState().user;

    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...freshMe,
        userId: current?.userId ?? freshMe.userId,
        username: freshMe.username || current?.username || '',
        status: freshMe.status || current?.status || 'active',
      } as AuthUser,
    });

    return true;
  } catch {
    // The rotated token already carries the new claims. Do not route into a
    // workspace whose frontend guard still sees the old identity; the next
    // session validation reconciles it.
    return false;
  }
}
