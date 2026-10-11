import { Navigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';

/** F3 contract SCR-F3-09: Redirect to unified Class Detail students tab. */
export function OrgClassRosterPage() {
  const { classId = '' } = useParams<{ classId: string }>();
  return (
    <Navigate
      to={`${ROUTES.ORG_CLASS_DETAIL.replace(':classId', classId)}?tab=students`}
      replace
    />
  );
}

export default OrgClassRosterPage;
