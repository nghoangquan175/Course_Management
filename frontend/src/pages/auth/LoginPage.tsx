import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../../api/authService';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../utils/validations';
import type { LoginInput } from '../../utils/validations';
import { useLocation } from 'react-router-dom';

import { Logo } from '../../components/common/Logo';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for expired session
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.error('Session expired, please login again', { id: 'session-expired' });
    }
  }, [location.search]);

  // Get the redirect path from state, default to home
  const from = location.state?.from || '/';

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
      const response = await authService.login(data);
      login(response.data.user, response.data.accessToken);
      toast.success('Login successful!');

      // Redirect back to original page or home
      navigate(from, { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';

      if (message.toLowerCase().includes('email') || message.toLowerCase().includes('password')) {
        // Focus error only on password and clear it
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
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 md:p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo className="mb-4" textSize="text-2xl" />
          <h2 className="text-2xl font-bold mb-1">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Sign in to continue your journey</p>
        </div>

        {formError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{formError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                {...register('email')}
                placeholder="example@mail.com"
                className={`w-full bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-indigo-500 outline-none transition-all`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-[10px] ml-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-indigo-500 outline-none transition-all`}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-[10px] ml-1">{errors.password.message}</p>
            )}
            <div className="flex justify-end items-center ml-1">
              <Link
                to="/forgot-password"
                className="text-[10px] text-indigo-400 hover:underline font-bold"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 font-bold hover:underline">
            Register Now
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
