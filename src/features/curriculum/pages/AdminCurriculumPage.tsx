import { CurriculumControlPanel } from '../components/admin/CurriculumControlPanel';

/**
 * Staff curriculum control panel (`ADMIN_CURRICULUM`): URL-driven Tracks / Courses /
 * Modules tabs, one shared tree and the drawer host. The loading state is
 * `CurriculumPageSkeleton` (rendered by the panel while the root lists load).
 */
export function AdminCurriculumPage() {
  return <CurriculumControlPanel />;
}

export default AdminCurriculumPage;
