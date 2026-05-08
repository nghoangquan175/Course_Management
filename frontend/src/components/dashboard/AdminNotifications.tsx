import React, { useState } from 'react';
import { Send, Users, User, ShieldCheck } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { notificationService } from '../../api/notificationService';
import { Modal } from '../common/Modal';
import toast from 'react-hot-toast';

export const AdminNotifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('USER');
  const [targetType, setTargetType] = useState('role'); // 'role' or 'specific'
  const [specificUserIds, setSpecificUserIds] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const sendMutation = useMutation({
    mutationFn: (data: any) => notificationService.sendAdminNotification(data),
    onSuccess: () => {
      toast.success('Notification sent successfully');
      setTitle('');
      setMessage('');
      setSpecificUserIds('');
      setIsConfirmModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      return toast.error('Title and message are required');
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSend = () => {
    const data: any = {
      title,
      message,
      type: 'SYSTEM',
    };

    if (targetType === 'role') {
      data.targetRole = targetRole;
    } else {
      data.userIds = specificUserIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');
    }

    sendMutation.mutate(data);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2">
      <div className="glass p-8 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Send System Notification</h2>
            <p className="text-slate-500 text-sm">
              Create and broadcast notifications to users or roles
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. System Maintenance"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Message Content
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Target Audience
                </label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setTargetType('role')}
                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      targetType === 'role'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    By Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('specific')}
                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      targetType === 'specific'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Specific Users
                  </button>
                </div>

                {targetType === 'role' ? (
                  <div className="grid grid-cols-3 gap-3">
                    {['USER', 'INSTRUCTOR', 'ADMIN'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTargetRole(r)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                          targetRole === r
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={specificUserIds}
                      onChange={(e) => setSpecificUserIds(e.target.value)}
                      placeholder="Comma separated User IDs..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 transition-all text-xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-2 italic">
                      Example: uuid-1, uuid-2, uuid-3
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white mb-1">Broadcast Security</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Sending to a role will notify ALL users in that group. Please ensure the
                      content is appropriate for the selected audience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              disabled={sendMutation.isPending}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              {sendMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
              {sendMutation.isPending ? 'Sending...' : 'Send Notification Now'}
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Notification Broadcast"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSend}
              disabled={sendMutation.isPending}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              {sendMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              )}
              Confirm & Send
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">Are you sure you want to broadcast this notification?</p>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Target</p>
            <p className="text-sm text-indigo-400 font-bold">
              {targetType === 'role' ? `All ${targetRole}s` : 'Specific Users'}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase pt-2">Title</p>
            <p className="text-sm text-white font-medium">{title}</p>
          </div>
          <p className="text-[10px] text-amber-500 italic">
            Note: This action cannot be undone once the broadcast begins.
          </p>
        </div>
      </Modal>
    </div>
  );
};
