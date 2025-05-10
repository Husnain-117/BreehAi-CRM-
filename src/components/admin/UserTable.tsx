import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Button } from '../ui/button';

interface UserTableProps {
  users: UserProfile[];
  loading: boolean;
  onEdit: (user: UserProfile) => void;
  onAssign: (user: UserProfile) => void;
  onUpdatePassword: (user: UserProfile) => void;
  onRefresh: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, loading, onEdit, onAssign, onUpdatePassword, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const filtered = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!search || (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="bg-card rounded-lg shadow p-4">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="agent">Agent</option>
          <option value="manager">Manager</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <Button size="sm" onClick={onRefresh}>Refresh</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Manager</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center">No users found.</td></tr>
            ) : filtered.map(user => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="p-2">{user.full_name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2 capitalize">{user.role}</td>
                <td className="p-2">{user.manager_id || '-'}</td>
                <td className="p-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(user)}>Edit</Button>
                  {user.role === 'agent' && <Button size="sm" variant="outline" onClick={() => onAssign(user)}>Assign</Button>}
                  <Button size="sm" variant="outline" onClick={() => onUpdatePassword(user)}>Update Password</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 