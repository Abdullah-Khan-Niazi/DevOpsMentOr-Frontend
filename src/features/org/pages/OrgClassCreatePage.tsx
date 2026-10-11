import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';

/** F3 contract §09 SCR-F3-05: Redirect to Cohorts page with drawer open. */
export function OrgClassCreatePage() {
  return <Navigate to={`${ROUTES.ORG_CLASSES}?drawer=cohort`} replace />;
}

export default OrgClassCreatePage;
