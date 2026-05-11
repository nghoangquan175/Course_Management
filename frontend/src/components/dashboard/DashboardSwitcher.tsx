import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Home,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const location = useLocation();

  const currentPath = location.pathname;

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

  const menuItems = [
    { id: 'home', label: 'Homepage', path: '/', icon: <Home className="w-4 h-4" /> },
    {
      id: 'student',
      label: 'Student Dashboard',
      path: '/dashboard',
      icon: <GraduationCap className="w-4 h-4" />,
      roles: ['USER', 'INSTRUCTOR', 'ADMIN'],
    },
    {
      id: 'instructor',
      label: 'Instructor Dashboard',
      path: '/instructor/dashboard',
      icon: <Briefcase className="w-4 h-4" />,
      roles: ['INSTRUCTOR', 'ADMIN'],
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      path: '/admin',
      icon: <ShieldCheck className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all border flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border-white/5'
        }`}
        title="Switch Dashboard"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
          >
            <div className="p-3 bg-white/5 border-b border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
                Navigation
              </p>
            </div>

            <div className="p-2">
              {filteredItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    to={active ? '#' : item.path}
                    onClick={(e) => {
                      if (active) e.preventDefault();
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all mb-1 last:mb-0 ${
                      active
                        ? 'bg-indigo-500/20 text-white border border-indigo-500/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {item.icon}
                      </div>
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    {active ? (
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="p-3 bg-white/5 text-[10px] text-center text-slate-500 italic border-t border-white/5">
              Logged in as {user?.role}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
