import type { Role } from '../types';

interface RolesListProps {
  roles: Role[];
}

export function RolesList({ roles }: RolesListProps) {
  return (
    <ul className="space-y-3">
      {roles.map((role) => (
        <li key={role.id} className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-medium text-card-foreground">{role.name}</h3>
          <p className="mt-1 text-sm text-muted">{role.description}</p>
          <p className="mt-2 text-xs text-muted">
            {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
          </p>
        </li>
      ))}
    </ul>
  );
}
