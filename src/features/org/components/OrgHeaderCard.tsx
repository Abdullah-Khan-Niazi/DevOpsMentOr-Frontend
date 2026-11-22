import { Card, Icon } from '@/shared/components';
import type { MyOrgDto } from '../types';
import { safeHttpUrl } from '@/shared/utils';

/** F3 contract §09 SCR-F3-03: org identity header shown on the org dashboard. */
export function OrgHeaderCard({ org }: { org: MyOrgDto }) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-4">
        {safeHttpUrl(org.logoUrl) ? (
          <img
            src={safeHttpUrl(org.logoUrl) ?? undefined}
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
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Icon name="verified" size={16} />
                Verified
              </span>
            ) : null}
          </div>
          {org.description ? <p className="mt-1 text-sm text-muted">{org.description}</p> : null}
          {org.website || org.emailDomain ? (
            <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
              {org.website ? <span>{org.website}</span> : null}
              {org.emailDomain ? <span>@{org.emailDomain}</span> : null}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-stretch">
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
