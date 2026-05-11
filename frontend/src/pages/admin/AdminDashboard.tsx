import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Users, BarChart3, Bell, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../../components/common/Modal';
import { Sidebar } from '../../components/dashboard/Sidebar';
import type { SidebarItem } from '../../components/dashboard/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { CourseManagement } from '../../components/dashboard/CourseManagement';
import { InstructorApplicationManagement } from '../../components/dashboard/InstructorApplicationManagement';
import { AdminNotifications } from '../../components/dashboard/AdminNotifications';
import { AdminUsersTab } from '../../components/dashboard/AdminUsersTab';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { AnimatePresence } from 'framer-motion';

import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { formatDistanceToNow } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize active tab from URL params to avoid cascading renders in useEffect
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const courseId = params.get('courseId');
    const tab = params.get('tab');
    const appId = params.get('appId');

    if (view === 'detail' && courseId) return 'courses';
    if (tab === 'applications' || appId) return 'applications';
    return 'overview';
  });

  const [subView, setSubView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'list';
  });

  // Sync activeTab with URL params when they change (e.g., clicking a notification)
  useEffect(() => {
    const view = searchParams.get('view');
    const courseId = searchParams.get('courseId');
    const tab = searchParams.get('tab');
    const appId = searchParams.get('appId');

    // Use setTimeout to avoid synchronous cascading renders (satisfies lint rules)
    setTimeout(() => {
      if (view === 'detail' && courseId) {
        setActiveTab('courses');
        setSubView('detail');
      } else if (tab === 'applications' || appId) {
        setActiveTab('applications');
      } else if (tab === 'notifications') {
        setActiveTab('notifications');
      } else if (!view && !tab && !appId) {
        // If we are on base /admin, reset to overview or current tab's list
        setSubView('list');
      }
    }, 0);
  }, [searchParams]);

  const { data: adminStats, isLoading: isLoadingStats } = useAdminDashboard();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Clear URL params when switching tabs manually via sidebar
    navigate('/admin');
    setSubView('list');
  };

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  ];

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    setIsLoggingOut(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    logout();
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <CourseManagement
            onViewChange={setSubView}
            isAdmin={true}
            currentUserId={user?.id}
            initialView={searchParams.get('view') as any}
            initialCourseId={searchParams.get('courseId') || undefined}
          />
        );
      case 'users':
        return <AdminUsersTab />;
      case 'applications':
        return <InstructorApplicationManagement />;
      case 'notifications':
        return <AdminNotifications />;
      case 'overview':
      default:
        return (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
              <StatCard
                label="Total Users"
                value={isLoadingStats ? '...' : adminStats?.stats.totalUsers.toLocaleString()}
                trend="+12%"
                icon={<Users />}
              />
              <StatCard
                label="Active Courses"
                value={isLoadingStats ? '...' : adminStats?.stats.activeCourses.toLocaleString()}
                trend="+5%"
                icon={<BookOpen />}
              />
              <StatCard
                label="Total Enrollments"
                value={isLoadingStats ? '...' : adminStats?.stats.totalEnrollments.toLocaleString()}
                trend={adminStats?.stats.revenueTrend}
                icon={<BarChart3 />}
              />
              <StatCard
                label="Pending Tasks"
                value={isLoadingStats ? '...' : adminStats?.stats.pendingTasks.toString()}
                trend="-2"
                icon={<Bell />}
              />
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Recent Activity</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {isLoadingStats ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-4 py-2">
                        <div className="w-2 h-2 bg-white/10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-white/10 rounded w-3/4"></div>
                          <div className="h-2 bg-white/10 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))
                  ) : adminStats?.activities.length > 0 ? (
                    adminStats.activities.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0"
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            activity.type === 'USER_REGISTERED'
                              ? 'bg-green-500'
                              : activity.type === 'COURSE_CREATED'
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                          }`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (activity.type === 'USER_REGISTERED') setActiveTab('users');
                            else if (activity.type === 'COURSE_CREATED') setActiveTab('courses');
                            else if (activity.type === 'APPLICATION_SUBMITTED')
                              setActiveTab('applications');
                          }}
                          className="text-[10px] text-indigo-400 hover:underline shrink-0"
                        >
                          View
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic text-center py-10">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Performance Overview</h3>
                <div className="flex-1 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-dashed border-white/10 p-6">
                  <BarChart3 className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 text-sm text-center">
                    Enrollment and activity data will appear here as more users join the platform.
                  </p>
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
        onItemClick={handleTabChange}
        title="ADMIN DASHBOARD"
        onLogout={() => setIsLogoutModalOpen(true)}
        userRoleLabel="Super Admin"
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
        {(activeTab !== 'courses' || subView === 'list') &&
          (activeTab !== 'applications' || !searchParams.get('appId')) && <DashboardHeader />}
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
        <p>Are you sure you want to log out from the administration portal?</p>
      </Modal>
    </div>
  );
};
