import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { operationsService } from '../services';
import type { EventDto } from '../types';

export function useEvents(page = 1, upcomingOnly = true) {
  return useQuery({
    queryKey: QUERY_KEYS.events.list(page, upcomingOnly),
    queryFn: () => operationsService.listEvents(page, 12, upcomingOnly),
    retry: false,
  });
}

export function useRegisterEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => operationsService.register(eventId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.listPrefix }),
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: number) => operationsService.cancelRegistration(eventId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.listPrefix }),
  });
}

export function useFileDownload() {
  return useMutation({
    mutationFn: (fileId: number) => operationsService.getDownloadUrl(fileId),
  });
}

export type { EventDto };
