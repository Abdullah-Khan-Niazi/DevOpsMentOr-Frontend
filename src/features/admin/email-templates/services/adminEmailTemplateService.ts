import { apiClient } from '@/shared/services';
import type {
  EmailTemplateDto,
  EmailTemplatePreviewDto,
  UpdateEmailTemplatePayload,
} from '../types';

function unwrap<T>(envelope: { data: T }): T {
  return envelope.data;
}

/** F8 §07 admin email-template endpoints (OPS-35..37, SCR-F8-13). */
export const adminEmailTemplateService = {
  /** OPS-35: list all templates. */
  async listTemplates(): Promise<EmailTemplateDto[]> {
    const { data } = await apiClient.get<{ data: EmailTemplateDto[] }>('/admin/email-templates');
    return unwrap(data);
  },

  /** OPS-36: update a template (subject min 5 chars, body_html required). */
  async updateTemplate(
    templateId: number,
    payload: UpdateEmailTemplatePayload,
  ): Promise<EmailTemplateDto> {
    const { data } = await apiClient.patch<{ data: EmailTemplateDto }>(
      `/admin/email-templates/${templateId}`,
      payload,
    );
    return unwrap(data);
  },

  /** OPS-37: render a preview with placeholder substitution. */
  async previewTemplate(templateId: number): Promise<EmailTemplatePreviewDto> {
    const { data } = await apiClient.post<{ data: EmailTemplatePreviewDto }>(
      `/admin/email-templates/${templateId}/preview`,
    );
    return unwrap(data);
  },
};

export default adminEmailTemplateService;
