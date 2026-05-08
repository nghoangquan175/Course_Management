import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Users, BarChart3, Bell, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/common/Modal';
import { Sidebar } from '../../components/dashboard/Sidebar';
import type { SidebarItem } from '../../components/dashboard/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { UserManagement } from '../../components/dashboard/UserManagement';
import { CourseManagement } from '../../components/dashboard/CourseManagement';
import { InstructorApplicationManagement } from '../../components/dashboard/InstructorApplicationManagement';
import { AdminNotifications } from '../../components/dashboard/AdminNotifications';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { AnimatePresence } from 'framer-motion';

import { useSearchParams } from 'react-router-dom';
import { useCourses } from '../../hooks/useCourseQueries';

export const AdminDashboard: React.FC = () => {
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
  const [currentStatus, setCurrentStatus] = useState<string | 'all'>('all');

  const { data: courses = [], isLoading: isLoadingCourses } = useCourses({ status: currentStatus });

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    setIsLoggingOut(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    logout();
    navigate('/admin/login');
  };

  const onStatusChange = (status: string) => {
    setCurrentStatus(status);
  };

  const mockUsers = Array.from({ length: 15 }).map((_, i) => ({
    id: `user-${i}`,
    name: i % 2 === 0 ? `Instructor ${i}` : `Student ${i}`,
    email: i % 2 === 0 ? `inst${i}@test.com` : `user${i}@test.com`,
    role: i % 2 === 0 ? 'INSTRUCTOR' : 'USER',
    isActivated: i % 3 !== 0,
    createdAt: new Date().toISOString(),
  }));

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <CourseManagement
            courses={courses}
            isAdmin={true}
            showCreateButton={false}
            onViewChange={setSubView}
            onRefresh={onStatusChange}
            isLoading={isLoadingCourses}
            currentStatus={currentStatus as any}
            currentUserId={user?.id}
            initialView={searchParams.get('view') as any}
            initialCourseId={searchParams.get('courseId') || undefined}
          />
        );
      case 'users':
        return <UserManagement users={mockUsers} title="User Management" />;
      case 'applications':
        return <InstructorApplicationManagement />;
      case 'notifications':
        return <AdminNotifications />;
      case 'overview':
      default:
        return (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
              <StatCard label="Total Users" value="1,284" trend="+12%" icon={<Users />} />
              <StatCard label="Active Courses" value="42" trend="+5%" icon={<BookOpen />} />
              <StatCard label="Monthly Revenue" value="$12,450" trend="+18%" icon={<BarChart3 />} />
              <StatCard label="Pending Reviews" value="7" trend="-2" icon={<Bell />} />
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Recent Activity</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          New instructor registration pending review
                        </p>
                        <p className="text-[10px] text-slate-500">2 hours ago</p>
                      </div>
                      <button className="text-[10px] text-indigo-400 hover:underline shrink-0">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Course Performance</h3>
                <div className="flex-1 flex items-center justify-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <span className="text-slate-500 text-sm italic">Chart visualization area</span>
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
        title="ADMIN DASHBOARD"
        onLogout={() => setIsLogoutModalOpen(true)}
        userRoleLabel="Super Admin"
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
        {(activeTab !== 'courses' || subView === 'list') && <DashboardHeader />}
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
