import React from 'react';
import { Award, Star, LayoutDashboard, Users, ExternalLink } from 'lucide-react';

import { useEnrolledCourses } from '../../hooks/useCourseQueries';

export const AchievementsTab: React.FC = () => {
  const { data: enrolledCourses = [], isLoading } = useEnrolledCourses();
  const completedCourses = enrolledCourses.filter((c: any) => c.status === 'COMPLETED');

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-8">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold">Your Achievements</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-bold">
          <Award className="w-4 h-4" />
          <span>{completedCourses.length} Certificates Earned</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 pb-10">
        {completedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="glass rounded-[2rem] border border-white/10 overflow-hidden group hover:border-green-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-lg shadow-lg">
                    COMPLETED
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                      {course.category?.name || 'Education'}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">{course.rating || 5.0}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mb-4 line-clamp-2 leading-snug group-hover:text-green-400 transition-colors">
                    {course.name}
                  </h3>

                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>100% Completed</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Graduated</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold text-center">
                        COMPLETED
                      </div>
                      <button
                        onClick={() =>
                          course.certificateUrl && window.open(course.certificateUrl, '_blank')
                        }
                        className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        Certificate <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 p-12 text-center">
            <Award className="w-16 h-16 mb-6 opacity-10" />
            <h4 className="text-xl font-bold text-slate-300 mb-2">No achievements yet</h4>
            <p className="max-w-xs text-sm opacity-60">
              Complete your first course and pass the final exam to earn a verified certificate!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
