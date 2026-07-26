import type { User } from '../types';

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-slate-50 text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3 text-slate-600">{user.role}</td>
              <td className="px-4 py-3 capitalize text-slate-600">{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
