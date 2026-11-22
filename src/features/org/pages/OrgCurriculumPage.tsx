import { useState, type FormEvent } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  PageHeader,
  Select,
  Switch,
  Tree,
  TreeItem,
  TreeSkeleton,
  toast,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { formatDuration, pluralize } from '@/shared/utils';
import { ItemKindIcon } from '@/features/curriculum/components/learn/ItemKindIcon';
import {
  useLearnCourseModules,
  useLearnCourses,
  useLearnModuleItems,
} from '@/features/curriculum/hooks';
import type { LearnerCourseDto, ModuleDto, ModuleItemDto } from '@/features/curriculum/types';
import { useClassAssignments, useCreateAssignment } from '../hooks/useAssignments';
import { useOrgClasses } from '../hooks';
import { OrgCurriculumPageSkeleton } from './OrgCurriculumPageSkeleton';

const noop = () => undefined;

/** Learner page for a module item by kind (labs and quizzes keep their own routes). */
function itemRoute(item: ModuleItemDto): string | null {
  if (item.kind === 'lab') {
    return item.lab
      ? `${generatePath(ROUTES.LEARN_LAB, { labId: String(item.lab.labId) })}?itemId=${item.itemId}`
      : null;
  }
  if (item.kind === 'quiz') {
    return item.quiz ? generatePath(ROUTES.LEARN_QUIZ, { quizId: String(item.quiz.quizId) }) : null;
  }
  return generatePath(ROUTES.LEARN_LESSON, { lessonId: String(item.itemId) });
}

/** Kind specific meta: lab step count, quiz questions with passing score, lesson minutes. */
function itemMeta(item: ModuleItemDto): string {
  const parts: string[] = [];
  if (item.kind === 'lab' && item.lab) {
    parts.push(pluralize(item.lab.stepCount, 'step', 'steps'));
  }
  if (item.kind === 'quiz' && item.quiz) {
    parts.push(pluralize(item.quiz.questionCount, 'question', 'questions'));
    parts.push(`Pass ${item.quiz.passingScore}%`);
  }
  if (item.kind === 'lesson') {
    const duration = formatDuration({ seconds: item.videoDurationSeconds ?? 0 });
    if (duration) parts.push(duration);
  }
  return parts.join(' · ');
}

interface ItemNodeProps {
  item: ModuleItemDto;
  onPreview: (route: string) => void;
}

function ItemNode({ item, onPreview }: ItemNodeProps) {
  const route = itemRoute(item);
  const meta = itemMeta(item);

  return (
    <TreeItem
      id={`org-curriculum-item-${item.itemId}`}
      level={3}
      label={
        <span className="flex min-w-0 items-center gap-2">
          <ItemKindIcon kind={item.kind} contentType={item.contentType} size={18} />
          <span className="truncate">{item.title}</span>
        </span>
      }
      meta={meta || undefined}
      expandable={false}
      open={false}
      onToggle={noop}
      actions={
        route ? (
          <IconButton
            icon="visibility"
            label={`Preview ${item.title}`}
            size="sm"
            onClick={() => onPreview(route)}
          />
        ) : undefined
      }
    />
  );
}

interface ModuleNodeProps {
  module: ModuleDto;
  onPreview: (route: string) => void;
}

/** One module row; its items load the first time it is expanded. */
function ModuleNode({ module, onPreview }: ModuleNodeProps) {
  const [open, setOpen] = useState(false);
  const items = useLearnModuleItems(module.moduleId, open);
  const sortedItems = [...(items.data ?? [])].sort((a, b) => a.position - b.position);
  const minutes = formatDuration({ minutes: module.estimatedMinutes });

  return (
    <TreeItem
      id={`org-curriculum-module-${module.moduleId}`}
      level={2}
      label={module.title}
      meta={minutes || undefined}
      icon="module"
      expandable
      open={open}
      onToggle={() => setOpen((value) => !value)}
      loading={open && items.isPending}
      error={open && items.isError ? items.error : undefined}
      onRetry={() => void items.refetch()}
      actions={
        <IconButton
          icon="visibility"
          label={`Preview ${module.title}`}
          size="sm"
          onClick={() =>
            onPreview(generatePath(ROUTES.LEARN_MODULE, { moduleId: String(module.moduleId) }))
          }
        />
      }
    >
      {sortedItems.map((item) => (
        <ItemNode key={item.itemId} item={item} onPreview={onPreview} />
      ))}
    </TreeItem>
  );
}

interface CourseNodeProps {
  course: LearnerCourseDto;
  onPreview: (route: string) => void;
  onAssign: (course: LearnerCourseDto) => void;
}

