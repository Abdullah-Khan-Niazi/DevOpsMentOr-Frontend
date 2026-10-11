import { Navigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';

/** F3 contract SCR-F3-07: Redirect to unified Class Detail invitations tab. */
export function OrgClassInvitePage() {
  const { classId = '' } = useParams<{ classId: string }>();
  return (
    <Navigate
      to={`${ROUTES.ORG_CLASS_DETAIL.replace(':classId', classId)}?tab=invitations`}
      replace
    />
  );
}

export default OrgClassInvitePage;
