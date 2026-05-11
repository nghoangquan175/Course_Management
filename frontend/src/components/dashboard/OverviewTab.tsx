import React from 'react';
import { BookOpen, Clock, Trophy, Star, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from './StatCard';
import { EnrolledCourseCard } from '../course/EnrolledCourseCard';

import { useEnrolledCourses } from '../../hooks/useCourseQueries';

interface OverviewTabProps {
  onRateClick: (course: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onRateClick }) => {
  const { data: enrolledCourses = [], isLoading } = useEnrolledCourses();
  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <StatCard
          label="Enrolled Courses"
          value={enrolledCourses.length.toString()}
          icon={<BookOpen />}
        />
        <StatCard
          label="In Progress"
          value={enrolledCourses.filter((c: any) => c.status !== 'COMPLETED').length.toString()}
          icon={<Clock />}
          trend="Active"
        />
        <StatCard
          label="Completed"
          value={enrolledCourses.filter((c: any) => c.status === 'COMPLETED').length.toString()}
          icon={<Trophy />}
          trend="Well done!"
        />
        <StatCard label="Points" value="0" icon={<Star />} />
      </div>

      {/* Continue Learning */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-indigo-400" /> Continue Learning
        </h3>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : enrolledCourses.filter((c: any) => c.status !== 'COMPLETED').length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 pb-10">
            {enrolledCourses
              .filter((c: any) => c.status !== 'COMPLETED')
              .slice(0, 4)
              .map((course: any) => (
                <EnrolledCourseCard
                  key={course.id}
                  course={{
                    id: course.id,
                    title: course.name,
                    instructor: course.instructor?.name || 'Instructor',
                    thumbnail: course.thumbnailUrl,
                    category: course.category?.name || 'General',
                    rating: course.rating,
                    hasReviewed: course.hasReviewed,
                  }}
                  progress={course.progress || 0}
                  onRateClick={onRateClick}
                />
              ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <BookOpen className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-medium">No courses in your learning queue</p>
            <p className="text-sm opacity-50 mb-6">Start your learning journey today!</p>
            <Link
              to="/"
              className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
            >
              Browse Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
