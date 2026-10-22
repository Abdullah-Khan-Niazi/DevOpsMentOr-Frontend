import { useState } from 'react';
import { Button, Input } from '@/shared/components';
import { PublishToggle } from './PublishToggle';
import { useAdminTags } from '../hooks';
import type { ContentType, LessonDto } from '../types';

export interface LessonFormValues {
  title: string;
  contentType: ContentType;
  content: string;
  videoUrl: string;
  videoDurationSeconds: string;
  lessonOrder: string;
  tagIds: number[];
}

interface LessonFormProps {
  initial?: Partial<LessonDto> | null;
  moduleId?: number;
  saving: boolean;
  publishing?: boolean;
  onSubmit: (values: LessonFormValues) => void;
  onPublishToggle?: (isPublished: boolean) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const CONTENT_TYPE_OPTIONS: Array<{ value: ContentType; label: string; icon: string }> = [
  { value: 'text', label: 'Reading Theory', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
  { value: 'video', label: 'Video Lecture', icon: 'M22 8l-6 4 6 4V8z M2 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z' },
  { value: 'interactive', label: 'Slides & Walkthrough', icon: 'M2 3h20v14H2z M8 21h8 M12 17v4' },
  { value: 'lab', label: 'Hands-On Lab', icon: 'M4 17l6-6-6-6 M12 19h8' },
];

export function LessonForm({
  initial,
  moduleId: _moduleId,
  saving,
  publishing = false,
  onSubmit,
  onPublishToggle,
  onDelete,
  onCancel,
}: LessonFormProps) {
  const isEditing = Boolean(initial?.lessonId);
  const tagsQuery = useAdminTags();
  const allTags = tagsQuery.data ?? [];

  const [title, setTitle] = useState(initial?.title ?? '');
  const [contentType, setContentType] = useState<ContentType>(initial?.contentType ?? 'text');
  const [content, setContent] = useState(initial?.content ?? '');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(
    initial?.videoDurationSeconds ? String(initial.videoDurationSeconds) : '',
  );
  const [lessonOrder, setLessonOrder] = useState(
    initial?.lessonOrder ? String(initial.lessonOrder) : '1',
  );
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    initial?.tags ? initial.tags.map((t) => t.tagId) : [],
  );

  // Field-specific validation states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const validate = (): boolean => {
    let isValid = true;
    if (!title.trim() || title.trim().length < 3) {
      setTitleError('Lesson title must be at least 3 characters.');
      isValid = false;
    }
    if (contentType === 'video' && videoUrl.trim() && !/^https?:\/\/.+/.test(videoUrl.trim())) {
      setVideoUrlError('Video URL must start with http:// or https://');
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      contentType,
      content,
      videoUrl: videoUrl.trim(),
      videoDurationSeconds,
      lessonOrder,
      tagIds: selectedTagIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {/* Header Publish Status (if editing) */}
      {isEditing && initial?.isPublished !== undefined && onPublishToggle && (
        <div className="flex items-center justify-between p-3 rounded-md border border-border bg-paper/40">
          <div>
            <p className="text-xs font-mono font-semibold text-card-foreground">Publication State</p>
            <p className="text-[11px] text-muted">
              {initial.isPublished ? 'Visible to enrolled learners' : 'Draft mode (hidden from learners)'}
            </p>
          </div>
          <PublishToggle
            isPublished={initial.isPublished}
            label={title || 'Lesson'}
            busy={publishing}
            onPublish={() => onPublishToggle(true)}
            onUnpublish={() => onPublishToggle(false)}
          />
        </div>
      )}

      {/* Lesson Title */}
      <Input
        label="Lesson Title"
        value={title}
        error={titleError ?? undefined}
        onChange={(e) => {
          setTitle(e.target.value);
          if (titleError) setTitleError(null);
        }}
        placeholder="e.g. Multi-Stage Build Optimization with BuildKit"
        minLength={3}
        required
      />

      {/* Format / Content Type Selector */}
      <div className="space-y-1.5">
        <label className="input-label block">Lesson Format</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CONTENT_TYPE_OPTIONS.map((opt) => {
            const isSelected = contentType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setContentType(opt.value)}
                className={`p-2.5 rounded-sm text-left border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/10 shadow-xs ring-1 ring-brand-600/30'
                    : 'border-border bg-card/40 hover:bg-surface hover:border-card-foreground/30'
                }`}
              >
                <svg
                  className={`w-4 h-4 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-muted'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={opt.icon} />
                </svg>
                <span className="text-xs font-mono font-semibold text-card-foreground leading-tight">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Lecture Fields */}
      {contentType === 'video' && (
        <div className="space-y-3 p-3.5 rounded-md border border-border bg-paper/30">
          <Input
            label="Video Stream URL (HLS / MP4)"
            value={videoUrl}
            error={videoUrlError ?? undefined}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              if (videoUrlError) setVideoUrlError(null);
            }}
            placeholder="https://cdn.devopsmentor.io/videos/lesson.mp4"
            type="url"
          />
          <Input
            label="Estimated Duration (Seconds)"
            value={videoDurationSeconds}
            onChange={(e) => setVideoDurationSeconds(e.target.value)}
            placeholder="e.g. 640"
            type="number"
            min={0}
          />
        </div>
      )}

      {/* Content / Markdown Body */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="lesson-body-area" className="input-label">
            {contentType === 'interactive'
              ? 'Slides & Walkthrough Script (Markdown)'
              : contentType === 'lab'
                ? 'Lab Brief & Instructions (Markdown)'
                : 'Lesson Theory & Architecture (Markdown)'}
          </label>
          <span className="text-[10px] font-mono text-muted">Supports Markdown</span>
        </div>
        <textarea
          id="lesson-body-area"
          rows={9}
          className="input-field w-full font-mono text-xs leading-relaxed resize-y"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            contentType === 'interactive'
              ? '<!-- slide -->\n## Architecture Overview\nWalkthrough slide content.\n<!-- slide -->\n## Implementation Details'
              : 'Write lesson theory, architecture diagrams, and production best practices.'
          }
        />
      </div>

      {/* Skills / Tags and Sequence Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Sequence Order"
          type="number"
          min={1}
          value={lessonOrder}
          onChange={(e) => setLessonOrder(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="input-label block">Target Skills & Tags</label>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 rounded-md border border-border bg-paper/40">
            {allTags.map((tag) => {
              const selected = selectedTagIds.includes(tag.tagId);
              return (
                <button
                  key={tag.tagId}
                  type="button"
                  onClick={() => toggleTag(tag.tagId)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-ink text-pearl-100 border-ink font-semibold'
                      : 'bg-card/60 text-muted border-border hover:border-card-foreground'
                  }`}
                >
                  #{tag.tagName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
        {isEditing && onDelete ? (
          <Button variant="danger" size="sm" type="button" onClick={onDelete}>
            Delete Lesson
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={saving}>
            {isEditing ? 'Save Lesson' : 'Create Lesson'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default LessonForm;
