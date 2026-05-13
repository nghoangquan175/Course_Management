import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, ArrowLeft, Save, Loader2, ClipboardCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { examService } from '../../api/examService';

interface ExamEditorProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
}

export const QuestionType = {
  TRUE_FALSE: 'TRUE_FALSE',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

const questionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  questionText: z.string().min(5, 'Question content must be at least 5 characters'),
  options: z
    .array(z.string().min(1, 'Option content is required'))
    .min(2, 'At least 2 options are required'),
  correctAnswerIndex: z.number().min(0),
  explanation: z.string().optional(),
});

const examSchema = z.object({
  title: z.string().min(5, 'Quiz title must be at least 5 characters'),
  description: z.string().optional(),
  passingScore: z
    .number()
    .min(1, 'Passing score must be at least 1%')
    .max(100, 'Passing score cannot exceed 100%'),
  timeLimit: z.number().min(0, 'Time limit cannot be negative'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

type ExamFormValues = z.infer<typeof examSchema>;

export const ExamEditor: React.FC<ExamEditorProps> = ({ lessonId, lessonTitle, onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState<ExamFormValues | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: `Quiz for ${lessonTitle}`,
      description: '',
      passingScore: 50,
      timeLimit: 0,
      questions: [
        {
          type: QuestionType.MULTIPLE_CHOICE,
          questionText: '',
          options: ['', '', '', ''],
          correctAnswerIndex: 0,
          explanation: '',
        },
      ],
    },
  });

  const { fields, append, remove, insert } = useFieldArray({
    control,
    name: 'questions',
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await examService.getLessonExam(lessonId);
        if (data) {
          reset({
            title: data.title,
            description: data.description || '',
            passingScore: data.passingScore,
            timeLimit: data.timeLimit,
            questions: data.questions || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch exam:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExam();
  }, [lessonId, reset]);

  const onSubmit = (data: ExamFormValues) => {
    setFormData(data);
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    setShowConfirmModal(false);
    try {
      await examService.upsertExam({
        lessonId,
        ...formData,
      });
      toast.success('Exam saved successfully!');
      onBack();
    } catch (error) {
      toast.error('Failed to save exam');
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    append({
      type,
      questionText: '',
      options: type === QuestionType.MULTIPLE_CHOICE ? ['', '', '', ''] : ['True', 'False'],
      correctAnswerIndex: 0,
      explanation: '',
    });
  };

  const duplicateQuestion = (index: number) => {
    const question = control._formValues.questions[index];
    insert(index + 1, { ...question, id: undefined });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500">Loading exam content...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Quiz Builder</h2>
            <p className="text-sm text-slate-500 font-medium">{lessonTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit, (err) => {
              toast.error('Please check all fields and try again.');
            })}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Quiz
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 flex flex-col gap-8">
        {/* Exam Settings */}
        <div className="glass p-6 rounded-3xl border border-white/5 grid grid-cols-3 gap-6">
          <div className="col-span-3">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
              Quiz Title
            </label>
            <input
              {...register('title', { required: true })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
              placeholder="Enter quiz title..."
            />
            {errors.title && (
              <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
              Passing Score (%)
            </label>
            <input
              type="number"
              {...register('passingScore', {
                setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
              })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
            />
            {errors.passingScore && (
              <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                {errors.passingScore.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
              Time Limit (Minutes)
            </label>
            <input
              type="number"
              {...register('timeLimit', {
                setValueAs: (v) => (v === '' ? undefined : parseInt(v)),
              })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
            />
            {errors.timeLimit && (
              <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                {errors.timeLimit.message}
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-1">Set to 0 for no limit</p>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex flex-col gap-6">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl border border-white/5 overflow-hidden"
            >
              <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-xs">
                    {index + 1}
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {field.type === QuestionType.MULTIPLE_CHOICE
                      ? 'Multiple Choice'
                      : 'True / False'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateQuestion(index)}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(index)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
                    Question Content
                  </label>
                  <textarea
                    {...register(`questions.${index}.questionText` as const, { required: true })}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    placeholder="Enter your question here..."
                  />
                  {errors.questions?.[index]?.questionText && (
                    <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                      {errors.questions[index]?.questionText?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 block">
                    Answer Options
                  </label>
                  <Controller
                    name={`questions.${index}.correctAnswerIndex` as const}
                    control={control}
                    render={({ field: radioField }) => (
                      <div className="grid grid-cols-1 gap-3">
                        {field.type === QuestionType.MULTIPLE_CHOICE ? (
                          [0, 1, 2, 3].map((optIndex) => (
                            <div key={optIndex} className="flex items-center gap-3 group">
                              <input
                                type="radio"
                                checked={Number(radioField.value) === optIndex}
                                onChange={() => radioField.onChange(optIndex)}
                                className="w-4 h-4 text-indigo-600 bg-white/5 border-white/10 focus:ring-indigo-500"
                              />
                              <div className="flex-1 relative">
                                <input
                                  {...register(`questions.${index}.options.${optIndex}` as const)}
                                  className={`w-full bg-white/5 border ${errors.questions?.[index]?.options?.[optIndex] ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all`}
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                                {errors.questions?.[index]?.options?.[optIndex] && (
                                  <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                                    {errors.questions[index]?.options?.[optIndex]?.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex gap-4">
                            {['True', 'False'].map((val, optIndex) => (
                              <label
                                key={val}
                                className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                              >
                                <span className="text-sm font-bold">{val}</span>
                                <input
                                  type="radio"
                                  checked={Number(radioField.value) === optIndex}
                                  onChange={() => radioField.onChange(optIndex)}
                                  className="w-4 h-4 text-indigo-600 bg-white/5 border-white/10 focus:ring-indigo-500"
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
                    Explanation (Optional)
                  </label>
                  <textarea
                    {...register(`questions.${index}.explanation` as const)}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    placeholder="Explain the correct answer..."
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 py-8 border-t border-white/5">
          <button
            onClick={() => addQuestion(QuestionType.MULTIPLE_CHOICE)}
            className="flex-1 py-4 rounded-2xl border-2 border-dashed border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus className="w-5 h-5" />
            Add Multiple Choice
          </button>
          <button
            onClick={() => addQuestion(QuestionType.TRUE_FALSE)}
            className="flex-1 py-4 rounded-2xl border-2 border-dashed border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus className="w-5 h-5" />
            Add True / False
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 text-center"
            >
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardCheck className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Save Quiz Changes?</h3>
              <p className="text-slate-400 text-sm mb-8">
                Are you sure you want to save the changes to this quiz? This will update the
                curriculum for all students.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm transition-all"
                >
                  No, review again
                </button>
                <button
                  onClick={confirmSave}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Yes, Save now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
