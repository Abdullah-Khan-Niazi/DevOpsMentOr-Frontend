import { useState, type ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  Button,
  ErrorState,
  IconButton,
  PageHeader,
  SearchInput,
  Select,
  TabSwitcher,
  type TabSwitcherItem,
} from '@/shared/components';
import { useAdminCourses } from '../../hooks/useAdminCurriculum';
import { useAdminTracks } from '../../hooks/useAdminTracks';
import type { PublishFilter } from '../../types/admin';
import { CurriculumDrawerHost } from './CurriculumDrawerHost';
import { CurriculumPageSkeleton } from './CurriculumPageSkeleton';
import {
  CurriculumTree,
  type CurriculumRootLevel,
  type TreeExpandSignal,
  type TreeFlash,
} from './CurriculumTree';
import { TrackDrawer } from './drawers/TrackDrawer';
import { useCurriculumUrlState, type CurriculumTab } from './useCurriculumUrlState';
import '../../styles/curriculum.css';

// Staff curriculum control panel (FE§3.1): one toolbar, one shared tree, the drawer host.
// The outer page container owns vertical scrolling so nested course/module lists never show inner scrollbars.

const MANAGE_PERMISSION = 'platform.curriculum.manage';

const TAB_ITEMS: ReadonlyArray<TabSwitcherItem<CurriculumTab>> = [
  { id: 'tracks', label: 'Tracks', icon: 'track' },
  { id: 'courses', label: 'Courses', icon: 'course' },
  { id: 'modules', label: 'Modules', icon: 'module' },
];

const ROOT_LEVEL: Record<CurriculumTab, CurriculumRootLevel> = {
  tracks: 'track',
  courses: 'course',
  modules: 'module',
};

const STATUS_OPTIONS: ReadonlyArray<{ value: PublishFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

function usePermission(permission: string): boolean {
  return useAuthStore((state) => state.user?.permissions?.includes(permission) ?? false);
}

export function CurriculumControlPanel() {
  const url = useCurriculumUrlState();
  const canManage = usePermission(MANAGE_PERMISSION);
  const tracks = useAdminTracks();
  const courses = useAdminCourses();
  const [trackCreateOpen, setTrackCreateOpen] = useState(false);
  const [expand, setExpand] = useState<TreeExpandSignal | null>(null);
  const [flash, setFlash] = useState<TreeFlash | null>(null);

  if (tracks.isPending || courses.isPending) {
    return <CurriculumPageSkeleton />;
  }

  if (tracks.isError || courses.isError) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <PageHeader title="Curriculum" />
        <ErrorState
          error={tracks.error ?? courses.error}
          onRetry={() => {
            void tracks.refetch();
            void courses.refetch();
          }}
        />
      </div>
    );
  }

  const trackCount = tracks.data?.length ?? 0;
  const courseList = courses.data ?? [];
  // Modules are course scoped: prefer a course that already has modules, falling back to the first course.
  const activeCourseId =
    courseList.find((course) => course.courseId === url.courseId)?.courseId ??
    (courseList.find((course) => course.moduleCount > 0) ?? courseList[0])?.courseId ??
    null;

  const setExpandAll = (open: boolean) =>
    setExpand((previous) => ({ open, version: (previous?.version ?? 0) + 1 }));

  let createAction: ReactNode = null;
  if (canManage) {
    if (url.tab === 'tracks' && trackCount === 0) {
      createAction = (
        <Button
          variant="primary"
          size="sm"
          iconName="plus"
          onClick={() => setTrackCreateOpen(true)}
        >
          New track
        </Button>
      );
    } else if (url.tab === 'courses') {
      createAction = (
        <Button
          variant="primary"
          size="sm"
          iconName="plus"
          onClick={() => url.openDrawer('course-new', 0)}
        >
          New course
        </Button>
      );
    } else if (url.tab === 'modules') {
      createAction = (
        <Button
          variant="primary"
          size="sm"
          iconName="plus"
          disabled={activeCourseId === null}
          onClick={() => {
            if (activeCourseId !== null) url.openDrawer('module-new', activeCourseId);
          }}
        >
          New module
        </Button>
      );
    }
  }

  return (
    <div className="curriculum-page flex min-w-0 w-full flex-1 flex-col gap-4 pb-12">
      <PageHeader title="Curriculum" actions={createAction} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full shrink-0 sm:w-56 md:w-64">
          <SearchInput
            label="Search curriculum"
            shortcut
            size="sm"
            value={url.searchValue}
            onValueChange={url.setSearchValue}
          />
        </div>
        <Select
          inline
          aria-label="Publish status"
          size="sm"
          value={url.status}
          options={STATUS_OPTIONS}
          onChange={(event) => url.setStatus(event.target.value as PublishFilter)}
        />
        {url.tab === 'modules' && courseList.length > 1 && activeCourseId !== null ? (
          <Select
            inline
            aria-label="Course"
            size="sm"
            value={String(activeCourseId)}
            options={courseList.map((course) => ({
              value: String(course.courseId),
              label: `${course.slug}: ${course.title} (${course.moduleCount})`,
            }))}
            onChange={(event) => url.setCourseId(Number(event.target.value))}
          />
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon="expand-all" label="Expand all" onClick={() => setExpandAll(true)} />
          <IconButton
            icon="collapse-all"
            label="Collapse all"
            onClick={() => setExpandAll(false)}
          />
          <TabSwitcher
            items={TAB_ITEMS}
            value={url.tab}
            onChange={url.setTab}
            ariaLabel="Curriculum level"
            size="sm"
          />
        </div>
      </div>

      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        <CurriculumTree
          rootLevel={ROOT_LEVEL[url.tab]}
          search={url.debouncedSearch}
          status={url.status}
          courseId={activeCourseId}
          selectedDrawer={url.drawer}
          onOpenDrawer={url.openDrawer}
          flash={flash}
          expand={expand}
        />
      </div>

      <CurriculumDrawerHost
        drawer={url.drawer}
        onClose={url.closeDrawer}
        onOpen={url.openDrawer}
        onCreated={setFlash}
      />
      <TrackDrawer
        open={trackCreateOpen}
        mode="create"
        id={null}
        onClose={() => setTrackCreateOpen(false)}
        onCreated={() => setTrackCreateOpen(false)}
      />
    </div>
  );
}

export default CurriculumControlPanel;
