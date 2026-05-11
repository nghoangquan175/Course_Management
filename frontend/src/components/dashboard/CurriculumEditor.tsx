import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Video,
  FileText,
  Trash2,
  Save,
  X,
  Upload,
  File as FileIcon,
  Edit,
  ClipboardCheck,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { lessonService } from '../../api/lessonService';
import { cloudinaryService } from '../../api/cloudinaryService';
import { toast } from 'react-hot-toast';
import { ExamEditor } from './ExamEditor';
import { formatDuration } from '../../utils/videoUtils';
import { Modal } from '../common/Modal';

// Custom styles for Quill in dark mode
const quillStyles = `
  .quill-dark-theme .ql-toolbar {
    background: rgba(255, 255, 255, 0.03) !important;
    border: none !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    padding: 12px 24px !important;
  }
  .quill-dark-theme .ql-container {
    border: none !important;
    font-family: inherit !important;
    font-size: 14px !important;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .quill-dark-theme .ql-editor {
    color: #cbd5e1 !important;
    padding: 24px !important;
    flex: 1;
    min-height: 300px;
  }
  .quill-dark-theme .ql-editor.ql-blank::before {
    color: #64748b !important;
    left: 24px !important;
    font-style: normal !important;
  }
  .quill-dark-theme .ql-stroke {
    stroke: #94a3b8 !important;
  }
  .quill-dark-theme .ql-fill {
    fill: #94a3b8 !important;
  }
  .quill-dark-theme .ql-picker {
    color: #94a3b8 !important;
  }
  .quill-dark-theme .ql-picker-options {
    background: #0f172a !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 8px !important;
  }
`;

interface CurriculumEditorProps {
  courseId: string;
  courseName: string;
  onBack: () => void;
}

interface AttachmentData {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface LessonData {
  id: string;
  title: string;
  textContent: string;
  videoUrl: string | null;
  videoDuration?: number;
  attachments: AttachmentData[];
  order: number;
}

export const lessonSchema = z
  .object({
    title: z.string().min(5, 'Lesson title must be at least 5 characters'),
    textContent: z.string().optional(),
    videoUrl: z.string().url('Invalid video URL').optional().or(z.string().length(0)),
  })
  .refine(
    (data) => {
      const hasVideo = data.videoUrl && data.videoUrl.trim().length > 0;
      const hasText =
        data.textContent && data.textContent.replace(/<[^>]*>/g, '').trim().length > 0;
      return hasVideo || hasText;
    },
    {
      message: 'Lesson must have at least a Video or Text content',
      path: ['textContent'],
    }
  );

type LessonFormValues = z.infer<typeof lessonSchema>;

export const CurriculumEditor: React.FC<CurriculumEditorProps> = ({
  courseId,
  courseName,
  onBack,
}) => {
  const quillRef = React.useRef<ReactQuill>(null);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showExamEditor, setShowExamEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonData | null>(null);
  const [activeLessonForExam, setActiveLessonForExam] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveConfirmModalOpen, setIsSaveConfirmModalOpen] = useState(false);
  const [pendingLessonData, setPendingLessonData] = useState<LessonFormValues | null>(null);

