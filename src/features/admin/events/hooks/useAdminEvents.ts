import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminEventService } from '../services';

export function useAdminEvents() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: Parameters<typeof adminEventService.createEvent>[0]) =>
      adminEventService.createEvent(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminEvents.listPrefix }),
  });

  const update = useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: number;
      payload: Parameters<typeof adminEventService.updateEvent>[1];
    }) => adminEventService.updateEvent(eventId, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminEvents.listPrefix }),
  });

  return { create, update };
}

export function useAdminEventAttendees(eventId: number, page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.adminEvents.attendees(eventId),
    queryFn: () => adminEventService.listAttendees(eventId, page, 25),
    retry: false,
  });
}
