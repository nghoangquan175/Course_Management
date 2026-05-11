import React from 'react';
import { useAdminUsers } from '../../hooks/useAdminDashboard';
import { UserManagement } from './UserManagement';

export const AdminUsersTab: React.FC = () => {
  const { data: users = [], isLoading } = useAdminUsers();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <UserManagement users={users} title="User Management" showAddButton={true} />;
};
