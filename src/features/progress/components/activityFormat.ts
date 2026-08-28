import type { LearningActivityType } from '../types';

export const ACTIVITY_LABELS: Record<LearningActivityType, string> = {
  LESSON_STARTED: 'Started a lesson',
  LESSON_COMPLETED: 'Completed a lesson',
  MODULE_COMPLETED: 'Completed a module',
  LAB_STARTED: 'Started a lab',
  LAB_COMPLETED: 'Completed a lab',
  LAB_FAILED: 'Failed a lab',
  QUIZ_STARTED: 'Started a quiz',
  QUIZ_PASSED: 'Passed a quiz',
  QUIZ_FAILED: 'Failed a quiz',
  COURSE_COMPLETED: 'Completed the course',
};

export function formatActivityTime(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
