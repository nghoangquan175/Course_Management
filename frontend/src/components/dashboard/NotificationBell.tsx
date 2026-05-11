import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../api/notificationService';
import { useSocket } from '../../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Determine role from path
  const role = location.pathname.startsWith('/admin')
    ? 'ADMIN'
    : location.pathname.startsWith('/instructor')
      ? 'INSTRUCTOR'
      : 'USER';

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', role],
    queryFn: () => notificationService.getNotifications(role),
    refetchInterval: 60000, // Fallback polling every 1 minute
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Socket listener for real-time notifications
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notif: any) => {
        if (notif.targetRole === role) {
          queryClient.setQueryData(['notifications', role], (oldData: any) => {
            return [notif, ...(oldData || [])];
          });
          toast.success(`New notification: ${notif.title}`);
        }
      };

      socket.on('new_notification', handleNewNotification);
      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [socket, role, queryClient]);

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', role] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', role] });
    },
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }

    setIsOpen(false);

    // Navigation logic based on type
    if (notif.referenceId) {
      if (notif.type.includes('COURSE')) {
        const detailPath = `?view=detail&courseId=${notif.referenceId}`;
        if (role === 'ADMIN') navigate(`/admin${detailPath}`);
        else if (role === 'INSTRUCTOR') navigate(`/instructor/dashboard${detailPath}`);
        else navigate(`/course/${notif.referenceId}`);
      } else if (notif.type.includes('APPLICATION')) {
        if (role === 'ADMIN') navigate(`/admin?tab=applications&appId=${notif.referenceId}`);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-white/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-[1px] -right-[1px] min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full border-2 border-slate-950 text-[9px] font-black flex items-center justify-center text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {isLoading ? (
                <div className="p-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer relative ${
                      !notif.isRead ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-2 top-5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    )}
                    <div className="flex justify-between items-start mb-1 ml-2">
                      <p
                        className={`text-sm font-bold ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed ml-2 line-clamp-2">
                      {notif.message}
                    </p>
                    {notif.referenceId && (
                      <div className="mt-2 ml-2 flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                        <ExternalLink className="w-3 h-3" />
                        View details
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-white/5 text-center">
              <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors">
                Check all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