  // Media states
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      textContent: '',
      videoUrl: '',
    },
  });

  const fetchLessons = React.useCallback(async () => {
    try {
      const data = await lessonService.getCourseLessons(courseId);
      setLessons(data);
    } catch (error) {
      toast.error('Failed to fetch lessons');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLessons();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLessons]);

  const processRichTextImages = React.useCallback(
    async (html: string): Promise<string> => {
      if (!html || !html.includes('data:image/')) return html;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const images = Array.from(doc.querySelectorAll('img'));
      const base64Images = images.filter((img) => img.src.startsWith('data:image/'));

      if (base64Images.length === 0) return html;

      // Fetch signature ONCE for content images
      const signature = await cloudinaryService.getSignature(`courses/${courseId}/content-images`);

      await Promise.all(
        base64Images.map(async (img) => {
          try {
            // 1. Convert base64 to File
            const res = await fetch(img.src);
            const blob = await res.blob();
            const extension = blob.type.split('/')[1] || 'png';
            const file = new File([blob], `content-image-${Date.now()}.${extension}`, {
              type: blob.type,
            });

            // 2. Upload
            const result = await cloudinaryService.uploadMedia(
              file,
              'image',
              undefined,
              undefined,
              signature
            );

            // 3. Replace src
            img.src = result.secure_url;
          } catch (err) {
            console.error('Failed to upload embedded image:', err);
          }
        })
      );

      return doc.body.innerHTML;
    },
    [courseId]
  );

  const handleSaveLesson = async (data: LessonFormValues) => {
    setIsSaving(true);
    try {
      let videoUrl = editingLesson?.videoUrl || data.videoUrl;
      let videoDuration = editingLesson?.videoDuration;
      let attachments = editingLesson?.attachments ? [...editingLesson.attachments] : [];

      // 1. Upload Video if new one selected
      if (selectedVideo) {
        setUploadProgress((prev) => ({ ...prev, video: 0 }));

        // Fetch signature once for video folder
        const videoSignature = await cloudinaryService.getSignature(`courses/${courseId}/lessons`);

        const videoResult = await cloudinaryService.uploadMedia(
          selectedVideo,
          'video',
          undefined, // Folder is already in signature
          (percent) => setUploadProgress((prev) => ({ ...prev, video: percent })),
          videoSignature
        );
        videoUrl = videoResult.secure_url;
        videoDuration = Math.round(videoResult.duration);
      }

      // 2. Upload new Attachments
      if (selectedAttachments.length > 0) {
        // Fetch signature ONCE for the entire attachments folder
        const attachmentSignature = await cloudinaryService.getSignature(
          `courses/${courseId}/attachments`
        );

        const newAttachments = await Promise.all(
          selectedAttachments.map(async (file, index) => {
            const key = `file-${index}`;
            setUploadProgress((prev) => ({ ...prev, [key]: 0 }));
            const result = await cloudinaryService.uploadMedia(
              file,
              'raw',
              undefined, // Folder is already in signature
              (percent) => setUploadProgress((prev) => ({ ...prev, [key]: percent })),
              attachmentSignature // REUSE the same signature for all files in this batch
            );
            return {
              fileName: file.name,
              fileUrl: result.secure_url,
              fileSize: file.size,
              fileType: file.name.split('.').pop() || 'unknown',
            };
          })
        );
        attachments = [...attachments, ...newAttachments];
      }

      // 3. Process RichText Images (Lazy Upload)
      const cleanedTextContent = await processRichTextImages(data.textContent || '');

      const lessonPayload = {
        courseId,
        title: data.title,
        textContent: cleanedTextContent,
        videoUrl,
        videoDuration,
        attachments,
      };

      if (editingLesson) {
        await lessonService.updateLesson(editingLesson.id, lessonPayload);
        toast.success('Lesson updated successfully');
      } else {
        await lessonService.createLesson(lessonPayload);
        toast.success('Lesson created successfully');
      }

      handleCancelForm();
      fetchLessons();
    } catch (error) {
      console.error('Save lesson error:', error);
      toast.error(editingLesson ? 'Failed to update lesson' : 'Failed to create lesson');
    } finally {
      setIsSaving(false);
      setUploadProgress({});
      setPendingLessonData(null);
    }
  };

  const onConfirmSave = (data: LessonFormValues) => {
    setPendingLessonData(data);
    setIsSaveConfirmModalOpen(true);
  };

  const handleConfirmedSave = () => {
    if (pendingLessonData) {
      setIsSaveConfirmModalOpen(false);
      handleSaveLesson(pendingLessonData);
    }
  };

  const handleEditLesson = (lesson: LessonData) => {
    setEditingLesson(lesson);
    setShowCreateForm(true);
    reset({
      title: lesson.title,
      textContent: lesson.textContent || '',
      videoUrl: lesson.videoUrl || '',
    });
    // Scroll to form
    setTimeout(() => {
      document.getElementById('lesson-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingLesson(null);
    setSelectedVideo(null);
    setSelectedAttachments([]);
    setUploadProgress({});
    reset({
      title: '',
      textContent: '',
      videoUrl: '',
    });
  };

  const removeSelectedAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    if (!editingLesson) return;
    const updatedAttachments = editingLesson.attachments.filter((_, i) => i !== index);
    setEditingLesson({ ...editingLesson, attachments: updatedAttachments });
  };

  const modules = React.useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    }),
    []
  );

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await lessonService.deleteLesson(id);
      toast.success('Lesson deleted');
      fetchLessons();
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

  const handleOpenExamEditor = (lesson: LessonData) => {
    setActiveLessonForExam({ id: lesson.id, title: lesson.title });
    setShowExamEditor(true);
    setShowCreateForm(false);
  };

  const handleBackFromExam = () => {
    setShowExamEditor(false);
    setActiveLessonForExam(null);
  };

  if (showExamEditor && activeLessonForExam) {
    return (
      <ExamEditor
        lessonId={activeLessonForExam.id}
        lessonTitle={activeLessonForExam.title}
        onBack={handleBackFromExam}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 pb-8 overflow-hidden">
      <style>{quillStyles}</style>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button
          onClick={() => (showCreateForm ? handleCancelForm() : onBack())}
          className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">Edit Curriculum</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            {courseName}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
        {/* Create Button Top */}
        {!showCreateForm && (
          <button
            onClick={() => {
              handleCancelForm();
              setShowCreateForm(true);
            }}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Lesson
          </button>
        )}

        {/* Lesson List */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 text-sm">Loading lessons...</p>
            </div>
          ) : lessons.length === 0 && !showCreateForm ? (
            <div className="py-20 text-center glass rounded-3xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-1">No lessons yet</h3>
              <p className="text-slate-500 text-sm">
                Start building your course by adding your first lesson.
              </p>
            </div>
          ) : (
            lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="glass rounded-2xl border border-white/5 p-4 flex items-center gap-4 group"
              >
                <div className="cursor-grab text-slate-600 group-hover:text-slate-400 transition-colors">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{lesson.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                      <Video className="w-3 h-3" />{' '}
                      {lesson.videoUrl ? 'Video included' : 'No video'}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> {formatDuration(lesson.videoDuration || 0)}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                      <FileText className="w-3 h-3" /> {lesson.attachments.length} resources
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleOpenExamEditor(lesson)}
                    className="p-2 hover:bg-white/5 rounded-lg text-indigo-400 hover:text-white"
                    title="Manage Quiz"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditLesson(lesson)}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white"
                    title="Edit Lesson"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/50 hover:text-red-500"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inline Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              id="lesson-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-indigo-400">
                  {editingLesson ? `Editing Lesson: ${editingLesson.title}` : 'New Lesson'}
                </h3>
                {isSaving && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold animate-pulse">
                    <Upload className="w-3 h-3" />
                    Processing Media...
                  </div>
                )}
              </div>
              <div className="grid grid-cols-12 gap-6 p-1">
                {/* Left Column: Content */}
                <div className="col-span-8 flex flex-col gap-6">
                  {/* Title Card */}
                  <div className="glass rounded-2xl border border-white/5 p-6">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 block">
                      Lesson Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Introduction to Linear Algebra"
                      className={`w-full bg-white/5 border ${errors.title ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all`}
                      {...register('title')}
                      disabled={isSaving}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Content Card */}
                  <div className="glass rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[450px]">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">
                        Detailed Content
                      </label>
                    </div>
                    <div className="flex-1 flex flex-col quill-dark-theme">
                      <Controller
                        name="textContent"
                        control={control}
                        render={({ field }) => (
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={field.value}
                            onChange={field.onChange}
                            className="flex-1 flex flex-col"
                            modules={modules}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {errors.textContent && (
                    <p className="text-red-500 text-[10px] mt-1 font-bold italic">
                      {errors.textContent.message}
                    </p>
                  )}
                </div>

                {/* Right Column: Media & Files */}
                <div className="col-span-4 flex flex-col gap-6">
                  {/* Video Upload Card */}
                  <div className="glass rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">
                        Lesson Video
                      </label>
                      {editingLesson?.videoUrl && !selectedVideo && (
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                          Has Video
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)}
                    />

                    <div
                      onClick={() => !isSaving && videoInputRef.current?.click()}
                      className={`aspect-video rounded-2xl border-2 border-dashed ${selectedVideo ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5 bg-white/5'} hover:bg-white/10 hover:border-indigo-500/30 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer group relative overflow-hidden`}
                    >
                      {isSaving && uploadProgress.video !== undefined ? (
                        <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center p-6 z-10">
                          <div className="w-full bg-white/5 h-1.5 rounded-full mb-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-indigo-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress.video}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-bold text-indigo-400">
                            Uploading Video {uploadProgress.video}%
                          </p>
                        </div>
                      ) : selectedVideo ? (
                        <>
                          <Video className="w-8 h-8 text-indigo-400 mb-2" />
                          <p className="text-xs font-bold text-slate-200 truncate w-full px-4">
                            {selectedVideo.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {(selectedVideo.size / (1024 * 1024)).toFixed(1)} MB • Click to change
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-indigo-400" />
                          </div>
                          <p className="text-xs font-bold mb-1">Drag & drop video here</p>
                          <p className="text-[10px] text-slate-500">
                            or <span className="text-indigo-400 underline">select file</span> from
                            computer
                          </p>
                          <p className="text-[9px] text-slate-600 mt-4">MP4, WebM (Max 500MB)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Attachments Card */}
                  <div className="glass rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">
                        Attachments
                      </label>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {(editingLesson?.attachments.length || 0) + selectedAttachments.length}{' '}
                        Total
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const allowedExtensions = [
                          'pdf',
                          'doc',
                          'docx',
                          'ppt',
                          'pptx',
                          'xls',
                          'xlsx',
                          'txt',
                        ];
                        const validFiles = files.filter((file) => {
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          return ext && allowedExtensions.includes(ext);
                        });

                        if (validFiles.length < files.length) {
                          toast.error(
                            'Some files were skipped. Only document files (PDF, DOC, PPT, etc.) are allowed.'
                          );
                        }

                        setSelectedAttachments((prev) => [...prev, ...validFiles]);
                        e.target.value = ''; // Reset input
                      }}
                    />

                    <div className="flex flex-col gap-3">
                      <div
                        onClick={() => !isSaving && fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <Plus className="w-5 h-5 text-slate-600 mb-1 group-hover:text-indigo-400 transition-colors" />
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          Add Files
                        </p>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                        {/* Existing Attachments */}
                        {editingLesson?.attachments.map((att, i) => (
                          <div
                            key={att.id || i}
                            className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 group/item"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{att.fileName}</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                                  {(att.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeExistingAttachment(i)}
                              disabled={isSaving}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-500 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Newly Selected Attachments */}
                        {selectedAttachments.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 border-dashed relative overflow-hidden"
                          >
                            {isSaving && uploadProgress[`file-${i}`] !== undefined && (
                              <motion.div
                                className="absolute bottom-0 left-0 h-0.5 bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress[`file-${i}`]}%` }}
                              />
                            )}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                                <FileIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{file.name}</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeSelectedAttachment(i)}
                              disabled={isSaving}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-500 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={handleCancelForm}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit(onConfirmSave)}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingLesson ? 'Update Lesson' : 'Save Lesson'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Button Bottom */}
        {!showCreateForm && lessons.length > 0 && (
          <button
            onClick={() => {
              handleCancelForm();
              setShowCreateForm(true);
            }}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 font-bold text-sm mt-4"
          >
            <Plus className="w-5 h-5" />
            Add New Lesson
          </button>
        )}

        <Modal
          isOpen={isSaveConfirmModalOpen}
          onClose={() => !isSaving && setIsSaveConfirmModalOpen(false)}
          title="Confirm Lesson Save"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsSaveConfirmModalOpen(false)}
                className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSave}
                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Save className="w-4 h-4" />
                Confirm & Save
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center shrink-0">
                <Save className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-bold">Ready to save your lesson?</p>
                <p className="text-xs text-slate-500">
                  Media files will be uploaded to our secure servers after you confirm.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 px-1">
              Once you confirm, the upload process will start. You can monitor the progress bars in
              the form.
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};
