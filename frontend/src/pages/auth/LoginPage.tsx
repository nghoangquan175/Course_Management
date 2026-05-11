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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 md:p-12 rounded-3xl max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <Logo className="mb-8" textSize="text-3xl" />
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-slate-400">Sign in to continue your learning journey</p>
        </div>

        {formError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{formError}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                {...register('email')}
                placeholder="example@mail.com"
                className={`w-full bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all`}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all`}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs ml-1">{errors.password.message}</p>
            )}
            <div className="flex justify-end items-center ml-1">
              <Link
                to="/forgot-password"
                title="Forgot Password?"
                className="text-xs text-indigo-400 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
            Register Now
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
