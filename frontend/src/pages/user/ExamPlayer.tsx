import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  X,
  Award,
  ArrowRight
} from 'lucide-react';
import { examService } from '../../api/examService';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { toast } from 'react-hot-toast';

export const ExamPlayer: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const fetchExam = async () => {
      try {
        if (!lessonId) return;

        // Check for resultId in query params for Review Mode
        const searchParams = new URLSearchParams(location.search);
        const resultId = searchParams.get('resultId');

        const data = await examService.getLessonExam(lessonId);
        if (!data) {
          toast.error('No quiz found for this lesson');
          navigate(-1);
          return;
        }
        setExam(data);

        if (resultId) {
          const resultData = await examService.getResultById(resultId);
          if (resultData) {
            setResult(resultData);
            setAnswers(resultData.userAnswers || {});
            setIsReviewMode(true);
            setShowStartModal(false);
          }
        }

        if (data.lesson?.course?.lessons) {
          setCourseLessons(data.lesson.course.lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
        }
        if (data.timeLimit > 0 && !resultId) {
          setTimeLeft(data.timeLimit * 60);
        }
      } catch (error) {
        toast.error('Failed to load quiz');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExam();
  }, [lessonId, location.search]);

  useEffect(() => {
    if (!showStartModal && timeLeft !== null && timeLeft > 0 && !result) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return (prev !== null) ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showStartModal, timeLeft, result]);

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const scrollToQuestion = (questionId: string) => {
    questionRefs.current[questionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await examService.submitExam(exam.id, answers);
      setResult(res);
      setShowConfirmSubmit(false);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <FullscreenLoader />;
  if (!exam) return null;

  const questions = exam.questions || [];
  const answeredCount = Object.keys(answers).length;

  // Start Modal
  if (showStartModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-xl w-full text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Clock className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black mb-4">{exam.title}</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            {exam.description || `This quiz has ${questions.length} questions. You need ${exam.passingScore}% to pass.`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10 text-left">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Time Limit</p>
              <p className="font-bold">{exam.timeLimit > 0 ? `${exam.timeLimit} Minutes` : 'No Limit'}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Questions</p>
              <p className="font-bold">{questions.length} Questions</p>
            </div>
          </div>

          <button
            onClick={() => setShowStartModal(false)}
            className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 transform hover:-translate-y-1"
          >
            START QUIZ NOW
          </button>
        </div>
      </div>
    );
  }

  // Result View
  if (result && !isReviewMode) {
    // Check if truly all lessons are completed
    const completedLessonIds = new Set(location.state?.completedLessonIds || []);
    if (result.isPassed) {
      completedLessonIds.add(lessonId as string);
    }
    const isCourseFinished = courseLessons.length > 0 && courseLessons.every(l => completedLessonIds.has(l.id));

    const currentIdx = courseLessons.findIndex(l => l.id === lessonId);
    const nextLesson = currentIdx !== -1 && currentIdx < courseLessons.length - 1 ? courseLessons[currentIdx + 1] : null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6 overflow-y-auto">
        <div className="bg-slate-900 border border-white/10 rounded-[3rem] p-12 max-w-2xl w-full text-center shadow-2xl animate-in zoom-in duration-500">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${result.isPassed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {result.isPassed ? <Award className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
          </div>
          <h2 className="text-4xl font-black mb-2">{result.isPassed ? 'Congratulations!' : 'Keep Trying!'}</h2>
          <p className="text-slate-400 mb-10 text-lg">
            {result.isPassed
              ? `You passed the quiz with a score of ${result.score}%!`
              : `You didn't pass this time. You got ${result.score}%, but you need ${exam.passingScore}% to pass.`}
          </p>

          <div className="bg-white/5 rounded-3xl p-8 mb-10 border border-white/5 grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-slate-500 mb-1">Your Score</p>
              <p className={`text-4xl font-black ${result.isPassed ? 'text-green-500' : 'text-red-500'}`}>{result.score}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Result</p>
              <p className={`text-4xl font-black ${result.isPassed ? 'text-green-500' : 'text-red-500'}`}>{result.isPassed ? 'PASS' : 'FAIL'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsReviewMode(true)}
                className="py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
              >
                REVIEW QUIZ
              </button>
              
              {!result.isPassed ? (
                /* Rule 1: Only show RETAKE if failed */
                <button
                  onClick={() => { setResult(null); setAnswers({}); setTimeLeft(exam.timeLimit * 60); setShowStartModal(true); }}
                  className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all"
                >
                  RETAKE QUIZ
                </button>
              ) : (
                /* Passed Case */
                <>
                  {(!nextLesson && isCourseFinished) ? (
                    /* Rule 2: Pass + Final Lesson + 100% Progress */
                    <button
                      onClick={() => navigate(`/learning/${exam?.lesson?.courseId || ''}`)}
                      className="py-4 bg-amber-500 hover:bg-amber-400 text-white font-black rounded-2xl transition-all"
                    >
                      GET CERTIFICATE
                    </button>
                  ) : (
                    /* Rule 3: Pass + (Not Final OR Incomplete) */
                    <button
                      onClick={() => {
                        const currentIdx = courseLessons.findIndex(l => l.id === lessonId);
                        
                        // 1. Search forward for the next incomplete lesson
                        let targetLesson = courseLessons.slice(currentIdx + 1).find(l => !completedLessonIds.has(l.id));
                        
                        // 2. Fallback: If no incomplete lessons forward, find the first one from the beginning
                        if (!targetLesson) {
                          targetLesson = courseLessons.slice(0, currentIdx).find(l => !completedLessonIds.has(l.id));
                        }
                        
                        navigate(`/learning/${exam?.lesson?.courseId || ''}`, { 
                          state: { lessonId: targetLesson?.id } 
                        });
                      }}
                      className="py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      NEXT LESSON <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-4 text-slate-400 font-bold hover:text-white transition-colors"
            >
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-50">
      {/* Header */}
      <header className="h-20 shrink-0 border-b border-white/10 bg-slate-900/50 flex items-center justify-between px-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => isReviewMode ? setIsReviewMode(false) : setShowConfirmSubmit(true)}
            className="p-3 hover:bg-white/5 rounded-2xl transition-colors"
          >
            {isReviewMode ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
          <div className="h-8 w-px bg-white/10"></div>
          <h1 className="text-xl font-bold">{isReviewMode ? `Review: ${exam.title}` : exam.title}</h1>
        </div>

        <div className="flex items-center gap-10">
          {!isReviewMode && timeLeft !== null && (
            <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border ${timeLeft < 60 ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-slate-300'}`}>
              <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'animate-spin-slow' : ''}`} />
              <span className="font-mono text-xl font-black">{formatTime(timeLeft)}</span>
            </div>
          )}
          {!isReviewMode ? (
            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-3"
            >
              <Send className="w-5 h-5" /> SUBMIT EXAM
            </button>
          ) : (
            <button
              onClick={() => setIsReviewMode(false)}
              className="px-8 py-3 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-200 transition-all"
            >
              BACK TO RESULTS
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Questions List */}
        <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-12 pb-32">
            {questions.map((q: any, idx: number) => (
              <div
                key={q.id}
                ref={(el) => { questionRefs.current[q.id] = el; }}
                className="p-10 glass rounded-[2.5rem] border border-white/5 shadow-xl hover:border-white/10 transition-all group"
              >
                <div className="flex items-start gap-6 mb-8">
                  <span className="w-9 h-9 shrink-0 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center font-black text-sm border border-indigo-500/20">
                    {idx + 1}
                  </span>
                  <h3 className="text-xl font-bold leading-relaxed pt-0.5">{q.questionText}</h3>
                </div>

                <div className="grid gap-4 ml-18">
                  {q.options && q.options.map((opt: string, optIdx: number) => {
                    const isSelected = answers[q.id] === optIdx;
                    const isCorrect = q.correctAnswerIndex === optIdx;

                    let borderColor = 'border-white/5';
                    let bgColor = 'bg-white/5';
                    if (isSelected) {
                      borderColor = 'border-indigo-500';
                      bgColor = 'bg-indigo-500/20';
                    }
                    if (isReviewMode) {
                      if (isCorrect) {
                        borderColor = 'border-green-500';
                        bgColor = 'bg-green-500/20';
                      } else if (isSelected && !isCorrect) {
                        borderColor = 'border-red-500';
                        bgColor = 'bg-red-500/20';
                      }
                    }

                    return (
                      <div key={optIdx} className="relative">
                        <button
                          onClick={() => handleOptionSelect(q.id, optIdx)}
                          disabled={isReviewMode}
                          className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all group/opt ${borderColor} ${bgColor} ${!isReviewMode && 'hover:border-white/20 hover:bg-white/[0.08]'}`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected || (isReviewMode && isCorrect)
                            ? (isReviewMode && isCorrect ? 'border-green-400 bg-green-400' : 'border-indigo-400 bg-indigo-400') + ' text-slate-950'
                            : 'border-slate-700 group-hover/opt:border-slate-500'
                            }`}>
                            {(isSelected || (isReviewMode && isCorrect)) && <CheckCircle className="w-4 h-4 fill-current" />}
                          </div>
                          <span className={`text-sm font-medium ${isSelected || (isReviewMode && isCorrect) ? 'text-white' : 'text-slate-400'}`}>
                            {opt}
                          </span>
                        </button>
                        {isReviewMode && isCorrect && !isSelected && (
                          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">CORRECT ANSWER</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isReviewMode && q.explanation && (
                  <div className="mt-6 p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                    <p className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4" /> EXPLANATION
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed italic">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Question Navigation */}
        <aside className="w-96 border-l border-white/10 bg-slate-900/30 p-8 flex flex-col gap-8">
          <div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Question Navigation</h3>
            <div className="grid grid-cols-4 gap-3">
              {questions.map((q: any, idx: number) => (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center font-black text-sm transition-all border ${answers[q.id] !== undefined
                    ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-6 bg-white/5 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-bold">Progress</span>
              <span className="text-xs font-black">{Math.round((answeredCount / questions.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 text-center">
              Answered {answeredCount} out of {questions.length} questions
            </p>
          </div>
        </aside>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black mb-3">Submit your exam?</h3>
            <p className="text-slate-400 mb-8">
              {answeredCount < questions.length
                ? `You have only answered ${answeredCount}/${questions.length} questions. Are you sure you want to submit?`
                : "You have answered all questions. Ready to see your results?"}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-2xl transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
              >
                {isSubmitting ? 'SUBMITTING...' : 'YES, SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
