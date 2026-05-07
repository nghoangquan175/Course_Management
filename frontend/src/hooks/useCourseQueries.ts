import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../api/courseService';
import { reviewService } from '../api/reviewService';

/**
 * Hook for fetching all courses (Admin & Instructor view)
 */
export const useCourses = (filters?: { status?: string; categoryId?: string }) => {
  const statusToUse = filters?.status === 'all' ? undefined : filters?.status;
  
  return useQuery({
    queryKey: ['courses', { ...filters, status: statusToUse }],
    queryFn: () => courseService.getAll({ ...filters, status: statusToUse }),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook for fetching student's enrolled courses
 */
export const useEnrolledCourses = () => {
  return useQuery({
    queryKey: ['courses', 'enrolled'],
    queryFn: () => courseService.getEnrolled(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for fetching a single course by ID
 */
export const useCourseDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['courses', 'detail', id],
    queryFn: () => (id ? courseService.getById(id) : null),
    enabled: !!id,
  });
};

/**
 * Hook for all course-related actions (Mutations)
 */
export const useCourseActions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action, data }: { id: string; action: string; data?: any }) => {
      switch (action) {
        case 'submit': return courseService.submit(id);
        case 'withdraw': return courseService.withdraw(id);
        case 'approve': return courseService.approve(id);
        case 'reject': return courseService.reject(id, data?.reason);
        case 'publish': return courseService.publish(id);
        case 'unpublish': return courseService.unpublish(id);
        case 'delete': return courseService.delete(id);
        case 'restore': return courseService.restore(id);
        case 'enroll': return courseService.enroll(id);
        default: throw new Error(`Invalid action: ${action}`);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate all course queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // Specifically target detail if applicable
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['courses', 'detail', variables.id] });
      }
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
    }
  });
};

/**
 * Hook for submitting a course review
 */
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { courseId: string; rating: number; comment: string }) => 
      reviewService.create(data),
    onSuccess: (_, variables) => {
      // Invalidate course detail to show updated average rating
      queryClient.invalidateQueries({ queryKey: ['courses', 'detail', variables.courseId] });
      // Invalidate enrolled courses if progress/rating is shown there
      queryClient.invalidateQueries({ queryKey: ['courses', 'enrolled'] });
    }
  });
};
