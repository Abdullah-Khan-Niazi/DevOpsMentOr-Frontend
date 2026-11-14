import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader, TabRow, toast, type TabItem } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAdminCourse, useAdminModules } from '../hooks';
import { useCurriculumCatalog } from '../hooks/useCurriculumCatalog';
import { useAdminTrackMutations } from '../hooks/useAdminTrackMutations';
import { CurriculumAttachCourseDrawer } from './CurriculumAttachCourseDrawer';
import { CurriculumCoursesTab, type CurriculumCoursesState } from './CurriculumCoursesTab';
import { CurriculumDrawer } from './CurriculumDrawer';
import type { InlineTreeActions } from './CurriculumInlineTree';
import { CurriculumModulesTab } from './CurriculumModulesTab';
import { CurriculumTrackDrawer } from './CurriculumTrackDrawer';
import { CurriculumTracksTab } from './CurriculumTracksTab';
import type { CreateAction, TreeNodeSelection } from './CurriculumTree';
import type { AdminTrackDto } from '@/features/labs/types';
import type { CourseDto } from '../types';

type CurriculumTab = 'tracks' | 'courses' | 'modules';

const TABS: TabItem[] = [
  { id: 'tracks', label: 'Tracks' },
  { id: 'courses', label: 'Courses' },
  { id: 'modules', label: 'Modules' },
];

function resolveTab(tabParam: string | null, hasTaskParam: boolean): CurriculumTab {
  if (tabParam === 'tracks' || tabParam === 'courses' || tabParam === 'modules') {
    return tabParam;
  }
  return hasTaskParam ? 'modules' : 'tracks';
}

function parseCreateAction(searchParams: URLSearchParams): CreateAction | null {
  const createParam = searchParams.get('create');
  const scopedModuleId = Number(searchParams.get('moduleId')) || 0;
  if (createParam === 'module') {
    return { type: 'module' };
  }
  if (createParam === 'lesson' || createParam === 'lab' || createParam === 'quiz') {
    return { type: createParam, moduleId: scopedModuleId };
  }
  return null;
}

function parseSelection(
  pathParams: { moduleId?: string; lessonId?: string; quizId?: string },
  searchParams: URLSearchParams,
  canonicalCourseId: number | null,
): TreeNodeSelection | null {
  const scopedModuleId = Number(searchParams.get('moduleId')) || 0;

  const pathModuleId = Number(pathParams.moduleId);
  if (Number.isFinite(pathModuleId) && pathModuleId > 0) {
    return { type: 'module', id: pathModuleId };
  }

  const pathLessonId = Number(pathParams.lessonId);
  if (Number.isFinite(pathLessonId) && pathLessonId > 0) {
    return searchParams.get('type') === 'lab'
      ? { type: 'lab', id: pathLessonId, moduleId: scopedModuleId }
      : { type: 'lesson', id: pathLessonId, moduleId: scopedModuleId };
  }

  const pathQuizId = Number(pathParams.quizId);
  if (Number.isFinite(pathQuizId) && pathQuizId > 0) {
    return { type: 'quiz', id: pathQuizId, moduleId: scopedModuleId };
  }

  // Query-parameter deep links (`?lessonId=`, `?quizId=`, `?moduleId=`).
  const queryLessonId = Number(searchParams.get('lessonId'));
  if (Number.isFinite(queryLessonId) && queryLessonId > 0) {
    return searchParams.get('type') === 'lab'
      ? { type: 'lab', id: queryLessonId, moduleId: scopedModuleId }
      : { type: 'lesson', id: queryLessonId, moduleId: scopedModuleId };
  }

  const queryQuizId = Number(searchParams.get('quizId'));
  if (Number.isFinite(queryQuizId) && queryQuizId > 0) {
    return { type: 'quiz', id: queryQuizId, moduleId: scopedModuleId };
  }

  const queryModuleId = Number(searchParams.get('moduleId'));
  if (Number.isFinite(queryModuleId) && queryModuleId > 0) {
    return { type: 'module', id: queryModuleId };
  }

  if (searchParams.get('edit') === 'course') {
    return { type: 'course', id: canonicalCourseId ?? 0 };
  }

  return null;
}

