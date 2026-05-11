import React from 'react';
import { useInstructorStudents } from '../../hooks/useCourseQueries';
import { UserManagement } from './UserManagement';

export const InstructorStudentsTab: React.FC = () => {
  const { data: students = [], isLoading } = useInstructorStudents();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <UserManagement users={students} title="My Students" showAddButton={false} />;
};
