import React from 'react';
import { ArrowRight, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Course {
  id: string;
  title: string;
  category: string;
  price: number;
  thumbnail: string;
  rating: number;
  students: number;
  instructor: string;
}

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link to={`/course/${course.id}`} className="block group">
      <div className="glass rounded-3xl border border-white/10 overflow-hidden group-hover:border-indigo-500/50 transition-all flex flex-col h-full hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 duration-300">
        <div className="h-48 bg-slate-900 overflow-hidden relative">
          <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center italic text-slate-600">
             {course.thumbnail ? (
               <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
             ) : (
               "Course Thumbnail"
             )}
          </div>
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-indigo-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider shadow-lg border border-white/20">
              {course.category}
            </span>
          </div>
        </div>
        
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">{course.rating || '5.0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500">{course.students || 0}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">By {course.instructor}</p>
          
          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-5">
            <span className="text-xl font-black text-white">
              {course.price === 0 ? (
                <span className="text-green-400">Free</span>
              ) : (
                `$${course.price}`
              )}
            </span>
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-2 group-hover:gap-3 transition-all">
              View Details <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
