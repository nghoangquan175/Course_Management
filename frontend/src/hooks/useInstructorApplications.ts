import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export const useInstructorApplications = () => {
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({
    queryKey: ['instructor-applications'],
    queryFn: async () => {
      const response = await api.get('/instructor-applications');
      return response.data;
    }
  });

  const processApplicationMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string }) => {
      const response = await api.patch(`/instructor-applications/${id}/process`, { status, rejectionReason });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Application processed successfully');
      queryClient.invalidateQueries({ queryKey: ['instructor-applications'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process application');
    }
  });

  return {
    applications: applicationsQuery.data || [],
    isLoading: applicationsQuery.isLoading,
    processApplication: processApplicationMutation.mutate,
    isProcessing: processApplicationMutation.isPending
  };
};