/**
 * F4 SCR-F4-01: unified Curriculum Control Panel.
 *
 * Tracks / Courses / Modules are URL-driven (`?tab=`); each tab renders its
 * own inline indented hierarchy and the panel hosts exactly one task drawer at
 * a time. Entity deep links (`?moduleId=`, `?lessonId=`, `?quizId=`,
 * `?create=…`, `?edit=course`) keep opening the matching drawer.
 */
export function CurriculumMasterPanel() {
  const navigate = useNavigate();
  const {
    moduleId: pathModuleId,
    lessonId: pathLessonId,
    quizId: pathQuizId,
  } = useParams<{
    moduleId?: string;
    lessonId?: string;
    quizId?: string;
  }>();
  const [searchParams] = useSearchParams();

  const courseQuery = useAdminCourse();
  const modulesQuery = useAdminModules();
  const catalogQuery = useCurriculumCatalog();
  const trackMutations = useAdminTrackMutations();

  const refetchModules = modulesQuery.refetch;
  const refetchCourse = courseQuery.query.refetch;
  const refetchCatalog = catalogQuery.refetch;

  const createAction = useMemo(() => parseCreateAction(searchParams), [searchParams]);
  const canonicalCourse = courseQuery.query.data ?? null;
  const canonicalCourseId = canonicalCourse?.courseId ?? null;

  const selection = useMemo(
    () =>
      createAction
        ? null
        : parseSelection(
            { moduleId: pathModuleId, lessonId: pathLessonId, quizId: pathQuizId },
            searchParams,
            canonicalCourseId,
          ),
    [createAction, pathModuleId, pathLessonId, pathQuizId, searchParams, canonicalCourseId],
  );

  const selectedTrackId = useMemo(() => {
    const raw = searchParams.get('track');
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  const tabParam = searchParams.get('tab');
  const hasTaskParam = Boolean(
    pathModuleId ||
    pathLessonId ||
    pathQuizId ||
    searchParams.get('moduleId') ||
    searchParams.get('lessonId') ||
    searchParams.get('quizId') ||
    createAction ||
    searchParams.get('edit'),
  );
  const activeTab = resolveTab(tabParam, hasTaskParam);

  // Local (non-URL) task drawers: track create/edit and track course attach.
  const [trackDrawer, setTrackDrawer] = useState<{
    mode: 'create' | 'edit';
    track: AdminTrackDto | null;
  } | null>(null);
  const [attachTrack, setAttachTrack] = useState<AdminTrackDto | null>(null);

  const modulesList = useMemo(() => modulesQuery.data ?? [], [modulesQuery.data]);
  const modulesError = modulesQuery.isError
    ? (modulesQuery.error?.message ?? 'Could not load modules.')
    : null;

  const courses = useMemo(() => {
    const map = new Map<number, CourseDto>();
    for (const course of catalogQuery.data ?? []) {
      map.set(course.courseId, course);
    }
    if (canonicalCourse) {
      map.set(canonicalCourse.courseId, canonicalCourse);
    }
    return [...map.values()].sort((a, b) => a.courseId - b.courseId);
  }, [catalogQuery.data, canonicalCourse]);

  const autoExpandKeys = useMemo(() => {
    const keys = new Set<string>();
    if (selectedTrackId) {
      keys.add(`track-${selectedTrackId}`);
    }
    // The Courses tab opens with the canonical (editable) course expanded.
    if (activeTab === 'courses' && canonicalCourseId !== null) {
      keys.add(`course-${canonicalCourseId}`);
    }
    if (!createAction && selection) {
      if (selection.type === 'course') {
        keys.add(`course-${selection.id}`);
      } else if (selection.type === 'module') {
        keys.add(`module-${selection.id}`);
        const module = modulesList.find((item) => item.moduleId === selection.id);
        if (module) keys.add(`course-${module.courseId}`);
      } else {
        keys.add(`module-${selection.moduleId}`);
        const module = modulesList.find((item) => item.moduleId === selection.moduleId);
        if (module) keys.add(`course-${module.courseId}`);
      }
    }
    return keys;
  }, [selectedTrackId, activeTab, canonicalCourseId, selection, createAction, modulesList]);

  /* ─── URL task navigation ─────────────────────────────────────────────── */

  const closeDrawer = useCallback(() => {
    const params = new URLSearchParams({ tab: activeTab });
    if (selectedTrackId) params.set('track', String(selectedTrackId));
    navigate(`${ROUTES.ADMIN_CURRICULUM}?${params.toString()}`, { replace: true });
  }, [activeTab, selectedTrackId, navigate]);

  const openSelection = useCallback(
    (next: TreeNodeSelection) => {
      const params = new URLSearchParams({ tab: activeTab });
      if (selectedTrackId) params.set('track', String(selectedTrackId));

      let path: string = ROUTES.ADMIN_CURRICULUM;
      if (next.type === 'module') {
        path = ROUTES.ADMIN_CURRICULUM_MODULE.replace(':moduleId', String(next.id));
      } else if (next.type === 'lesson' || next.type === 'lab') {
        path = ROUTES.ADMIN_CURRICULUM_LESSON.replace(':lessonId', String(next.id));
        params.set('moduleId', String(next.moduleId));
        if (next.type === 'lab') params.set('type', 'lab');
      } else if (next.type === 'quiz') {
        path = ROUTES.ADMIN_CURRICULUM_QUIZ.replace(':quizId', String(next.id));
        params.set('moduleId', String(next.moduleId));
      } else {
        params.set('edit', 'course');
      }

      navigate(`${path}?${params.toString()}`);
    },
    [activeTab, selectedTrackId, navigate],
  );

  const openCreate = useCallback(
    (action: CreateAction) => {
      const params = new URLSearchParams({ tab: activeTab, create: action.type });
      if (action.type !== 'module') {
        params.set('moduleId', String(action.moduleId));
      }
      if (selectedTrackId) params.set('track', String(selectedTrackId));
      navigate(`${ROUTES.ADMIN_CURRICULUM}?${params.toString()}`);
    },
    [activeTab, selectedTrackId, navigate],
  );

  const openEditCourse = useCallback(() => {
    const params = new URLSearchParams({ tab: activeTab, edit: 'course' });
    if (selectedTrackId) params.set('track', String(selectedTrackId));
    navigate(`${ROUTES.ADMIN_CURRICULUM}?${params.toString()}`);
  }, [activeTab, selectedTrackId, navigate]);

  const handleTabChange = useCallback(
    (nextId: string) => {
      const next: CurriculumTab =
        nextId === 'courses' || nextId === 'modules' || nextId === 'tracks' ? nextId : 'tracks';
      if (next === activeTab) {
        return;
      }
      setTrackDrawer(null);
      setAttachTrack(null);
      const params = new URLSearchParams({ tab: next });
      if (selectedTrackId) params.set('track', String(selectedTrackId));
      navigate(`${ROUTES.ADMIN_CURRICULUM}?${params.toString()}`);
    },
    [activeTab, selectedTrackId, navigate],
  );

  /* ─── Local task drawers ──────────────────────────────────────────────── */

  const openNewTrack = useCallback(() => {
    setAttachTrack(null);
    setTrackDrawer({ mode: 'create', track: null });
  }, []);

  const openEditTrack = useCallback((track: AdminTrackDto) => {
    setAttachTrack(null);
    setTrackDrawer({ mode: 'edit', track });
  }, []);

  const openAttachCourse = useCallback((track: AdminTrackDto) => {
    setTrackDrawer(null);
    setAttachTrack(track);
  }, []);

  /* ─── Publish controls ────────────────────────────────────────────────── */

  const updateTrack = trackMutations.update;
  const updateCourse = courseQuery.update;
  const updateTrackMutate = updateTrack.mutate;
  const updateCourseMutate = updateCourse.mutate;

  const handleToggleTrackPublish = useCallback(
    (track: AdminTrackDto, next: boolean) => {
      updateTrackMutate(
        { trackId: track.trackId, payload: { isActive: next } },
        {
          onSuccess: () =>
            toast.success(
              next
                ? `Track "${track.trackName}" published.`
                : `Track "${track.trackName}" unpublished.`,
            ),
          onError: (error) => toast.error(error.message),
        },
      );
    },
    [updateTrackMutate],
  );

  const handleToggleCoursePublish = useCallback(
    (course: CourseDto, next: boolean) => {
      if (!canonicalCourse || course.courseId !== canonicalCourse.courseId) {
        return;
      }
      updateCourseMutate(
        { isPublished: next },
        {
          onSuccess: () => toast.success(next ? 'Course published.' : 'Course unpublished.'),
          onError: (error) => toast.error(error.message),
        },
      );
    },
    [canonicalCourse, updateCourseMutate],
  );

  const busyTrackIds = useMemo(() => {
    const ids = new Set<number>();
    if (updateTrack.isPending && updateTrack.variables) {
      ids.add(updateTrack.variables.trackId);
    }
    return ids;
  }, [updateTrack.isPending, updateTrack.variables]);

  const busyCourseIds = useMemo(() => {
    const ids = new Set<number>();
    if (updateCourse.isPending && canonicalCourseId !== null) {
      ids.add(canonicalCourseId);
    }
    return ids;
  }, [updateCourse.isPending, canonicalCourseId]);

  /* ─── Shared inline-tree props ────────────────────────────────────────── */

  const treeActions: InlineTreeActions = useMemo(
    () => ({
      onSelect: openSelection,
      onCreate: openCreate,
      onEditCourse: openEditCourse,
      onEditTrack: openEditTrack,
      onAttachCourse: openAttachCourse,
      onToggleTrackPublish: handleToggleTrackPublish,
      onToggleCoursePublish: handleToggleCoursePublish,
      onOpenCoursesTab: () => handleTabChange('courses'),
      busyTrackIds,
      busyCourseIds,
    }),
    [
      openSelection,
      openCreate,
      openEditCourse,
      openEditTrack,
      openAttachCourse,
      handleToggleTrackPublish,
      handleToggleCoursePublish,
      handleTabChange,
      busyTrackIds,
      busyCourseIds,
    ],
  );

  const treeBaseProps = useMemo(
    () => ({
      modules: modulesList,
      modulesLoading: modulesQuery.isLoading,
      modulesError,
      onRetryModules: () => void refetchModules(),
      courses,
      canonicalCourseId,
      selected: selection,
      autoExpandKeys,
      actions: treeActions,
    }),
    [
      modulesList,
      modulesQuery.isLoading,
      refetchModules,
      modulesError,
      courses,
      canonicalCourseId,
      selection,
      autoExpandKeys,
      treeActions,
    ],
  );

  const coursesState: CurriculumCoursesState = useMemo(
    () => ({
      canonicalLoading: courseQuery.query.isLoading,
      canonicalError: courseQuery.query.isError
        ? (courseQuery.query.error?.message ?? 'The canonical course is unavailable.')
        : null,
      catalogLoading: catalogQuery.isLoading,
      catalogError: catalogQuery.isError
        ? (catalogQuery.error?.message ?? 'The published course catalog is unavailable.')
        : null,
      hasCanonical: Boolean(canonicalCourse),
      onRetry: () => {
        void refetchCourse();
        void refetchCatalog();
      },
    }),
    [
      courseQuery.query.isLoading,
      courseQuery.query.isError,
      courseQuery.query.error,
      refetchCourse,
      catalogQuery.isLoading,
      catalogQuery.isError,
      catalogQuery.error,
      refetchCatalog,
      canonicalCourse,
    ],
  );

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <PageHeader title="Curriculum Control Panel" />

      <TabRow items={TABS} activeId={activeTab} onChange={handleTabChange} />

      {activeTab === 'tracks' ? (
        <CurriculumTracksTab tree={treeBaseProps} onNewTrack={openNewTrack} />
      ) : activeTab === 'courses' ? (
        <CurriculumCoursesTab tree={treeBaseProps} coursesState={coursesState} />
      ) : (
        <CurriculumModulesTab
          selectedNode={selection}
          onSelectNode={openSelection}
          onCreateAction={openCreate}
        />
      )}

      {/* Single task drawer host — create OR edit, never both. */}
      <CurriculumDrawer
        isOpen={Boolean(createAction || selection)}
        onClose={closeDrawer}
        createAction={createAction}
        selectedNode={createAction ? null : selection}
        course={canonicalCourse}
      />

      <CurriculumTrackDrawer
        isOpen={Boolean(trackDrawer)}
        onClose={() => setTrackDrawer(null)}
        mode={trackDrawer?.mode ?? 'create'}
        track={trackDrawer?.track ?? null}
      />

      <CurriculumAttachCourseDrawer
        isOpen={Boolean(attachTrack)}
        onClose={() => setAttachTrack(null)}
        track={attachTrack}
        courses={courses}
      />
    </div>
  );
}

export default CurriculumMasterPanel;
