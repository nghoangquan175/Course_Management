import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, Send } from 'lucide-react';
import { authService } from '../../api/authService';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('Password reset link has been sent to your email!');
      setIsSent(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred');
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
          <h2 className="text-2xl font-bold mb-1">Forgot Password?</h2>
          <p className="text-slate-400 text-sm">We'll send you a link to reset your password.</p>
        </div>

        {isSent ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-8 h-8" />
            </div>
            <p className="text-slate-300 text-sm">Please check your inbox to continue.</p>
            <Link
              to="/login"
              className="btn-primary w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider">
                Enter your email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="example@mail.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors font-bold mt-4"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </Link>
          </form>
        )}
      </motion.div>
    </div>
  );
};
