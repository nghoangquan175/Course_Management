import React from 'react';
import { useAdminUsers } from '../../hooks/useAdminDashboard';
import { UserManagement } from './UserManagement';
import { toast } from 'react-hot-toast';

export const AdminUsersTab: React.FC = () => {
  const {
    data: users = [],
    isLoading,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useAdminUsers();

  React.useEffect(() => {
    if (isError && !isLoading) {
      toast.error('Failed to refresh users list. Showing cached data.');
    }
  }, [isError, isLoading]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <UserManagement
      users={users}
      title="User Management"
      showAddButton={true}
      onRefresh={refetch}
      isRefreshing={isFetching}
      dataUpdatedAt={dataUpdatedAt}
    />
  );
};
