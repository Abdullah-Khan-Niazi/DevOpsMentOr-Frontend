import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';
import { Drawer, ErrorState, Icon, Tree, TreeItem, TreeSkeleton } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import {
  useLearnCourse,
  useLearnCourseModules,
  useLearnModuleItems,
} from '../../hooks/useCurriculum';
import type { ModuleDto, ModuleItemDto } from '../../types';
import { ItemKindIcon } from './ItemKindIcon';

interface CourseOutlineDrawerProps {
  open: boolean;
  courseId: number;
  /** Item the learner is on; its row is selected. */
  currentItemId?: number;
  /** Module the learner is in; it starts expanded. */
  currentModuleId?: number;
  onClose: () => void;
}

const noop = () => undefined;

/** Route for a module item by kind, or null when the item has no destination. */
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

interface ItemNodeProps {
  item: ModuleItemDto;
  canAccess: boolean;
  selected: boolean;
  onOpen: (route: string) => void;
}

function ItemNode({ item, canAccess, selected, onOpen }: ItemNodeProps) {
  const route = itemRoute(item);
  const unavailableLab = item.kind === 'lab' && (item.lab?.stepCount ?? 0) === 0;
  const available = canAccess && route !== null && !unavailableLab;

  return (
    <TreeItem
      id={`outline-item-${item.itemId}`}
      level={2}
      label={
        <span className="flex min-w-0 items-center gap-2">
          <ItemKindIcon kind={item.kind} contentType={item.contentType} size={18} />
          <span className="truncate">{item.title}</span>
        </span>
      }
      meta={canAccess ? undefined : <Icon name="lock" size={16} title="Locked" />}
      expandable={false}
      open={false}
      onToggle={noop}
      selected={selected}
      muted={!available}
      onActivate={available && route ? () => onOpen(route) : undefined}
    />
  );
}

interface ModuleNodeProps {
  module: ModuleDto;
  canAccess: boolean;
  currentItemId?: number;
  initiallyOpen: boolean;
  onOpenItem: (route: string) => void;
}

/** One module row; its items load lazily the first time it is expanded. */
function ModuleNode({
  module,
  canAccess,
  currentItemId,
  initiallyOpen,
  onOpenItem,
}: ModuleNodeProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const items = useLearnModuleItems(module.moduleId, open);
  const sortedItems = [...(items.data ?? [])].sort((a, b) => a.position - b.position);

  return (
    <TreeItem
      id={`outline-module-${module.moduleId}`}
      level={1}
      label={module.title}
      meta={canAccess ? undefined : <Icon name="lock" size={16} title="Locked" />}
      icon="module"
      expandable
      open={open}
      onToggle={() => setOpen((value) => !value)}
      muted={!canAccess}
      loading={open && items.isPending}
      error={open && items.isError ? items.error : undefined}
      onRetry={() => void items.refetch()}
    >
      {sortedItems.map((item) => (
        <ItemNode
          key={item.itemId}
          item={item}
          canAccess={canAccess}
          selected={item.itemId === currentItemId}
          onOpen={onOpenItem}
        />
      ))}
    </TreeItem>
  );
}

/**
 * Course outline in a shared drawer: modules as expandable tree rows, items loaded lazily.
 * Keyboard tree navigation comes from `Tree`; Enter opens an item and closes the drawer.
 * Locked courses show the outline muted with lock icons and cannot be opened.
 */
export function CourseOutlineDrawer({
  open,
  courseId,
  currentItemId,
  currentModuleId,
  onClose,
}: CourseOutlineDrawerProps) {
  const navigate = useNavigate();
  const course = useLearnCourse(courseId, open);
  const modules = useLearnCourseModules(courseId, open);
  const canAccess = course.data?.access.canAccess === true;

  function openItem(route: string) {
    navigate(route);
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title="Course outline" size="md">
      {modules.isError ? (
        <ErrorState error={modules.error} onRetry={() => void modules.refetch()} />
      ) : modules.isPending ? (
        <TreeSkeleton rows={5} />
      ) : (
        <Tree ariaLabel="Course outline">
          {(modules.data ?? []).map((module) => (
            <ModuleNode
              key={module.moduleId}
              module={module}
              canAccess={canAccess}
              currentItemId={currentItemId}
              initiallyOpen={module.moduleId === currentModuleId}
              onOpenItem={openItem}
            />
          ))}
        </Tree>
      )}
    </Drawer>
  );
}

export default CourseOutlineDrawer;
