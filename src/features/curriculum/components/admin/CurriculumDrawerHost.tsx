import { useState } from 'react';
import { AttachCourseDrawer } from './drawers/AttachCourseDrawer';
import { CourseDrawer } from './drawers/CourseDrawer';
import { LabItemDrawer } from './drawers/LabItemDrawer';
import { LessonDrawer } from './drawers/LessonDrawer';
import { ModuleDrawer } from './drawers/ModuleDrawer';
import { QuizBuilderDrawer } from './drawers/QuizBuilderDrawer';
import { QuizSettingsDrawer } from './drawers/QuizSettingsDrawer';
import { TrackDrawer } from './drawers/TrackDrawer';
import { LabSpecDrawer } from './labSpec/LabSpecDrawer';
import type { TreeFlash } from './CurriculumTree';
import type { CurriculumDrawer, CurriculumDrawerKind } from './useCurriculumUrlState';

// Maps the `?drawer=<kind>:<id>` URL state to its drawer. Exactly one drawer is open.
// Chains (quiz create -> questions, lab item "Edit steps" -> lab spec, create -> edit of
// the new row) go through `onOpen`, so the URL stays the source of truth.

export interface CurriculumDrawerHostProps {
  drawer: CurriculumDrawer | null;
  onClose: () => void;
  onOpen: (kind: CurriculumDrawerKind, id: number) => void;
  /** A row was created: the tree scrolls to it and flashes it. */
  onCreated?: (flash: TreeFlash) => void;
}

export function CurriculumDrawerHost({
  drawer,
  onClose,
  onOpen,
  onCreated,
}: CurriculumDrawerHostProps) {
  // The last drawer stays mounted while the current one closes, so the Drawer exit
  // animation plays. Set during render (not in an effect) to avoid an extra commit.
  const [lastDrawer, setLastDrawer] = useState<CurriculumDrawer | null>(drawer);
  if (drawer && (drawer.kind !== lastDrawer?.kind || drawer.id !== lastDrawer?.id)) {
    setLastDrawer(drawer);
  }

  const shown = drawer ?? lastDrawer;
  if (!shown) return null;

  const open = drawer !== null;
  const key = `${shown.kind}:${shown.id}`;
  const { id } = shown;

  switch (shown.kind) {
    case 'track':
      return <TrackDrawer key={key} open={open} mode="edit" id={id} onClose={onClose} />;

    case 'attach-course':
      return <AttachCourseDrawer key={key} open={open} mode="edit" id={id} onClose={onClose} />;

    case 'course':
      return <CourseDrawer key={key} open={open} mode="edit" id={id} onClose={onClose} />;

    case 'course-new':
      return (
        <CourseDrawer
          key={key}
          open={open}
          mode="create"
          id={null}
          onClose={onClose}
          onCreated={(courseId) => {
            onCreated?.({ kind: 'course', id: courseId });
            onOpen('course', courseId);
          }}
        />
      );

    case 'module':
      return <ModuleDrawer key={key} open={open} mode="edit" id={id} onClose={onClose} />;

    case 'module-new':
      return (
        <ModuleDrawer
          key={key}
          open={open}
          mode="create"
          id={null}
          parentId={id}
          onClose={onClose}
          onCreated={(moduleId) => {
            onCreated?.({ kind: 'module', id: moduleId });
            onOpen('module', moduleId);
          }}
        />
      );

    case 'lesson':
      return <LessonDrawer key={key} open={open} mode="edit" id={id} onClose={onClose} />;

    case 'lesson-new':
      return (
        <LessonDrawer
          key={key}
          open={open}
          mode="create"
          id={null}
          parentId={id}
          onClose={onClose}
          onCreated={(itemId) => {
            onCreated?.({ kind: 'item', id: itemId });
            onOpen('lesson', itemId);
          }}
        />
      );

    case 'lab-item':
      return (
        <LabItemDrawer
          key={key}
          open={open}
          mode="edit"
          id={id}
          onClose={onClose}
          onOpenLabSpec={(labId) => onOpen('lab-spec', labId)}
        />
      );

    case 'lab-item-new':
      return (
        <LabItemDrawer
          key={key}
          open={open}
          mode="create"
          id={null}
          parentId={id}
          onClose={onClose}
          onOpenLabSpec={(labId) => onOpen('lab-spec', labId)}
          onCreated={(itemId) => {
            onCreated?.({ kind: 'item', id: itemId });
            onOpen('lab-item', itemId);
          }}
        />
      );

    case 'quiz':
      return (
        <QuizSettingsDrawer
          key={key}
          open={open}
          mode="edit"
          id={id}
          onClose={onClose}
          onOpenQuestions={(quizId) => onOpen('questions', quizId)}
        />
      );

    case 'quiz-new':
      return (
        <QuizSettingsDrawer
          key={key}
          open={open}
          mode="create"
          id={null}
          parentId={id}
          onClose={onClose}
          onOpenQuestions={(quizId) => onOpen('questions', quizId)}
          onCreated={(quizId) => onOpen('quiz', quizId)}
        />
      );

    case 'questions':
      return <QuizBuilderDrawer key={key} open={open} quizId={id} onClose={onClose} />;

    case 'lab-spec':
      return <LabSpecDrawer key={key} open={open} labId={id} onClose={onClose} />;
  }
}

export default CurriculumDrawerHost;
