import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, User, LayoutDashboard, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/common/Modal';
import { motion, AnimatePresence } from 'framer-motion';

import { Logo } from '../components/common/Logo';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="h-20 border-b border-white/5 flex items-center sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-6 max-w-[1440px] flex justify-between items-center">
          <Logo />

          <nav className="flex items-center gap-6">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/20">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-slate-200">{user.name}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl"
                    >
                      <div className="p-4 border-b border-white/5">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                          Signed in as
                        </p>
                        <p className="text-sm font-bold truncate">{user.email}</p>
                      </div>

                      <div className="p-2">
                        {/* User Dashboard - All logged in users have this */}
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          User Dashboard
                        </Link>

                        {/* Instructor Dashboard - For Instructors */}
                        {user.role === 'INSTRUCTOR' && (
                          <Link
                            to="/instructor/dashboard"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <BookOpen className="w-4 h-4" />
                            Instructor Dashboard
                          </Link>
                        )}

                        {/* Admin Dashboard - For Admins */}
                        {user.role === 'ADMIN' && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="p-2 bg-white/5">
                        <button
                          onClick={() => setIsLogoutModalOpen(true)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold hover:text-indigo-400 transition-colors px-4 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm font-bold px-6 py-2.5 rounded-xl"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 py-10 bg-slate-950">
        <div className="container mx-auto px-6 max-w-[1440px] text-center text-slate-500 text-sm">
          &copy; 2024 Course Management System. All rights reserved.
        </div>
      </footer>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        footer={
          <>
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20"
            >
              Logout Now
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to log out of your account? You will need to sign in again to access
          your courses.
        </p>
      </Modal>
    </div>
  );
};
