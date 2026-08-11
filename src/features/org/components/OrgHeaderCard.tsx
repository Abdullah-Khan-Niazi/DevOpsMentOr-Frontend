import { Card } from '@/shared/components';
import type { MyOrgDto } from '../types';

/** F3 contract §09 SCR-F3-03: org identity header shown on the org dashboard. */
export function OrgHeaderCard({ org }: { org: MyOrgDto }) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-4">
        {org.logoUrl ? (
          <img
            src={org.logoUrl}
            alt={`${org.name} logo`}
            className="h-14 w-14 rounded-lg border border-border object-contain"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-50 text-lg font-semibold text-brand-700">
            {org.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-card-foreground">{org.name}</h2>
            {org.isVerified ? (
              <span className="text-xs font-medium uppercase tracking-wide text-green-700">
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">{org.description || 'No description provided.'}</p>
          {org.website || org.emailDomain ? (
            <p className="mt-1 text-sm text-muted">
              {[org.website, org.emailDomain ? `@${org.emailDomain}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4 items-stretch">
        <div className="flex flex-col rounded-lg border border-border bg-surface/50 p-4">
          <dt className="text-sm text-muted">Classes</dt>
          <dd className="mt-auto text-2xl font-semibold text-card-foreground">
            {org.stats.classCount}
          </dd>
        </div>
        <div className="flex flex-col rounded-lg border border-border bg-surface/50 p-4">
          <dt className="text-sm text-muted">Students</dt>
          <dd className="mt-auto text-2xl font-semibold text-card-foreground">
            {org.stats.studentCount}
          </dd>
        </div>
        <div className="flex flex-col rounded-lg border border-border bg-surface/50 p-4">
          <dt className="text-sm text-muted">Professors</dt>
          <dd className="mt-auto text-2xl font-semibold text-card-foreground">
            {org.stats.professorCount}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default OrgHeaderCard;
