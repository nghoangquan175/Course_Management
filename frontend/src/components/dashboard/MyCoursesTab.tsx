import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EnrolledCourseCard } from '../course/EnrolledCourseCard';

interface MyCoursesTabProps {
  enrolledCourses: any[];
  courseStatusTab: 'in-progress' | 'completed';
  setCourseStatusTab: (tab: 'in-progress' | 'completed') => void;
  onRateClick: (course: any) => void;
}

export const MyCoursesTab: React.FC<MyCoursesTabProps> = ({ 
  enrolledCourses, 
  courseStatusTab, 
  setCourseStatusTab, 
  onRateClick 
}) => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold">My Courses</h2>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setCourseStatusTab('in-progress')}
            className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${courseStatusTab === 'in-progress' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            In Progress
          </button>
          <button 
            onClick={() => setCourseStatusTab('completed')}
            className={`px-6 py-2 text-xs font-bold rounded-lg transition-all ${courseStatusTab === 'completed' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 pb-10">
        {enrolledCourses.filter((course: any) => {
          if (courseStatusTab === 'in-progress') return course.status !== 'COMPLETED'; 
          if (courseStatusTab === 'completed') return course.status === 'COMPLETED'; 
          return true;
        }).length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {enrolledCourses
              .filter((course: any) => {
                if (courseStatusTab === 'in-progress') return course.status !== 'COMPLETED'; 
                if (courseStatusTab === 'completed') return course.status === 'COMPLETED'; 
                return true;
              })
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
                    hasReviewed: course.hasReviewed
                  }}
                  progress={course.progress || 0}
                  onRateClick={onRateClick}
                />
              ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 p-12 text-center">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-indigo-400 opacity-50" />
            </div>
            <h4 className="text-xl font-bold text-slate-300 mb-2">
              {courseStatusTab === 'in-progress' 
                ? "No courses in progress" 
                : "No completed courses yet"}
            </h4>
            <p className="max-w-xs text-sm opacity-60 mb-8">
              {courseStatusTab === 'in-progress'
                ? "You haven't started any courses yet. Explore our catalog to find your next skill!"
                : "Keep learning! Once you finish a course and claim your certificate, it will appear here."}
            </p>
            {courseStatusTab === 'in-progress' && (
              <Link 
                to="/" 
                className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
              >
                Browse Catalog
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
