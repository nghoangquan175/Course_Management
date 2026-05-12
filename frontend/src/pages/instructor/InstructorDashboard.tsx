import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Users, BarChart3, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/common/Modal';
import { Sidebar } from '../../components/dashboard/Sidebar';
import type { SidebarItem } from '../../components/dashboard/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { CourseManagement } from '../../components/dashboard/CourseManagement';
import { InstructorStudentsTab } from '../../components/dashboard/InstructorStudentsTab';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { instructorService } from '../../api/instructorService';
import { format } from 'date-fns';

import { useSearchParams } from 'react-router-dom';

export const InstructorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize active tab from URL params to avoid cascading renders in useEffect
  const [activeTab, setActiveTab] = useState(() => {
    const view = new URLSearchParams(window.location.search).get('view');
    const courseId = new URLSearchParams(window.location.search).get('courseId');
    if (view === 'detail' && courseId) return 'courses';
    return 'overview';
  });

  const [subView, setSubView] = useState('list');

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" /> },
  ];

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    setIsLoggingOut(true);

    // Simulate a smooth transition delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    logout();
    navigate('/login');
  };

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['instructor-stats'],
    queryFn: instructorService.getStats,
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <CourseManagement
            onViewChange={setSubView}
            currentUserId={user?.id}
            initialView={searchParams.get('view') as any}
            initialCourseId={searchParams.get('courseId') || undefined}
          />
        );
      case 'students':
        return <InstructorStudentsTab />;
      case 'overview':
      default:
        return (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
              <StatCard
                label="Total Students"
                value={statsData?.stats?.totalStudents?.toLocaleString() || '0'}
                trend="Community"
                icon={<Users />}
              />
              <StatCard
                label="Active Courses"
                value={statsData?.stats?.activeCourses || '0'}
                trend="Published"
                icon={<BookOpen />}
              />
              <StatCard
                label="Total Courses"
                value={statsData?.stats?.totalCourses || '0'}
                trend="Created"
                icon={<BarChart3 />}
              />
              <StatCard
                label="Total Enrollments"
                value={statsData?.stats?.totalEnrollments?.toLocaleString() || '0'}
                icon={<LayoutDashboard />}
              />
            </div>

            {/* Recent Performance/Activity */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
              <div className="lg:col-span-2 glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Recent Enrollments</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  ) : statsData?.recentEnrollments?.length > 0 ? (
                    statsData.recentEnrollments.map((enrollment: any) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-white/10 overflow-hidden">
                            {enrollment.studentThumbnail ? (
                              <img
                                src={enrollment.studentThumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              enrollment.studentName.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{enrollment.studentName}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              enrolled in{' '}
                              <span className="text-indigo-400">{enrollment.courseName}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">
                            {format(new Date(enrollment.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 italic">
                      No recent enrollments found.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Student Reviews</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  ) : statsData?.recentReviews?.length > 0 ? (
                    statsData.recentReviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-white/10">
                              {review.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{review.studentName}</p>
                              <p className="text-[10px] text-slate-500">
                                {format(new Date(review.createdAt), 'MMM dd, HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-2.5 h-2.5 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-600'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-indigo-400 font-bold mb-1 truncate">
                          {review.courseName}
                        </p>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic">
                          "{review.comment}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 italic text-sm">
                      No reviews yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
      <AnimatePresence>
        {isLoggingOut && <FullscreenLoader label="Logging out..." />}
      </AnimatePresence>

      <Sidebar
        items={sidebarItems}
        activeItem={activeTab}
        onItemClick={setActiveTab}
        title="INSTRUCTOR DASHBOARD"
        onLogout={() => setIsLogoutModalOpen(true)}
        userRoleLabel="Expert Instructor"
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
        {(activeTab !== 'courses' || subView === 'list') && (
          <DashboardHeader placeholder="Search in your courses..." />
        )}

        <div className="flex-1 overflow-hidden flex flex-col">{renderContent()}</div>
      </main>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        footer={
          <>
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-6 py-2 text-sm text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold"
            >
              Logout
            </button>
          </>
        }
      >
        <p>Are you sure you want to log out from the Instructor Dashboard?</p>
      </Modal>
    </div>
  );
};
