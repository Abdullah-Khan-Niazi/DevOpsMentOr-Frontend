/** F8 §05 admin announcement contracts (OPS-21..23, SCR-F8-09). */

export type AnnouncementType = 'general' | 'maintenance' | 'feature' | 'security' | 'event';
export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AdminAnnouncementDto {
  announcementId: number;
  title: string;
  content: string;
  announcementType: AnnouncementType;
  priority: AnnouncementPriority;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  announcementType: AnnouncementType;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  content?: string;
  announcementType?: AnnouncementType;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}
