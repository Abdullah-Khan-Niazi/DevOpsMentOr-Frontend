import { useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  Button,
  Drawer,
  DrawerFormSkeleton,
  EmptyState,
  ErrorState,
  FieldError,
  SearchInput,
  Switch,
} from '@/shared/components';
import { getErrorMessage, hasCode } from '@/shared/services/apiError';
import { useAdminCourses } from '../../../hooks/useAdminCurriculum';
import { useAttachCourse } from '../../../hooks/useAdminTracks';

// Attaches an existing course to the track. Only courses not yet in the track are offered.

const MANAGE_PERMISSION = 'platform.curriculum.manage';
const FORM_ID = 'attach-course-form';

const attachSchema = z.object({
  courseId: z.number().int().min(1, 'Choose a course.'),
  required: z.boolean(),
});

type AttachFormValues = z.infer<typeof attachSchema>;

export interface AttachCourseDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Track id the course is attached to. */
  id: number | null;
  parentId?: number;
  onClose: () => void;
  /** Called with the attached course id; without it the drawer closes. */
  onCreated?: (id: number) => void;
}

export function AttachCourseDrawer({ open, id, onClose, onCreated }: AttachCourseDrawerProps) {
  const trackId = id ?? 0;
  const canManage = useAuthStore(
    (state) => state.user?.permissions?.includes(MANAGE_PERMISSION) ?? false,
  );
  const courses = useAdminCourses();
  const attach = useAttachCourse(trackId);
  const [query, setQuery] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AttachFormValues>({
    resolver: zodResolver(attachSchema),
    defaultValues: { courseId: 0, required: false },
  });
  const selectedCourseId = useWatch({ control, name: 'courseId' });

  const available = (courses.data ?? []).filter(
    (course) =>
      !course.trackIds.includes(trackId) &&
      (query.trim() === '' ||
        course.title.toLowerCase().includes(query.trim().toLowerCase()) ||
        course.slug.toLowerCase().includes(query.trim().toLowerCase())),
  );

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await attach.mutateAsync({ courseId: values.courseId, required: values.required });
      if (onCreated) onCreated(values.courseId);
      else handleClose();
    } catch (error) {
      if (hasCode(error, 'TRACK_CONTENT_EXISTS')) {
        setFormError('This course is already in the track.');
        void courses.refetch();
      } else if (hasCode(error, 'COURSE_NOT_FOUND')) {
        setFormError('This course no longer exists.');
        void courses.refetch();
      } else {
        setFormError(getErrorMessage(error));
      }
    }
  });

  const saving = attach.isPending;

  // Closing clears the search, the selection and the message; the next open starts fresh.
  function handleClose() {
    setQuery('');
    setFormError(null);
    reset({ courseId: 0, required: false });
    onClose();
  }

  let body: ReactNode;
  let formReady = false;
  if (courses.isPending) {
    body = <DrawerFormSkeleton fields={2} />;
  } else if (courses.isError) {
    body = <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />;
  } else {
    formReady = true;
    body = (
      <fieldset disabled={!canManage || saving} className="flex min-w-0 flex-col gap-4">
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <SearchInput label="Search courses" value={query} onValueChange={setQuery} />
          {available.length === 0 ? (
            <EmptyState
              title={query.trim() ? 'No courses match' : 'No courses left to attach'}
              icon="course"
            />
          ) : (
            <ul aria-label="Courses" className="flex flex-col gap-1">
              {available.map((course) => {
                const selected = selectedCourseId === course.courseId;
                return (
                  <li key={course.courseId}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      className={
                        selected
                          ? 'flex w-full items-center justify-between gap-3 rounded-md bg-pearl-200 px-3 py-2 text-left text-sm font-medium'
                          : 'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-pearl-200 focus-visible:bg-pearl-200 focus-visible:outline-none'
                      }
                      onClick={() =>
                        setValue('courseId', course.courseId, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      <span className="min-w-0 truncate">{course.title}</span>
                      <span className="shrink-0 font-mono text-xs text-muted">{course.slug}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <FieldError
            id="attach-course-course-error"
            message={errors.courseId?.message ?? formError}
          />
          <Controller
            name="required"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} label="Required" />
            )}
          />
        </form>
      </fieldset>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Attach course"
      dirty={isDirty && canManage}
      busy={saving}
      footer={(requestClose) => (
        <>
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Cancel
          </Button>
          {formReady && canManage ? (
            <Button
              type="submit"
              form={FORM_ID}
              isLoading={saving}
              isSuccess={attach.isSuccess && !saving}
            >
              Attach course
            </Button>
          ) : null}
        </>
      )}
    >
      {body}
    </Drawer>
  );
}

export default AttachCourseDrawer;
