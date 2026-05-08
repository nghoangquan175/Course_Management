import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Users, BarChart3, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/common/Modal';
import { Sidebar } from '../../components/dashboard/Sidebar';
import type { SidebarItem } from '../../components/dashboard/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { CourseManagement } from '../../components/dashboard/CourseManagement';
import { UserManagement } from '../../components/dashboard/UserManagement';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { AnimatePresence } from 'framer-motion';

import { useSearchParams } from 'react-router-dom';
import { useCourses } from '../../hooks/useCourseQueries';

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
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(undefined);

  const { data: courses = [], isLoading: isLoadingCourses } = useCourses({ status: currentStatus });

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

  const onStatusChange = (status: string) => {
    setCurrentStatus(status);
  };

  // Mock student data for instructor
  const mockStudents = Array.from({ length: 8 }).map((_, i) => ({
    id: `student-${i}`,
    name: `Active Student ${i}`,
    email: `student${i}@example.com`,
    role: 'USER',
    isActivated: true,
    createdAt: new Date().toISOString(),
  }));

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <CourseManagement
            courses={courses}
            onRefresh={onStatusChange}
            currentStatus={(currentStatus as any) || 'all'}
            isLoading={isLoadingCourses}
            onViewChange={setSubView}
            currentUserId={user?.id}
            initialView={searchParams.get('view') as any}
            initialCourseId={searchParams.get('courseId') || undefined}
          />
        );
      case 'students':
        return <UserManagement users={mockStudents} title="My Students" showAddButton={false} />;
      case 'overview':
      default:
        return (
          <div className="flex-1 flex flex-col min-h-0 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
              <StatCard label="Total Students" value="8,420" trend="+15%" icon={<Users />} />
              <StatCard label="Course Rating" value="4.8" trend="Top 5%" icon={<BookOpen />} />
              <StatCard label="Monthly Revenue" value="$4,250" trend="+20%" icon={<BarChart3 />} />
              <StatCard label="New Messages" value="12" icon={<MessageSquare />} />
            </div>

            {/* Recent Performance/Activity */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
              <div className="lg:col-span-2 glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Recent Sales</h3>
                <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-slate-500 italic bg-white/5">
                  Sales Data Visualization Area
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-white/5 flex flex-col min-h-0">
                <h3 className="text-lg font-bold mb-4 shrink-0">Student Reviews</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-white/10">
                          JD
                        </div>
                        <div>
                          <p className="text-xs font-bold">John Doe</p>
                          <p className="text-[10px] text-slate-500">2 hours ago</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed italic">
                        "Great course! The explanations are very clear and easy to follow."
                      </p>
                    </div>
                  ))}
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