/** One course row; its modules load the first time it is expanded. */
function CourseNode({ course, onPreview, onAssign }: CourseNodeProps) {
  const [open, setOpen] = useState(false);
  const modules = useLearnCourseModules(course.courseId, open);

  return (
    <TreeItem
      id={`org-curriculum-course-${course.courseId}`}
      level={1}
      label={course.title}
      meta={`${pluralize(course.moduleCount, 'module', 'modules')} · ${pluralize(course.itemCount, 'item', 'items')}`}
      icon="course"
      expandable
      open={open}
      onToggle={() => setOpen((value) => !value)}
      loading={open && modules.isPending}
      error={open && modules.isError ? modules.error : undefined}
      onRetry={() => void modules.refetch()}
      actions={
        <>
          <IconButton
            icon="visibility"
            label={`Preview ${course.title}`}
            size="sm"
            onClick={() =>
              onPreview(generatePath(ROUTES.LEARN_COURSE, { courseId: String(course.courseId) }))
            }
          />
          <Button size="sm" variant="secondary" onClick={() => onAssign(course)}>
            Assign to class
          </Button>
        </>
      }
    >
      {(modules.data ?? []).map((module) => (
        <ModuleNode key={module.moduleId} module={module} onPreview={onPreview} />
      ))}
    </TreeItem>
  );
}

interface AssignDraft {
  course: LearnerCourseDto;
  classId: string;
  dueDate: string;
  isRequired: boolean;
}

const FORM_ID = 'org-curriculum-assign-form';

/**
 * Read-only curriculum for org staff. Courses, modules and items load lazily from the
 * learner outline reads (premium outlines are listed). The only write is assigning a
 * course to a class, through the shared Drawer.
 */
export function OrgCurriculumPage() {
  const navigate = useNavigate();
  const courses = useLearnCourses();
  const classes = useOrgClasses({ pageSize: 100 });

  const [assignOpen, setAssignOpen] = useState(false);
  const [draft, setDraft] = useState<AssignDraft | null>(null);

  const createAssignment = useCreateAssignment(draft?.classId ?? '');
  const assignments = useClassAssignments(draft?.classId ?? '', Boolean(draft?.classId));

  const classOptions = (classes.data?.data ?? []).map((item) => ({
    value: String(item.classId),
    label: item.className,
  }));

  function openAssign(course: LearnerCourseDto) {
    setDraft({ course, classId: '', dueDate: '', isRequired: true });
    setAssignOpen(true);
  }

  function handleAssign(event: FormEvent) {
    event.preventDefault();
    if (!draft || !draft.classId) return;
    createAssignment.mutate(
      {
        courseId: draft.course.courseId,
        dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : null,
        isMandatory: draft.isRequired,
      },
      {
        onSuccess: (assignment) => {
          toast.success(`${assignment.courseTitle} assigned to the class.`);
          setDraft((current) => (current ? { ...current, dueDate: '' } : current));
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  if (courses.isPending) {
    return <OrgCurriculumPageSkeleton />;
  }

  if (courses.isError) {
    return (
      <div>
        <PageHeader title="Curriculum" />
        <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
      </div>
    );
  }

  const list = courses.data ?? [];

  return (
    <div>
      <PageHeader title="Curriculum" />

      {list.length === 0 ? (
        <EmptyState icon="course" title="No published courses yet" />
      ) : (
        <Tree ariaLabel="Curriculum">
          {list.map((course) => (
            <CourseNode
              key={course.courseId}
              course={course}
              onPreview={(route) => navigate(route)}
              onAssign={openAssign}
            />
          ))}
        </Tree>
      )}

      <Drawer
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign to class"
        size="md"
        busy={createAssignment.isPending}
        footer={(requestClose) => (
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={requestClose}>
              Close
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              isLoading={createAssignment.isPending}
              disabled={!draft?.classId}
            >
              Assign course
            </Button>
          </div>
        )}
      >
        {draft ? (
          <form id={FORM_ID} onSubmit={handleAssign} className="flex flex-col gap-6">
            <Select
              label="Class"
              placeholder={
                classes.isPending
                  ? 'Loading classes…'
                  : classOptions.length === 0
                    ? 'No classes yet'
                    : 'Select a class'
              }
              options={classOptions}
              value={draft.classId}
              disabled={classes.isPending || classOptions.length === 0}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, classId: event.target.value } : current,
                )
              }
            />
            {classes.isError ? (
              <ErrorState compact error={classes.error} onRetry={() => void classes.refetch()} />
            ) : null}

            <Input
              type="datetime-local"
              label="Due date"
              value={draft.dueDate}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, dueDate: event.target.value } : current,
                )
              }
            />

            <Switch
              checked={draft.isRequired}
              label="Required"
              onCheckedChange={(next) =>
                setDraft((current) => (current ? { ...current, isRequired: next } : current))
              }
            />

            {draft.classId ? (
              <section className="flex flex-col gap-2">
                {assignments.isPending ? (
                  <TreeSkeleton rows={2} />
                ) : assignments.isError ? (
                  <ErrorState
                    compact
                    error={assignments.error}
                    onRetry={() => void assignments.refetch()}
                  />
                ) : (assignments.data ?? []).length === 0 ? (
                  <EmptyState title="No courses assigned to this class yet" />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {(assignments.data ?? []).map((assignment) => (
                      <li
                        key={assignment.assignmentId}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate text-card-foreground">
                          {assignment.courseTitle}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {assignment.isMandatory ? 'Required' : 'Optional'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}
          </form>
        ) : null}
      </Drawer>
    </div>
  );
}

export default OrgCurriculumPage;
