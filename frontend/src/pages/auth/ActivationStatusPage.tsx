import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { authService } from '../../api/authService';
import { motion } from 'framer-motion';

export const ActivationStatusPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'already_active' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkActivation = async () => {
      try {
        if (!token) return;
        const response = await authService.activate(token);
        const data = response.data;

        if (data.status === 'success') {
          setStatus('success');
          setMessage('Your account has been activated successfully!');
          setTimeout(() => navigate('/login'), 3000);
        } else if (data.status === 'already_active') {
          setStatus('already_active');
          setMessage('Your account is already activated.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error: any) {
        const errorStatus = error.response?.data?.status;
        if (errorStatus === 'expired') {
          setStatus('expired');
          setMessage('Activation link has expired.');
        } else {
          setStatus('error');
          setMessage('Invalid activation link or an error occurred.');
        }
      }
    };

    checkActivation();
  }, [token, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-slate-400">Checking activation status...</p>
          </div>
        );
      case 'success':
      case 'already_active':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="w-20 h-20 text-green-500" />
            <h2 className="text-3xl font-bold">{message}</h2>
            <p className="text-slate-400">You will be redirected to the login page shortly...</p>
          </div>
        );
      case 'expired':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Clock className="w-20 h-20 text-amber-500" />
            <h2 className="text-3xl font-bold">{message}</h2>
            <p className="text-slate-400">Please request a new activation email.</p>
            <button className="btn-primary mt-4 px-8">Resend Activation Email</button>
          </div>
        );
      case 'error':
      default:
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="w-20 h-20 text-red-500" />
            <h2 className="text-3xl font-bold">{message}</h2>
            <button onClick={() => navigate('/register')} className="btn-primary mt-4 px-8">Back to Registration</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 rounded-3xl max-w-xl w-full shadow-2xl"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};
