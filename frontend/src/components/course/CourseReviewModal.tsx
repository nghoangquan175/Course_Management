import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, X, Loader2, Users, BookOpen } from 'lucide-react';
import { useSubmitReview } from '../../hooks/useCourseQueries';
import { toast } from 'react-hot-toast';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment is too long'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface CourseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    name: string;
    thumbnailUrl: string;
    instructorName?: string;
    totalStudents?: number;
    averageRating?: number;
  };
}

export const CourseReviewModal: React.FC<CourseReviewModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [hoverRating, setHoverRating] = useState(0);
  const { mutate: submitReview } = useSubmitReview();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const rating = watch('rating');

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStatus('idle');
        reset();
      }, 300);
    }
  }, [isOpen, reset]);

  const onSubmit = (data: ReviewFormData) => {
    setStatus('submitting');
    submitReview(
      { courseId: course.id, ...data },
      {
        onSuccess: () => {
          setStatus('success');
          setTimeout(() => {
            onClose();
          }, 2500);
        },
        onError: (error: any) => {
          setStatus('idle');
          toast.error(error.response?.data?.message || 'Failed to submit review');
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {status === 'idle' || status === 'submitting' ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col md:flex-row w-full h-full"
                >
                  {/* Left Column: Review Form */}
                  <div className="flex-1 p-8 md:p-12 flex flex-col border-r border-white/5">
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Rate this Course</h2>
                      <p className="text-slate-400 text-sm">
                        Your feedback helps us improve and helps other students.
                      </p>
                    </div>

                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="flex-1 flex flex-col space-y-8"
                    >
                      {/* Star Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                          Your Rating
                        </label>
                        <div
                          className="flex items-center gap-2"
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onClick={() => setValue('rating', star)}
                              className="p-1 transition-transform active:scale-90"
                            >
                              <Star
                                className={`w-10 h-10 transition-all ${
                                  star <= (hoverRating || rating)
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                    : 'text-slate-700'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        {errors.rating && (
                          <p className="text-red-500 text-xs font-medium">
                            {errors.rating.message}
                          </p>
                        )}
                      </div>

                      {/* Comment Area */}
                      <div className="flex-1 flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                            Your Review
                          </label>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                            {watch('comment').length}/500
                          </span>
                        </div>
                        <textarea
                          {...register('comment')}
                          placeholder="Share your thoughts about the course, the teaching style, and what you learned..."
                          className={`flex-1 w-full bg-white/5 border rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none ${
                            errors.comment
                              ? 'border-red-500/50'
                              : 'border-white/10 focus:border-indigo-500/50'
                          }`}
                        />
                        {errors.comment && (
                          <p className="text-red-500 text-xs font-medium">
                            {errors.comment.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 group"
                      >
                        {status === 'submitting' ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Submitting Review...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            <span>Submit Feedback</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Course Info (Glass card) */}
                  <div className="w-full md:w-[350px] bg-slate-900/50 p-8 md:p-10 flex flex-col">
                    <div className="glass rounded-[2rem] border border-white/5 overflow-hidden flex flex-col h-full">
                      <div className="relative aspect-video">
                        <img
                          src={
                            course.thumbnailUrl ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                        <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-500/90 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest backdrop-blur-md">
                          Reviewing Course
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 leading-tight">
                          {course.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">
                          Instructor: {course.instructorName || 'Expert Mentor'}
                        </p>

                        <div className="mt-auto space-y-4">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Users className="w-4 h-4" />
                              <span>Enrolled Students</span>
                            </div>
                            <span className="font-bold text-white">
                              {course.totalStudents?.toLocaleString() || '1,248'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                              <BookOpen className="w-4 h-4" />
                              <span>Course Rating</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-indigo-400">
                                {(course.averageRating || 0).toFixed(1)}
                              </span>
                              <Star className="w-3 h-3 fill-indigo-400 text-indigo-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center h-full w-full bg-slate-900 z-20"
                >
                  <div className="relative w-32 h-32 mb-8">
                    {/* Circle Background */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                      className="absolute inset-0 bg-green-500/20 rounded-full"
                    />

                    {/* Drawing Checkmark Animation */}
                    <svg viewBox="0 0 52 52" className="w-full h-full text-green-500 relative z-10">
                      <motion.circle
                        cx="26"
                        cy="26"
                        r="25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                      <motion.path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 27l7.5 7.5L38 18"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.6, ease: 'easeInOut' }}
                      />
                    </svg>
                  </div>

                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="text-3xl font-bold text-white mb-4"
                  >
                    Successfully Submitted!
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-slate-400 max-w-sm"
                  >
                    Your feedback is very important to us. Redirecting you back shortly...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
