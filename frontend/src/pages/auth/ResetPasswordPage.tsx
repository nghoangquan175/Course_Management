import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { authService } from '../../api/authService';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      if (!token) return;
      await authService.resetPassword(token, password);
      toast.success('Password reset successful!');
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred while resetting password');
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
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-1">Reset Password</h2>
          <p className="text-slate-400 text-sm">Please enter a new password for your account.</p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <p className="text-slate-300 text-sm">Password updated successfully. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
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
                  Update Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
