import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Star,
  Users,
  Clock,
  PlayCircle,
  CheckCircle,
  Globe,
  BarChart,
  Lock,
  Play,
} from 'lucide-react';
import { courseService } from '../../api/courseService';
import { getStreamingUrl, formatDuration } from '../../utils/videoUtils';
import { useCourseDetail } from '../../hooks/useCourseQueries';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

export const PublicCourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: course, isLoading } = useCourseDetail(id || '', false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/course/${id}` } });
      return;
    }

    if (course.userEnrollment) {
      if (course.userEnrollment.status === 'COMPLETED' && course.userEnrollment.certificateUrl) {
        window.open(course.userEnrollment.certificateUrl, '_blank');
      } else {
        navigate(`/learning/${id}`);
      }
      return;
    }

    try {
      await courseService.enroll(id!);
      navigate(`/learning/${id}`);
    } catch (error: any) {
      if (error.response?.status === 200 || error.response?.data?.message?.includes('already')) {
        navigate(`/learning/${id}`);
      } else {
        toast.error(error.response?.data?.message || 'Enrollment failed. Please try again.');
      }
    }
  };

  if (isLoading) return <FullscreenLoader />;
  if (!course)
    return <div className="min-h-screen flex items-center justify-center">Course not found</div>;

  const reviewCount = course.reviews?.length || 0;
  const ratingValue = course.rating || 5.0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pt-12 pb-20">
      {/* Header / Breadcrumbs */}
      <div className="container mx-auto px-6 max-w-[1440px]">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to="/" className="hover:text-indigo-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="hover:text-indigo-400 transition-colors cursor-pointer">Courses</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-300 truncate">
            {course.category?.name || 'Uncategorized'}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">{course.name}</h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-3xl">
              {course.description ||
                'Khóa học chuyên sâu giúp bạn làm chủ các kỹ năng thực tế và tư duy đột phá trong lĩnh vực này.'}
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-12">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-bold">{ratingValue}</span>
                <span className="text-slate-500 text-sm">({reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span className="font-bold">{course.totalStudents || 0}</span>
                <span className="text-slate-500 text-sm">students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">Instructor:</span>
                <span className="font-bold text-indigo-400">
                  {course.instructor?.name || 'Expert Instructor'}
                </span>
              </div>
            </div>

            {/* Curriculum Section */}
            <div className="space-y-8">
              <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="overflow-hidden">
                  {course.lessons && course.lessons.length > 0 ? (
                    course.lessons.map((lesson: any, idx: number) => (
                      <div
                        key={lesson.id}
                        className="p-5 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <PlayCircle className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                          <div>
                            <p className="text-sm font-medium">
                              Lesson {idx + 1}: {lesson.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDuration(lesson.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Lock className="w-4 h-4 text-slate-600" />
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-slate-500 italic text-sm">
                      Content is being updated...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-16">
              <h2 className="text-2xl font-black mb-8">Student Reviews</h2>
              {course.reviews && course.reviews.length > 0 ? (
                <div className="grid gap-6">
                  {course.reviews.map((review: any) => (
                    <div key={review.id} className="p-6 glass rounded-[2rem] border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                            {review.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">
                              {review.user?.name || 'Anonymous User'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed italic">
                        "{review.comment || 'No comment provided.'}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 glass rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500">
                  <Star className="w-12 h-12 mb-4 opacity-20" />
                  <p className="italic">No reviews yet for this course.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Floating Card */}
          <div className="lg:w-[400px]">
            <div className="sticky top-32 glass rounded-[2.5rem] border border-white/10 p-4 shadow-2xl overflow-hidden group">
              {/* Preview Area */}
              <div className="relative aspect-video rounded-[2rem] overflow-hidden mb-6 bg-slate-900 border border-white/5">
                {isPreviewPlaying ? (
                  <video
                    src={course.lessons?.[0]?.videoUrl || course.thumbnailUrl} // Fallback to thumbnail or first lesson
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                  >
                    <source
                      src={getStreamingUrl(course.lessons?.[0]?.videoUrl)}
                      type="application/x-mpegURL"
                    />
                  </video>
                ) : (
                  <>
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <PlayCircle className="w-16 h-16 opacity-20" />
                      </div>
                    )}
                    <div
                      className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group-hover:bg-slate-950/20 transition-all cursor-pointer"
                      onClick={() => setIsPreviewPlaying(true)}
                    >
                      <div className="w-16 h-16 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl shadow-white/20 transform group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="text-xs font-bold text-white drop-shadow-md">
                        Watch Preview
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Price & Action */}
              <div className="px-4 pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl font-black text-white">Free</span>
                  <span className="text-lg text-slate-500 line-through">1.500.000đ</span>
                  <span className="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold rounded-lg uppercase">
                    Sale
                  </span>
                </div>

                <button
                  onClick={handleEnroll}
                  className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl mb-4 transform active:scale-[0.98] flex flex-col items-center justify-center ${
                    course.userEnrollment?.status === 'COMPLETED'
                      ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20 hover:-translate-y-1'
                      : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20 hover:-translate-y-1'
                  }`}
                >
                  <span className="text-lg">
                    {course.userEnrollment
                      ? course.userEnrollment.status === 'COMPLETED'
                        ? 'COMPLETED'
                        : 'GO TO COURSE'
                      : 'ENROLL NOW'}
                  </span>
                  {course.userEnrollment?.status === 'COMPLETED' && (
                    <span className="text-[10px] font-bold opacity-80 flex items-center gap-1 mt-0.5">
                      View Certificate <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-500 font-medium">
                  Start learning for free
                </p>

                {/* Features List */}
                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                  <p className="text-sm font-bold text-slate-300">This course includes:</p>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <PlayCircle className="w-4 h-4 text-indigo-400" />
                      <span>{course.lessons?.length || 0} high-quality video lessons</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <BarChart className="w-4 h-4 text-indigo-400" />
                      <span>Intermediate level</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>Language: English</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <CheckCircle className="w-4 h-4 text-indigo-400" />
                      <span>Lifetime access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
