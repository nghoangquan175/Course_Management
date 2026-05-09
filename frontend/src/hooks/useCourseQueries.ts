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
        case 'submit':
          return courseService.submit(id);
        case 'withdraw':
          return courseService.withdraw(id);
        case 'approve':
          return courseService.approve(id);
        case 'reject':
          return courseService.reject(id, data?.reason);
        case 'publish':
          return courseService.publish(id);
        case 'unpublish':
          return courseService.unpublish(id);
        case 'delete':
          return courseService.delete(id);
        case 'restore':
          return courseService.restore(id);
        case 'enroll':
          return courseService.enroll(id);
        default:
          throw new Error(`Invalid action: ${action}`);
      }
    },
    onSuccess: (updatedCourse, variables) => {
      // 1. Invalidate all course queries for background sync
      queryClient.invalidateQueries({ queryKey: ['courses'] });

      // 2. Manually update list caches for instant UI response
      queryClient.setQueriesData({ queryKey: ['courses'] }, (oldData: any) => {
        if (!oldData) return oldData;

        const updateList = (list: any[]) => {
          // Find the course in the list
          const index = list.findIndex((c) => c.id === variables.id);
          if (index === -1) return list;

          // If the status has changed, we might need to remove it from this filtered list
          // This logic is simplified: if the query has a status filter and it doesn't match the new status, remove it.
          // Note: statusToUse is not available here easily, so we rely on invalidation for perfect filtering,
          // but we can at least update the status in the 'all' list or matching lists.

          const newList = [...list];
          newList[index] = { ...newList[index], ...updatedCourse };
          return newList;
        };

        if (Array.isArray(oldData)) {
          return updateList(oldData);
        }

        if (oldData.courses && Array.isArray(oldData.courses)) {
          return {
            ...oldData,
            courses: updateList(oldData.courses),
          };
        }

        return oldData;
      });

      // 3. Specifically target detail if applicable
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['courses', 'detail', variables.id] });
      }
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
    },
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
    },
  });
};
