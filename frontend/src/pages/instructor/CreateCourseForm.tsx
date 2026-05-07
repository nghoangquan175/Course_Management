import React, { useState } from 'react';
import {
  ArrowLeft,
  Upload,
  X,
  CheckCircle,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from '../../components/common/Modal';
import { toast } from 'react-hot-toast';
import { cloudinaryService } from '../../api/cloudinaryService';
import { categoryService } from '../../api/categoryService';
import type { Category } from '../../api/categoryService';
import { courseService } from '../../api/courseService';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { CourseData } from '../../components/dashboard/CourseManagement';

const courseSchema = z.object({
  name: z.string().min(10, 'Course title must be at least 10 characters'),
  description: z.string().min(50, 'Course description must be at least 50 characters'),
  categoryId: z.string().min(1, 'Please select a category for the course'),
  thumbnailUrl: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CreateCourseFormProps {
  onBack: () => void;
  initialData?: CourseData;
}

export const CreateCourseForm: React.FC<CreateCourseFormProps> = ({ onBack, initialData }) => {
  const [preview, setPreview] = useState<string | null>(initialData?.thumbnailUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: "",
      categoryId: "",
      thumbnailUrl: initialData?.thumbnailUrl || "",
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingCategories(true);
      try {
        const catData = await categoryService.getAll();
        setCategories(catData);

        if (initialData) {
          const courseDetails = await courseService.getById(initialData.id);
          setValue('name', courseDetails.name);
          setValue('description', courseDetails.description || "");
          setValue('categoryId', courseDetails.categoryId || "");
          setValue('thumbnailUrl', courseDetails.thumbnailUrl || "");
        }
      } catch (error) {
        toast.error('Failed to load course data');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchData();
  }, [initialData, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSave = async (data: CourseFormValues) => {
    setIsSubmitting(true);
    try {
      let thumbnailUrl = data.thumbnailUrl || '';

      if (selectedFile) {
        setIsUploading(true);
        const uploadResult = await cloudinaryService.uploadImage(selectedFile, 'course_management/thumbnails');
        thumbnailUrl = uploadResult.secure_url;
        setIsUploading(false);
      }

      if (initialData) {
        await courseService.update(initialData.id, {
          ...data,
          thumbnailUrl
        });
        toast.success('Course updated successfully!');
      } else {
        await courseService.create({
          ...data,
          thumbnailUrl
        });
        toast.success('Course created successfully!');
      }

      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      onBack();
    } catch (error: any) {
      setIsSubmitting(false);
      setIsUploading(false);
      toast.error(error.response?.data?.message || 'Failed to save course');
      console.error('Submit error:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col min-h-0 pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 shrink-0">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">Create New Course</h2>
          <p className="text-slate-500 text-sm">Fill in the details to launch your new course.</p>
        </div>
      </div>

      <div className="flex-1 pr-4 scrollbar-thin scrollbar-thumb-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Course Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Course Title</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Complete Web Development Bootcamp"
                  className={`w-full bg-white/5 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all text-white shadow-inner`}
                />
                {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold italic">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-slate-300 ml-1">Category</label>
                  <div className="relative">
                    <select
                      {...register('categoryId')}
                      disabled={isLoadingCategories}
                      className={`w-full bg-white/5 border ${errors.categoryId ? 'border-red-500' : 'border-white/10'} rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all text-white appearance-none cursor-pointer disabled:opacity-50`}
                    >
                      <option value="" disabled className="bg-slate-900">
                        {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
                      </option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                  {errors.categoryId && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold italic">{errors.categoryId.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Description</label>
                <textarea
                  rows={6}
                  {...register('description')}
                  placeholder="Tell students what they will learn in this course..."
                  className={`w-full bg-white/5 border ${errors.description ? 'border-red-500' : 'border-white/10'} rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all text-white resize-none`}
                />
                {errors.description && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold italic">{errors.description.message}</p>}
              </div>
            </div>
          </div>

          {/* Right Column: Thumbnail & Settings */}
          <div className="space-y-8">
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <label className="text-sm font-bold text-slate-300 block">Course Thumbnail</label>

              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-dashed border-white/10 group">
                {isUploading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Uploading...</p>
                    </div>
                  </div>
                )}
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium">Click or drag to upload thumbnail</p>
                    <p className="text-[10px] mt-2 text-slate-600">Supports JPG, PNG (Max 2MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                  <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A high-quality thumbnail increases course visibility by up to 40%.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit(() => setIsConfirmModalOpen(true))}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
            >
              {initialData ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={initialData ? "Confirm Update" : "Confirm Creation"}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-6 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSave)}
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">Are you sure you want to create this new course? You can still edit the details and add lessons later.</p>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[11px] text-slate-500 uppercase font-black tracking-widest mb-1">Status After Creation</p>
            <p className="text-xs text-amber-500 font-bold">The course will be saved as a Draft.</p>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
