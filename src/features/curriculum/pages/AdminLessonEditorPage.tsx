import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { PublishToggle } from '../components/PublishToggle';
import { useAdminLessonEditor, useAdminTags } from '../hooks';
import type { ContentType } from '../types';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: 'Text',
  video: 'Video',
  interactive: 'Interactive',
  lab: 'Lab',
};

/** F4 SCR-F4-03: lesson editor, create (POST) and edit (PATCH) flows. */
export function AdminLessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const moduleIdForCreate = searchParams.get('moduleId');
  const navigate = useNavigate();

  const isEditing = Boolean(lessonId);
  const editor = useAdminLessonEditor(lessonId ?? '', isEditing);
  const tagsQuery = useAdminTags();

  const lesson = isEditing ? editor.query.data : null;

  const [title, setTitle] = useState(lesson?.title ?? '');
  const [contentType, setContentType] = useState<ContentType>(lesson?.contentType ?? 'text');
  const [content, setContent] = useState(lesson?.content ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? '');
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(
    lesson?.videoDurationSeconds ? String(lesson.videoDurationSeconds) : '',
  );
  const [lessonOrder, setLessonOrder] = useState(lesson ? String(lesson.lessonOrder) : '1');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    lesson ? lesson.tags.map((tag) => tag.tagId) : [],
  );

  const submitting = isEditing ? editor.update.isPending : editor.createForModule.isPending;
  const publishBusy = editor.publish.isPending;

  const validate = (): string | null => {
    if (!title.trim() || title.trim().length < 3) {
      return 'Lesson title must be at least 3 characters.';
    }
    if (contentType === 'video' && videoUrl.trim() && !/^https?:\/\/.+/.test(videoUrl.trim())) {
      return 'Video URL must start with http:// or https://';
    }
    if (lessonOrder && Number(lessonOrder) < 1) {
      return 'Lesson order must be at least 1.';
    }
    return null;
  };

  const save = () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const payload = {
      title: title.trim(),
      contentType,
      content: content.trim() || null,
      videoUrl: videoUrl.trim() || null,
      videoDurationSeconds: videoDurationSeconds ? Number(videoDurationSeconds) : null,
      lessonOrder: lessonOrder ? Number(lessonOrder) : undefined,
      tagIds: selectedTagIds,
    };

    if (isEditing && lesson) {
      editor.update.mutate(payload, {
        onSuccess: () => toast.success('Lesson saved.'),
        onError: (error) => toast.error(error.message),
      });
    }
  };

  const create = () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!moduleIdForCreate) {
      toast.error('Missing module. Go back to the module editor to add a lesson.');
      return;
    }
    editor.createForModule.mutate(
      {
        moduleId: Number(moduleIdForCreate),
        data: {
          title: title.trim(),
          contentType,
          content: content.trim() || undefined,
          videoUrl: videoUrl.trim() || null,
          videoDurationSeconds: videoDurationSeconds ? Number(videoDurationSeconds) : null,
          lessonOrder: lessonOrder ? Number(lessonOrder) : 1,
          tagIds: selectedTagIds,
        },
      },
      {
        onSuccess: (created) => {
          toast.success('Lesson created.');
          navigate(ROUTES.ADMIN_CURRICULUM_LESSON.replace(':lessonId', String(created.lessonId)));
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (isEditing && editor.query.isLoading) {
    return (
      <div>
        <PageHeader title="Lesson editor" />
        <LoadingState label="Loading lesson…" />
      </div>
    );
  }

  if (isEditing && (editor.query.isError || !editor.query.data)) {
    return (
      <div>
        <PageHeader title="Lesson editor" />
        <ErrorState
          message={editor.query.error?.message ?? 'Unable to load this lesson.'}
          onRetry={() => void editor.query.refetch()}
        />
      </div>
    );
  }

  const backPath = isEditing
    ? ROUTES.ADMIN_CURRICULUM_MODULE.replace(':moduleId', String(lesson?.moduleId ?? ''))
    : ROUTES.ADMIN_CURRICULUM;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={isEditing ? 'Lesson editor' : 'New lesson'}
        description={isEditing ? lesson?.title : 'Fill in the lesson details.'}
        actions={
          <Button variant="ghost" onClick={() => navigate(backPath)}>
            Back to module
          </Button>
        }
      />

      <Card className="space-y-4 p-6">
        <Input
          label="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Running your first container"
          minLength={3}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lesson-content-type" className="input-label">
              Content type
            </label>
            <select
              id="lesson-content-type"
              className="input-field w-full"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
            >
              {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Order"
            type="number"
            min={1}
            value={lessonOrder}
            onChange={(e) => setLessonOrder(e.target.value)}
            required
          />
        </div>

        {contentType === 'video' ? (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Video URL"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://…"
            />
            <Input
              label="Duration (seconds)"
              type="number"
              min={1}
              max={86400}
              value={videoDurationSeconds}
              onChange={(e) => setVideoDurationSeconds(e.target.value)}
            />
          </div>
        ) : null}

        <div>
          <p className="input-label">Tags</p>
          {tagsQuery.isLoading ? (
            <div className="h-8 rounded-md bg-border" />
          ) : tagsQuery.isError || !tagsQuery.data ? (
            <p className="text-sm text-muted">Unable to load tags.</p>
          ) : tagsQuery.data.length === 0 ? (
            <p className="text-sm text-muted">No tags available yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3 rounded-lg border border-border p-3">
              {tagsQuery.data.map((tag) => {
                const checked = selectedTagIds.includes(tag.tagId);
                return (
                  <label key={tag.tagId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedTagIds((ids) =>
                          checked ? ids.filter((id) => id !== tag.tagId) : [...ids, tag.tagId],
                        )
                      }
                      className="h-4 w-4 accent-brand-600"
                    />
                    <span className="text-card-foreground">{tag.tagName}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="lesson-content" className="input-label">
            Content
          </label>
          <textarea
            id="lesson-content"
            rows={12}
            className="input-field w-full font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Lesson body. Plain text paragraphs, one per line."
          />
        </div>

        {isEditing && lesson ? (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted">{lesson.isPublished ? 'Published' : 'Draft'}</span>
            <PublishToggle
              isPublished={lesson.isPublished}
              label={lesson.title}
              busy={publishBusy}
              onPublish={() =>
                editor.publish.mutate(undefined, {
                  onSuccess: () => toast.success('Lesson published.'),
                  onError: (error) => toast.error(error.message),
                })
              }
              onUnpublish={() =>
                editor.update.mutate(
                  { isPublished: false },
                  {
                    onSuccess: () => toast.success('Lesson unpublished.'),
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
            />
          </div>
        ) : null}

        <div className="flex justify-end border-t border-border pt-4">
          <Button onClick={isEditing ? save : create} isLoading={submitting}>
            {isEditing ? 'Save lesson' : 'Create lesson'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default AdminLessonEditorPage;
