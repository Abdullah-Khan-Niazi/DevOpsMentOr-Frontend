import { Link } from 'react-router-dom';
import { Card } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { ClassDto } from '../types';

/** F3 contract §10: class summary card — title, professor, capacity, dates. */
export function ClassCard({ klass }: { klass: ClassDto }) {
  return (
    <Link
      to={ROUTES.ORG_CLASS_DETAIL.replace(':classId', String(klass.classId))}
      className="block focus:outline-none"
    >
      <Card interactive className="h-full p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-card-foreground">{klass.className}</h3>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {klass.studentCount}/{klass.maxStudents}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted">
          {klass.description || 'No description provided.'}
        </p>
        <dl className="mt-4 space-y-1 text-xs text-muted">
          <div className="flex justify-between">
            <dt>Professor</dt>
            <dd className="text-muted-foreground">{klass.professorName ?? 'Unassigned'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Created</dt>
            <dd className="text-muted-foreground">
              {new Date(klass.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </Card>
    </Link>
  );
}

export default ClassCard;
