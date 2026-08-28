import '../styles/email-templates-admin.css';
import { useState } from 'react';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  toast,
} from '@/shared/components';
import { useAdminEmailTemplates } from '../hooks/useAdminEmailTemplates';
import type { EmailTemplateDto } from '../types';

// SCR-F8-13: email template editor — subject/body editing with a rendered
// HTML preview modal. Validation: subject min 5 chars, body_html required.

interface EditState {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  isActive: boolean;
}

export function AdminEmailTemplatesPage() {
  const { query, update, preview } = useAdminEmailTemplates();
  const [editing, setEditing] = useState<EmailTemplateDto | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const startEdit = (template: EmailTemplateDto) => {
    setEditing(template);
    setEdit({
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText ?? '',
      isActive: template.isActive,
    });
  };

  const handleSave = () => {
    if (!editing || !edit) return;
    if (edit.subject.trim().length < 5) {
      toast.error('Subject must be at least 5 characters.');
      return;
    }
    if (!edit.bodyHtml.trim()) {
      toast.error('HTML body is required.');
      return;
    }
    update.mutate(
      {
        templateId: editing.templateId,
        payload: {
          subject: edit.subject.trim(),
          bodyHtml: edit.bodyHtml,
          bodyText: edit.bodyText.trim() || null,
          isActive: edit.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success('Template saved.');
          setEditing(null);
          setEdit(null);
        },
        onError: () => toast.error('Could not save the template.'),
      },
    );
  };

  const handlePreview = () => {
    if (!editing) return;
    preview.mutate(editing.templateId, {
      onSuccess: () => setPreviewOpen(true),
      onError: () => toast.error('Could not render the preview.'),
    });
  };

  return (
    <div className="email-templates-admin-page">
      <PageHeader
        title="Email templates"
        description="Edit transactional email templates used by notifications."
      />

      {query.isError ? (
        <ErrorState title="Could not load templates" message="Please try again later." />
      ) : query.isLoading ? (
        <LoadingState />
      ) : (
        <div className="email-templates-admin-page__list">
          {query.data?.map((template) => (
            <Card key={template.templateId} className="email-templates-admin-page__item">
              <div className="email-templates-admin-page__item-head">
                <h3 className="email-templates-admin-page__item-title">{template.name}</h3>
                <span className="email-templates-admin-page__item-key">{template.templateKey}</span>
              </div>
              <p className="email-templates-admin-page__item-subject">
                Subject: {template.subject}
              </p>
              <p className="email-templates-admin-page__item-meta">
                {template.placeholders?.length
                  ? `Placeholders: ${template.placeholders.join(', ')}`
                  : 'No placeholders'}
                {' · '}
                {template.isActive ? 'Active' : 'Inactive'} · Updated{' '}
                {new Date(template.updatedAt).toLocaleDateString()}
              </p>
              <div className="email-templates-admin-page__item-actions">
                <Button variant="secondary" size="sm" onClick={() => startEdit(template)}>
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && edit ? (
        <Modal open title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="email-templates-admin-page__editor">
            <Input
              label="Subject"
              value={edit.subject}
              onChange={(event) => setEdit({ ...edit, subject: event.target.value })}
              maxLength={160}
            />
            <label className="email-templates-admin-page__field">
              <span className="email-templates-admin-page__label">HTML body</span>
              <textarea
                className="email-templates-admin-page__textarea email-templates-admin-page__textarea--mono"
                rows={10}
                value={edit.bodyHtml}
                onChange={(event) => setEdit({ ...edit, bodyHtml: event.target.value })}
              />
            </label>
            <label className="email-templates-admin-page__field">
              <span className="email-templates-admin-page__label">Plain-text body</span>
              <textarea
                className="email-templates-admin-page__textarea"
                rows={4}
                value={edit.bodyText}
                onChange={(event) => setEdit({ ...edit, bodyText: event.target.value })}
              />
            </label>
            <label className="email-templates-admin-page__check">
              <input
                type="checkbox"
                checked={edit.isActive}
                onChange={(event) => setEdit({ ...edit, isActive: event.target.checked })}
              />
              <span>Active (dispatchable)</span>
            </label>
            <div className="email-templates-admin-page__actions">
              <Button variant="secondary" onClick={handlePreview}>
                Preview
              </Button>
              <Button onClick={handleSave} isLoading={update.isPending}>
                Save template
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      <Modal open={previewOpen} title="Template preview" onClose={() => setPreviewOpen(false)}>
        {preview.data ? (
          <div className="email-templates-admin-page__preview">
            <p className="email-templates-admin-page__preview-subject">{preview.data.subject}</p>
            <div
              className="email-templates-admin-page__preview-html"
              dangerouslySetInnerHTML={{ __html: preview.data.bodyHtml }}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default AdminEmailTemplatesPage;
