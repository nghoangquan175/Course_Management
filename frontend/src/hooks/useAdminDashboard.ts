import { useQuery } from '@tanstack/react-query';
import { adminService } from '../api/adminService';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getUsers,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
