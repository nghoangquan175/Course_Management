import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Users,
  Tag,
  Clock,
  BarChart3,
  PlayCircle,
  FileText,
  ChevronLeft,
  Download,
  BookOpen,
  CheckCircle2,
  XCircle,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { examService } from '../../api/examService';
import { toast } from 'react-hot-toast';
import { getStreamingUrl } from '../../utils/videoUtils';
import { useCourseActions, useCourseDetail } from '../../hooks/useCourseQueries';
import { Modal } from '../common/Modal';

interface CourseDetailViewProps {
  courseId: string;
  onBack: () => void;
  isAdmin?: boolean;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseId,
  onBack,
  isAdmin = false,
}) => {
  const { data: course, isLoading } = useCourseDetail(courseId, true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [isExamLoading, setIsExamLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [activeWorkflowAction, setActiveWorkflowAction] = useState<'approve' | 'reject' | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState('');

  const courseActions = useCourseActions();

  useEffect(() => {
    if (selectedLesson) {
      const fetchExam = async () => {
        setIsExamLoading(true);
        try {
          const data = await examService.getLessonExam(selectedLesson.id);
          setExam(data);
        } catch (error) {
          console.error('Failed to load exam:', error);
          setExam(null);
        } finally {
          setIsExamLoading(false);
        }
      };
      fetchExam();
    }
  }, [selectedLesson]);

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  const handleLessonSelect = (lesson: any) => {
    setVideoError(false);
    setSelectedLesson(lesson);
  };

  const handleWorkflowAction = async () => {
    if (!activeWorkflowAction) return;

    courseActions.mutate(
      {
        id: courseId,
        action: activeWorkflowAction,
        data: activeWorkflowAction === 'reject' ? { reason: rejectionReason } : undefined,
      },
      {
        onSuccess: () => {
          setIsWorkflowModalOpen(false);
          setActiveWorkflowAction(null);
          setRejectionReason('');
          toast.success(`Course ${activeWorkflowAction} successfully`);
          onBack();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors: any = {
    DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    CONTENT_APPROVED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    PUBLISHED: 'bg-green-500/10 text-green-500 border-green-500/20',
    UNPUBLISHED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col min-h-0 pb-8 overflow-x-hidden"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Preview Course</h2>
            <p className="text-slate-500 text-sm">Reviewing curriculum and metadata.</p>
          </div>
        </div>

        {isAdmin && course.status === 'PENDING' && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setActiveWorkflowAction('reject');
                setIsWorkflowModalOpen(true);
              }}
              className="px-6 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl text-sm font-bold border border-rose-500/20 transition-all flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => {
                setActiveWorkflowAction('approve');
                setIsWorkflowModalOpen(true);
              }}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Approve Course
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Curriculum */}
          <div className="lg:col-span-7 h-full min-w-0">
            <div className="glass p-8 rounded-3xl border border-white/5 h-full space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold">Course Curriculum</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {course.lessons?.length || 0} Lessons total
                </span>
              </div>

              <div className="space-y-3">
                {course.lessons && course.lessons.length > 0 ? (
                  course.lessons
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((lesson: any, index: number) => (
                      <div
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson)}
                        className={`glass px-5 py-3 rounded-2xl border transition-all group flex items-center justify-between cursor-pointer ${
                          selectedLesson?.id === lesson.id
                            ? 'border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                              selectedLesson?.id === lesson.id
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-white/5 text-slate-500 border-white/5 group-hover:border-indigo-500/30 group-hover:text-indigo-400'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4
                              className={`text-sm font-bold transition-colors ${
                                selectedLesson?.id === lesson.id
                                  ? 'text-white'
                                  : 'text-slate-200 group-hover:text-white'
                              }`}
                            >
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                {lesson.textContent ? (
                                  <FileText className="w-3 h-3" />
                                ) : (
                                  <PlayCircle className="w-3 h-3" />
                                )}
                                {lesson.textContent && lesson.videoUrl
                                  ? 'VIDEO + TEXT'
                                  : lesson.videoUrl
                                    ? 'VIDEO'
                                    : 'TEXT'}
                              </span>
                              <span className="text-[10px] text-slate-600">•</span>
                              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Clock className="w-3 h-3" />
                                {formatDuration(lesson.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <PlayCircle
                          className={`w-4 h-4 transition-all ${
                            selectedLesson?.id === lesson.id
                              ? 'text-indigo-400 opacity-100'
                              : 'text-slate-700 opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </div>
                    ))
                ) : (
                  <div className="p-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <PlayCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 italic text-sm">
                      No lessons have been added to this course yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Course Overview OR Lesson Content */}
          <div className="lg:col-span-5 min-w-0 h-full">
            <AnimatePresence mode="wait" initial={false}>
              {!selectedLesson ? (
                <motion.div
                  key="course-overview"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  {/* Main Info Card */}
                  <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                    {/* Thumbnail */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl group mb-6">
                      <img
                        src={
                          course.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop'
                        }
                        alt={course.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-2xl ${statusColors[course.status]}`}
                        >
                          {course.status}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-4">
                      <h1 className="text-2xl font-black text-white leading-tight">
                        {course.name}
                      </h1>
                      <p className="text-slate-400 leading-relaxed text-sm italic font-light line-clamp-6">
                        {course.description || 'No description provided for this course.'}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                            Students
                          </span>
                        </div>
                        <span className="text-xl font-black">{course.totalStudents || 0}</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="w-4 h-4 text-amber-400" />
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                            Rating
                          </span>
                        </div>
                        <span className="text-xl font-black">{course.rating || 0}/5.0</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Tag className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-400">Category</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20">
                          {course.category?.name || 'Uncategorized'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-400">Created At</span>
                        </div>
                        <span className="text-xs font-bold text-slate-300">
                          {new Date(course.createdAt).toLocaleDateString('en-US', {
                            dateStyle: 'medium',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Instructor Quick Info */}
                  <div className="glass p-6 rounded-3xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
                      {course.instructor?.name?.charAt(0) || 'I'}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                        Instructor
                      </p>
                      <p className="text-sm font-bold text-slate-200">
                        {course.instructor?.name || 'Expert Instructor'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="lesson-preview"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {/* Back Button & Title */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => handleLessonSelect(null)}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Overview
                    </button>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Lesson Preview
                    </span>
                  </div>

                  <div className="glass p-6 rounded-3xl border border-white/10 space-y-6">
                    {/* Video Player Section */}
                    {selectedLesson.videoUrl && (
                      <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-white/5 relative group">
                        <video
                          key={`${selectedLesson.id}-${videoError}`}
                          className="w-full h-full"
                          controls
                          controlsList="nodownload"
                          playsInline
                          onContextMenu={(e) => e.preventDefault()}
                          onRateChange={(e: any) => {
                            localStorage.setItem(
                              'videoPlaybackRate',
                              e.target.playbackRate.toString()
                            );
                          }}
                          onVolumeChange={(e: any) => {
                            localStorage.setItem('videoVolume', e.target.volume.toString());
                          }}
                          onLoadedMetadata={(e: any) => {
                            const savedVolume = localStorage.getItem('videoVolume');
                            const savedRate = localStorage.getItem('videoPlaybackRate');
                            if (savedVolume !== null) e.target.volume = parseFloat(savedVolume);
                            if (savedRate !== null) e.target.playbackRate = parseFloat(savedRate);
                          }}
                          onError={() => {
                            if (!videoError) {
                              console.warn('HLS fail, falling back to MP4');
                              setVideoError(true);
                            }
                          }}
                        >
                          <source
                            src={
                              videoError
                                ? selectedLesson.videoUrl
                                : getStreamingUrl(selectedLesson.videoUrl)
                            }
                            type={
                              videoError || !selectedLesson.videoUrl.includes('cloudinary')
                                ? 'video/mp4'
                                : 'application/x-mpegURL'
                            }
                          />
                          {/* Second fallback in case the source tag fails to switch properly */}
                          <source src={selectedLesson.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white">{selectedLesson.title}</h2>

                      {/* Rich Text Content */}
                      {selectedLesson.textContent && (
                        <div
                          className="prose prose-invert prose-sm max-w-none text-slate-400 break-words overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: selectedLesson.textContent }}
                        />
                      )}

                      {/* Attachments */}
                      {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                          <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Download className="w-3 h-3" />
                            Attachments ({selectedLesson.attachments.length})
                          </h5>
                          <div className="space-y-2">
                            {selectedLesson.attachments.map((file: any) => (
                              <a
                                key={file.id}
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-slate-500" />
                                  <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                                    {file.fileName || 'Document File'}
                                  </span>
                                </div>
                                <Download className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quiz Preview Section */}
                      <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen className="w-3 h-3" />
                            Lesson Quiz
                          </h5>
                          {exam ? (
                            <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full font-bold">
                              {exam.questions?.length || 0} Questions
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic">
                              No quiz for this lesson
                            </span>
                          )}
                        </div>

                        {isExamLoading ? (
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 italic py-4">
                            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            Loading quiz preview...
                          </div>
                        ) : (
                          exam && (
                            <div className="space-y-4">
                              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                <p className="text-xs text-indigo-300 font-medium mb-1">
                                  {exam.title}
                                </p>
                                <div className="flex gap-4">
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    Time: {exam.timeLimit} mins
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    Passing: {exam.passingScore}%
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {exam.questions?.map((q: any, qIdx: number) => (
                                  <div
                                    key={q.id}
                                    className="p-4 bg-white/5 rounded-2xl border border-white/5"
                                  >
                                    <p className="text-xs font-bold text-slate-300 mb-3 flex gap-2">
                                      <span className="text-indigo-400">Q{qIdx + 1}.</span>
                                      {q.questionText}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                      {q.options?.map((opt: string, optIdx: number) => (
                                        <div
                                          key={optIdx}
                                          className={`px-3 py-2 rounded-xl text-[10px] flex items-center justify-between ${
                                            optIdx === q.correctAnswerIndex
                                              ? 'bg-green-500/10 border border-green-500/20 text-green-400 font-bold'
                                              : 'bg-white/5 text-slate-500'
                                          }`}
                                        >
                                          <span>{opt}</span>
                                          {optIdx === q.correctAnswerIndex && (
                                            <CheckCircle2 className="w-3 h-3" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Workflow Confirmation Modal */}
      <Modal
        isOpen={isWorkflowModalOpen}
        onClose={() => {
          if (!courseActions.isPending) setIsWorkflowModalOpen(false);
        }}
        title={activeWorkflowAction === 'approve' ? 'Approve Course' : 'Reject Course'}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsWorkflowModalOpen(false)}
              className="px-6 py-2 text-slate-400 text-sm font-bold hover:text-white transition-colors"
              disabled={courseActions.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleWorkflowAction}
              className={`px-8 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                activeWorkflowAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-500 shadow-green-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              } disabled:opacity-50`}
              disabled={
                courseActions.isPending ||
                (activeWorkflowAction === 'reject' && !rejectionReason.trim())
              }
            >
              {courseActions.isPending
                ? 'Processing...'
                : activeWorkflowAction === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
              activeWorkflowAction === 'approve' ? 'bg-green-500/10' : 'bg-rose-500/10'
            }`}
          >
            {activeWorkflowAction === 'approve' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-500" />
            )}
          </div>

          <h3 className="text-xl font-bold mb-2">
            {activeWorkflowAction === 'approve' ? 'Approve this course?' : 'Reject this course?'}
          </h3>
          <p className="text-slate-400 text-sm text-center mb-6 max-w-sm">
            {activeWorkflowAction === 'approve'
              ? 'Once approved, the course will be moved to CONTENT_APPROVED status and will be ready for publishing.'
              : 'Please provide a reason for rejection. This will be sent to the instructor so they can make necessary changes.'}
          </p>

          {activeWorkflowAction === 'reject' && (
            <div className="w-full space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this course is being rejected..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50 transition-all resize-none"
              />
              <p className="text-[10px] text-rose-500/70 italic">
                * Rejection reason is required to notify the instructor.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
};
