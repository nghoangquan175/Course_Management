import React from 'react';
import { FileText, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';
import { useExamResults } from '../../hooks/useCourseQueries';
import { useNavigate } from 'react-router-dom';

export const ExamsTab: React.FC = () => {
  const navigate = useNavigate();
  const { data: results = [], isLoading } = useExamResults();

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-8">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold">Exams & Assignments</h2>
        <div className="text-sm text-slate-500 font-medium">Total Attempts: {results.length}</div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 pb-10">
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result: any) => {
              const lesson = result.exam?.lesson;
              const course = lesson?.course;

              return (
                <div
                  key={result.id}
                  className="glass rounded-3xl border border-white/5 p-6 hover:border-white/10 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Status Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${result.isPassed ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                    >
                      {result.isPassed ? (
                        <CheckCircle2 className="w-8 h-8" />
                      ) : (
                        <XCircle className="w-8 h-8" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span className="text-indigo-400">{course?.name || 'Course'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">
                          {new Date(result.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate mb-1">
                        {lesson?.title || 'Lesson Quiz'}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(result.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={result.isPassed ? 'text-green-400' : 'text-red-400'}>
                            Score: {result.score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/exam/${lesson.id}?resultId=${result.id}`)}
                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/5"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => navigate(`/exam/${lesson.id}`)}
                        className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                      >
                        <Play className="w-3 h-3 fill-current" /> Retake
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 p-12 text-center">
            <FileText className="w-16 h-16 mb-6 opacity-10" />
            <h4 className="text-xl font-bold text-slate-300 mb-2">No quiz attempts yet</h4>
            <p className="max-w-xs text-sm opacity-60">
              Complete lessons and take quizzes to track your performance here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
