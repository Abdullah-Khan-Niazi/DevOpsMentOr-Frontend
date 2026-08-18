import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminAnnouncementService } from '../services';

export function useAdminAnnouncements() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminNotifications.announcements,
    queryFn: () => adminAnnouncementService.listAnnouncements(),
    retry: false,
  });

  const create = useMutation({
    mutationFn: (payload: Parameters<typeof adminAnnouncementService.createAnnouncement>[0]) =>
      adminAnnouncementService.createAnnouncement(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNotifications.announcements }),
  });

  const update = useMutation({
    mutationFn: ({
      announcementId,
      payload,
    }: {
      announcementId: number;
      payload: Parameters<typeof adminAnnouncementService.updateAnnouncement>[1];
    }) => adminAnnouncementService.updateAnnouncement(announcementId, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNotifications.announcements }),
  });

  const publish = useMutation({
    mutationFn: (announcementId: number) =>
      adminAnnouncementService.publishAnnouncement(announcementId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminNotifications.announcements }),
  });

  return { query, create, update, publish };
}
