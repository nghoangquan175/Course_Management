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
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 md:p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-6 flex flex-col items-center">
          <Logo className="mb-4" textSize="text-2xl" />
          <h2 className="text-2xl font-bold mb-1">Create Account</h2>
          <p className="text-slate-400 text-sm">Start your journey today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                {...register('name')}
                placeholder="John Doe"
                className={`w-full bg-white/5 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-indigo-500 outline-none transition-all`}
              />
            </div>
            {errors.name && <p className="text-red-500 text-[10px] ml-1">{errors.name.message}</p>}
          </div>

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
            <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider">
              Password
            </label>
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
          </div>

          <button
            disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Register Now <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
