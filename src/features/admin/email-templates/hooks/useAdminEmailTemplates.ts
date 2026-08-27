import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants';
import { adminEmailTemplateService } from '../services';

export function useAdminEmailTemplates() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEYS.adminEmailTemplates.list,
    queryFn: () => adminEmailTemplateService.listTemplates(),
    retry: false,
  });

  const update = useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: number;
      payload: Parameters<typeof adminEmailTemplateService.updateTemplate>[1];
    }) => adminEmailTemplateService.updateTemplate(templateId, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminEmailTemplates.list }),
  });

  const preview = useMutation({
    mutationFn: (templateId: number) => adminEmailTemplateService.previewTemplate(templateId),
  });

  return { query, update, preview };
}
