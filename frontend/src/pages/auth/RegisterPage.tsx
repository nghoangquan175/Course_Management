import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '../../api/authService';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../../utils/validations';
import type { RegisterInput } from '../../utils/validations';

import { Logo } from '../../components/common/Logo';

export const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const response = await authService.register(data);
      toast.success(response.data.message, { duration: 6000 });
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className="text-slate-400">Start your learning journey today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                {...register('name')}
                placeholder="John Doe"
                className={`w-full bg-white/5 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs ml-1">{errors.name.message}</p>}
          </div>

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
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
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
          </div>

          <button
            disabled={loading}
            className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Register <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
            Sign In Now
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
