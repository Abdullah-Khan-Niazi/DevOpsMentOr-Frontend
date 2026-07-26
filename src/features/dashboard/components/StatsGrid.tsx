import type { DashboardStats } from '../types';

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Active roles', value: stats.activeRoles },
    { label: 'Open reports', value: stats.openReports },
    { label: 'System health', value: stats.systemHealth },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-white p-4">
          <p className="text-sm text-muted">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold capitalize text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
