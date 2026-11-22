import '../styles/announcements-admin.css';
import { useState } from 'react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  PageHeader,
  toast,
} from '@/shared/components';
import { AdminAnnouncementsSkeleton } from './AdminAnnouncementsSkeleton';
import { useAdminAnnouncements } from '../hooks/useAdminAnnouncements';
import type { AdminAnnouncementDto, AnnouncementPriority, AnnouncementType } from '../types';

// SCR-F8-09: admin announcement publishing - draft form plus a list with
// update/publish actions. Every mutation writes an audit row server-side.

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  'general',
  'maintenance',
  'feature',
  'security',
  'event',
];
const PRIORITIES: AnnouncementPriority[] = ['low', 'medium', 'high', 'critical'];

const TYPE_LABEL: Record<AnnouncementType, string> = {
  general: 'General',
  maintenance: 'Maintenance',
  feature: 'Feature',
  security: 'Security',
  event: 'Event',
};

const PRIORITY_LABEL: Record<AnnouncementPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '-';
}

export function AdminAnnouncementsPage() {
  const { query, create, update, publish } = useAdminAnnouncements();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcementType, setAnnouncementType] = useState<AnnouncementType>('general');
  const [priority, setPriority] = useState<AnnouncementPriority>('medium');
  const [expiresAt, setExpiresAt] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setAnnouncementType('general');
    setPriority('medium');
    setExpiresAt('');
    setEditingId(null);
  };

  const startEdit = (announcement: AdminAnnouncementDto) => {
    setEditingId(announcement.announcementId);
    setTitle(announcement.title);
    setContent(announcement.content);
    setAnnouncementType(announcement.announcementType);
    setPriority(announcement.priority);
    setExpiresAt(announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : '');
  };

  const handleSubmit = () => {
    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters.');
      return;
    }
    if (content.trim().length < 5) {
      toast.error('Content must be at least 5 characters.');
      return;
    }
    const payload = {
      title: title.trim(),
      content: content.trim(),
      announcementType,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };
    if (editingId !== null) {
      update.mutate(
        { announcementId: editingId, payload },
        {
          onSuccess: () => {
            toast.success('Announcement updated.');
            resetForm();
          },
          onError: () => toast.error('Could not update the announcement.'),
        },
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success('Announcement draft created.');
          resetForm();
        },
        onError: () => toast.error('Could not create the announcement.'),
      });
    }
  };

  const handlePublish = (announcement: AdminAnnouncementDto) => {
    publish.mutate(announcement.announcementId, {
      onSuccess: () => toast.success(`"${announcement.title}" published.`),
      onError: () => toast.error('Could not publish the announcement.'),
    });
  };

  return (
    <div className="announcements-admin-page">
      <PageHeader title="Announcements" />

      <Card className="announcements-admin-page__form">
        <h2 className="announcements-admin-page__form-title">
          {editingId !== null ? 'Edit announcement' : 'New announcement'}
        </h2>
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
        />
        <label className="announcements-admin-page__field">
          <span className="announcements-admin-page__label">Content</span>
          <textarea
            className="announcements-admin-page__textarea"
            rows={4}
            maxLength={2000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <div className="announcements-admin-page__row">
          <label className="announcements-admin-page__field">
            <span className="announcements-admin-page__label">Type</span>
            <select
              className="announcements-admin-page__select"
              value={announcementType}
              onChange={(event) => setAnnouncementType(event.target.value as AnnouncementType)}
            >
              {ANNOUNCEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="announcements-admin-page__field">
            <span className="announcements-admin-page__label">Priority</span>
            <select
              className="announcements-admin-page__select"
              value={priority}
              onChange={(event) => setPriority(event.target.value as AnnouncementPriority)}
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="announcements-admin-page__field">
            <span className="announcements-admin-page__label">Expires at (optional)</span>
            <input
              type="datetime-local"
              className="announcements-admin-page__select"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </label>
        </div>
        <div className="announcements-admin-page__form-actions">
          {editingId !== null ? (
            <Button variant="secondary" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
          <Button onClick={handleSubmit} isLoading={create.isPending || update.isPending}>
            {editingId !== null ? 'Save changes' : 'Create draft'}
          </Button>
        </div>
      </Card>

      {query.isError ? (
        <ErrorState
          title="Could not load announcements"
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      ) : query.isLoading ? (
        <AdminAnnouncementsSkeleton />
      ) : (
        <div className="announcements-admin-page__list">
          {query.data?.length === 0 ? (
            <EmptyState icon="megaphone" title="No announcements yet" />
          ) : null}
          {query.data?.map((announcement) => (
            <Card key={announcement.announcementId} className="announcements-admin-page__item">
              <div className="announcements-admin-page__item-head">
                <h3 className="announcements-admin-page__item-title">{announcement.title}</h3>
                <span
                  className="announcements-admin-page__item-status"
                  data-published={announcement.isPublished}
                >
                  <Icon name={announcement.isPublished ? 'check-circle' : 'edit'} size={16} />
                  {announcement.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="announcements-admin-page__item-content">{announcement.content}</p>
              <p className="announcements-admin-page__item-meta">
                <span>{TYPE_LABEL[announcement.announcementType]}</span>
                <span>{PRIORITY_LABEL[announcement.priority]}</span>
                <span>Created {formatDate(announcement.createdAt)}</span>
                <span>Published {formatDate(announcement.publishedAt)}</span>
              </p>
              <div className="announcements-admin-page__item-actions">
                <Button variant="secondary" size="sm" onClick={() => startEdit(announcement)}>
                  Edit
                </Button>
                {!announcement.isPublished ? (
                  <Button
                    size="sm"
                    onClick={() => handlePublish(announcement)}
                    isLoading={
                      publish.isPending && publish.variables === announcement.announcementId
                    }
                    disabled={publish.isPending}
                  >
                    Publish
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminAnnouncementsPage;
