import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminFileService } from '../services';

export function useAdminFiles(page = 1) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminFiles.list(String(page)),
    queryFn: () => adminFileService.listFiles(page, 25),
    retry: false,
  });

  const upload = useMutation({
    mutationFn: ({ file, isPublic }: { file: File; isPublic: boolean }) =>
      adminFileService.uploadFile(file, isPublic),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminFiles.listPrefix }),
  });

  return { query, upload };
}
