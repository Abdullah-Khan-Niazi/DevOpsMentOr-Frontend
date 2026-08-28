/** F8 §05 admin email-template contracts (OPS-35..37, SCR-F8-13). */

export interface EmailTemplateDto {
  templateId: number;
  templateKey: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  placeholders: string[] | null;
  isActive: boolean;
  updatedAt: string;
}

export interface EmailTemplatePreviewDto {
  templateId: number;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
}

export interface UpdateEmailTemplatePayload {
  subject?: string;
  bodyHtml?: string;
  bodyText?: string | null;
  isActive?: boolean;
}
