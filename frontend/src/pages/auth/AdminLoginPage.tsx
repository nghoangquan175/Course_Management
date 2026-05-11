import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../../api/authService';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../utils/validations';
import type { LoginInput } from '../../utils/validations';

export const AdminLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for expired session
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.error('Session expired, please login again', { id: 'admin-session-expired' });
    }
  }, [location.search]);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setFormError(null);
    try {
      const response = await authService.adminLogin(data);
      login(response.data.user, response.data.accessToken);
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Admin login failed';

      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('password')) {
        setError('password', { type: 'manual', message: message });
        setValue('password', '');
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-6 md:p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl relative z-10 border border-white/10 overflow-hidden"
      >
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-600/30">
            <ShieldCheck className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-2xl font-black mb-1 tracking-tight">Admin Portal</h2>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest">
            Secure access for administrators
          </p>
        </div>

        {formError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-[10px] font-bold uppercase tracking-wider"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{formError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Admin Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
              <input
                type="email"
                {...register('email')}
                placeholder="admin@lms.com"
                className={`w-full bg-slate-900/50 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 focus:border-red-500 outline-none transition-all text-xs`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-[9px] font-bold ml-1 uppercase">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-500 transition-colors" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full bg-slate-900/50 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 focus:border-red-500 outline-none transition-all text-xs`}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-[9px] font-bold ml-1 uppercase">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Enter Portal <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          <Link
            to="/login"
            className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
          >
            Return to Student Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
