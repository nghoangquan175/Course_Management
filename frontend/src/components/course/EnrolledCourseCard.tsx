import React from 'react';
import { PlayCircle, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnrolledCourseCardProps {
  course: {
    id: string;
    title: string;
    instructor: string;
    thumbnail: string;
    category: string;
    rating?: number;
    hasReviewed?: boolean;
  };
  progress: number;
  onRateClick?: (course: any) => void;
}

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({ course, progress, onRateClick }) => {
  return (
    <Link to={`/learning/${course.id}`} className="group block">
      <div className="glass rounded-[2rem] border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 flex h-44 shadow-lg hover:shadow-indigo-500/10">
        {/* Left: Thumbnail */}
        <div className="w-64 h-full shrink-0 bg-slate-900 relative overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center italic text-slate-700">
              <PlayCircle className="w-12 h-12 opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950/20" />
          <div className="absolute top-4 left-4">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
              {course.category}
            </span>
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {!course.hasReviewed && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onRateClick) onRateClick(course);
                  }}
                  className="flex items-center gap-1 group/star"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 group-hover/star:scale-125 transition-transform" />
                  <span className="text-[10px] font-bold text-slate-400 group-hover/star:text-amber-400 transition-colors">
                    {course.rating ? course.rating.toFixed(1) : '5.0'}
                  </span>
                </button>
              )}
              {course.hasReviewed && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 opacity-50" />
                  <span className="text-[10px] font-bold text-slate-500">
                    {course.rating ? course.rating.toFixed(1) : '5.0'}
                  </span>
                </div>
              )}
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-[10px] font-medium text-slate-500">By {course.instructor}</span>
            </div>

            <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate leading-tight">
              {course.title}
            </h3>
          </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <Clock className="w-3 h-3" />
                    {progress === 100 ? 'Completed' : 'Current Progress'}
                  </div>
                  <span className={`text-xs font-black ${progress === 100 ? 'text-green-400' : 'text-indigo-400'}`}>
                    {progress}%
                  </span>
                </div>

                <div className="relative">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {/* Glow effect for progress */}
                  <div
                    className={`absolute inset-0 blur-md opacity-20 transition-all duration-1000 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Explicit Rate Button */}
              {!course.hasReviewed && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onRateClick) onRateClick(course);
                  }}
                  className="shrink-0 p-3 bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 rounded-2xl text-slate-400 hover:text-amber-400 transition-all group/rate"
                  title="Rate this course"
                >
                  <Star className="w-5 h-5 group-hover/rate:fill-amber-400 transition-all" />
                </button>
              )}
            </div>
        </div>
      </div>
    </Link>
  );
};
