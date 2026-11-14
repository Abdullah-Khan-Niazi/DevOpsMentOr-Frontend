import { CurriculumMasterPanel } from '../components/CurriculumMasterPanel';

/**
 * F4 SCR-F4-01 / REFACTOR: Unified Admin Curriculum Master Control Panel.
 * URL-driven Tracks / Courses / Modules tabs (`?tab=`) with an inline
 * indented hierarchy inside each tab and one task drawer at a time; deep
 * links to modules, lessons, quizzes, create actions and course edit keep
 * working.
 */
export function AdminCurriculumPage() {
  return <CurriculumMasterPanel />;
}

export default AdminCurriculumPage;
