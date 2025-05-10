// src/pages/admin/AdminUsersPage.tsx
import React, { useState } from 'react';
import { useUsersQuery } from '../../hooks/queries/useUsersQuery';
import { UserTable } from '../../components/admin/UserTable';
import { UserFormModal } from '../../components/admin/UserFormModal';
import { AssignAgentModal } from '../../components/admin/AssignAgentModal';
import { UpdatePasswordModal } from '../../components/admin/UpdatePasswordModal';
import { Button } from '../../components/ui/button';
import { UserProfile } from '../../types';

const AdminUsersPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [assignAgent, setAssignAgent] = useState<UserProfile | null>(null);
  const [updatePasswordUser, setUpdatePasswordUser] = useState<UserProfile | null>(null);
  const { data: users, isLoading, refetch } = useUsersQuery({});

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setShowCreateModal(true)} variant="default">+ Create User</Button>
      </div>
      <UserTable
        users={users || []}
        loading={isLoading}
        onEdit={user => setEditUser(user)}
        onAssign={user => setAssignAgent(user)}
        onUpdatePassword={user => setUpdatePasswordUser(user)}
        onRefresh={refetch}
      />
      <UserFormModal
        open={showCreateModal || !!editUser}
        onClose={() => { setShowCreateModal(false); setEditUser(null); }}
        user={editUser}
        onSuccess={() => { setShowCreateModal(false); setEditUser(null); refetch(); }}
      />
      <AssignAgentModal
        open={!!assignAgent}
        onClose={() => setAssignAgent(null)}
        agent={assignAgent}
        onSuccess={() => { setAssignAgent(null); refetch(); }}
      />
      <UpdatePasswordModal
        open={!!updatePasswordUser}
        onClose={() => setUpdatePasswordUser(null)}
        user={updatePasswordUser}
        onSuccess={() => setUpdatePasswordUser(null)}
      />
    </div>
  );
};

export default AdminUsersPage; 