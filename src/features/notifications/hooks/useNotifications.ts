import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { notificationService } from '../services';

export function useInbox(page = 1, unreadOnly = false) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.inbox(page, unreadOnly),
    queryFn: () => notificationService.getInbox(page, 20, unreadOnly),
    retry: false,
  });
}

/** SCR-F8-01 bell badge: newest-unread probe for the unread count badge. */
export function useUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.unreadCount,
    queryFn: () => notificationService.getInbox(1, 1, true),
    select: (inbox) => inbox.unreadCount,
    retry: false,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => notificationService.markRead(notificationId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.inboxPrefix }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.inboxPrefix }),
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => notificationService.dismiss(notificationId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.inboxPrefix }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.preferences,
    queryFn: () => notificationService.getPreferences(),
    retry: false,
  });
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof notificationService.updatePreference>[0]) =>
      notificationService.updatePreference(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.preferences }),
  });
}

export function usePublishedAnnouncements() {
  return useQuery({
    queryKey: QUERY_KEYS.announcements.published,
    queryFn: () => notificationService.listAnnouncements(),
    retry: false,
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: number) =>
      notificationService.markAnnouncementRead(announcementId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements.published }),
  });
}
