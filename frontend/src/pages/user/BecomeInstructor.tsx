import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Upload,
  CheckCircle,
  ChevronRight,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';
import { cloudinaryService } from '../../api/cloudinaryService';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Modal } from '../../components/common/Modal';

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  age: z.number().min(18, 'You must be at least 18 years old'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bio: z.string().min(50, 'Please share more about your teaching experience (min 50 chars)'),
  cvUrl: z.string().min(1, 'Please upload your CV'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export const BecomeInstructor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    message?: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const checkEligibility = async () => {
      try {
        const response = await api.get('/instructor-applications/eligibility');
        setEligibility(response.data);
      } catch (error) {
        console.error('Failed to check eligibility:', error);
      } finally {
        setIsLoadingEligibility(false);
      }
    };

    checkEligibility();
  }, [user, navigate, location]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      gender: 'MALE',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setValue('cvUrl', file.name); // Set value to pass validation
    toast.success(`Selected file: ${file.name}`);
  };

  const onSubmit = (data: RegistrationFormData) => {
    if (!selectedFile) {
      toast.error('Please select your CV');
      return;
    }
    setFormData(data);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!formData || !selectedFile) return;

    setIsConfirmModalOpen(false);
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // 1. Upload file first
      const uploadResponse = await cloudinaryService.uploadMedia(
        selectedFile,
        'raw',
        'instructor_cvs',
        (percent) => setUploadProgress(percent)
      );

      // 2. Submit application with real URL
      const finalData = {
        ...formData,
        cvUrl: uploadResponse.secure_url,
      };

      await api.post('/instructor-applications/apply', finalData);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
      setFormData(null);
    }
  };

  if (isLoadingEligibility) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (eligibility && !eligibility.eligible) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-12 shadow-2xl"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-500">
            {eligibility.reason === 'ALREADY_INSTRUCTOR' ? (
              <CheckCircle className="w-10 h-10" />
            ) : (
              <Calendar className="w-10 h-10" />
            )}
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            {eligibility.reason === 'ALREADY_INSTRUCTOR'
              ? 'Already an Instructor'
              : 'Application Restricted'}
          </h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">{eligibility.message}</p>
          <button
            onClick={() => navigate('/')}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl"
        >
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Application Submitted!</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Thank you for your interest in joining CourseEdu. Our team will review your application
            and documents carefully. You will receive an email notification once a decision has been
            made.
          </p>
          <a
            href="/"
            className="inline-block px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20"
          >
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 py-20 px-6 relative">
      {/* Back to Home Button */}
      <div className="absolute top-8 left-8">
        <a
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm group"
        >
          <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </div>
          Back to Home
        </a>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl lg:text-6xl font-black mb-6 tracking-tight">
              Partner with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Us
              </span>
            </h1>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Join EduCoreAcademy to share your knowledge and build a strong learning community
              together.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-indigo-500/5"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" /> Full Name *
                </label>
                <input
                  {...register('fullName')}
                  placeholder="Enter your full name"
                  className={`w-full bg-white/5 border rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.fullName
                      ? 'border-red-500/50'
                      : 'border-white/10 focus:border-indigo-500/50'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs font-medium">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" /> Contact Email *
                </label>
                <input
                  {...register('email')}
                  placeholder="Enter your email address"
                  className={`w-full bg-white/5 border rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.email
                      ? 'border-red-500/50'
                      : 'border-white/10 focus:border-indigo-500/50'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-400" /> Phone Number *
                </label>
                <input
                  {...register('phone')}
                  placeholder="Enter your phone number"
                  className={`w-full bg-white/5 border rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.phone
                      ? 'border-red-500/50'
                      : 'border-white/10 focus:border-indigo-500/50'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs font-medium">{errors.phone.message}</p>
                )}
              </div>

              {/* Age */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Age *
                </label>
                <input
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  placeholder="Enter your age"
                  className={`w-full bg-white/5 border rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    errors.age ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'
                  }`}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs font-medium">{errors.age.message}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Gender *
                </label>
                <select
                  {...register('gender')}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="MALE" className="bg-slate-900">
                    Male
                  </option>
                  <option value="FEMALE" className="bg-slate-900">
                    Female
                  </option>
                  <option value="OTHER" className="bg-slate-900">
                    Other
                  </option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Professional Bio & Experience *
              </label>
              <textarea
                {...register('bio')}
                rows={6}
                placeholder="Share your teaching experience, expertise, and what you can bring to our community..."
                className={`w-full bg-white/5 border rounded-2xl p-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none ${
                  errors.bio ? 'border-red-500/50' : 'border-white/10 focus:border-indigo-500/50'
                }`}
              />
              {errors.bio && (
                <p className="text-red-500 text-xs font-medium">{errors.bio.message}</p>
              )}
            </div>

            {/* CV Upload */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Curriculum Vitae (CV) *
              </label>

              <div
                className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${
                  selectedFile
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-white/10 hover:border-indigo-500/30 hover:bg-white/5'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isSubmitting}
                />

                {isSubmitting ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">
                      {uploadProgress < 100
                        ? `Uploading CV... ${uploadProgress}%`
                        : 'Finalizing Application...'}
                    </p>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <p className="text-green-500 font-bold mb-1">CV Ready to Upload</p>
                      <p className="text-slate-500 text-xs truncate max-w-xs mx-auto">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <p className="text-[10px] text-slate-600 mt-2 italic">
                        Click or drag to change file
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-slate-300 font-bold mb-1">Upload CV (Max 5MB)</p>
                      <p className="text-slate-500 text-sm">PDF, DOC, DOCX formats supported</p>
                    </div>
                  </div>
                )}
              </div>
              {errors.cvUrl && (
                <p className="text-red-500 text-xs font-medium">{errors.cvUrl.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-18 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-600/20 group overflow-hidden relative"
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Application"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
            >
              Confirm & Submit
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            Are you sure you want to submit your application to become an instructor?
          </p>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Name:</span>
              <span className="text-white font-medium">{formData?.fullName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Email:</span>
              <span className="text-white font-medium">{formData?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">CV:</span>
              <span className="text-indigo-400 font-medium">{selectedFile?.name}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            * Once submitted, you cannot edit your application until it has been reviewed by our
            team.
          </p>
        </div>
      </Modal>
    </div>
  );
};
