import { ErrorState } from '@/shared/components';
import type { ModuleDto } from '../types';
import { ModuleAccordionItem } from './ModuleAccordionItem';

interface ModuleAccordionListProps {
  modules: ModuleDto[];
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  activeLessonId?: number | null;
  onOpenLesson: (lessonId: number) => void;
}

/** F4 SCR-F4-05: accordion list of published modules with their lessons. */
export function ModuleAccordionList({
  modules,
  isError,
  errorMessage,
  onRetry,
  activeLessonId,
  onOpenLesson,
}: ModuleAccordionListProps) {
  if (isError) {
    return (
      <ErrorState message={errorMessage ?? 'Unable to load the curriculum.'} onRetry={onRetry} />
    );
  }

  if (modules.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface/50 p-8 text-center">
        <p className="font-medium text-card-foreground">Course is being prepared.</p>
        <p className="mt-1 text-sm text-muted">
          Modules will appear here once the curriculum team publishes them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module) => (
        <ModuleAccordionItem
          key={module.moduleId}
          module={module}
          activeLessonId={activeLessonId}
          onOpenLesson={onOpenLesson}
        />
      ))}
    </div>
  );
}
