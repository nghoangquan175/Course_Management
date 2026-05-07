import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/common/Modal';
import { Sidebar } from '../../components/dashboard/Sidebar';
import type { SidebarItem } from '../../components/dashboard/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { AnimatePresence } from 'framer-motion';
import { useEnrolledCourses } from '../../hooks/useCourseQueries';
import { CourseReviewModal } from '../../components/course/CourseReviewModal';

// Tab Components
import { OverviewTab } from '../../components/dashboard/OverviewTab';
import { MyCoursesTab } from '../../components/dashboard/MyCoursesTab';
import { AchievementsTab } from '../../components/dashboard/AchievementsTab';
import { ExamsTab } from '../../components/dashboard/ExamsTab';

export const UserDashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [courseStatusTab, setCourseStatusTab] = useState<'in-progress' | 'completed'>('in-progress');

  const {
    data: enrolledCourses = [],
    isLoading
  } = useEnrolledCourses();

  const [selectedCourseForReview, setSelectedCourseForReview] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleRateCourse = (course: any) => {
    setSelectedCourseForReview({
      id: course.id,
      name: course.title,
      thumbnailUrl: course.thumbnail,
      instructorName: course.instructor,
      averageRating: course.rating
    });
    setIsReviewModalOpen(true);
  };

  const sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'my-courses', label: 'My Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'exams', label: 'Exams & Assignments', icon: <FileText className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-5 h-5" /> },
  ];

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': 
        return (
          <OverviewTab 
            enrolledCourses={enrolledCourses} 
            isLoading={isLoading} 
            onRateClick={handleRateCourse} 
          />
        );
      case 'my-courses': 
        return (
          <MyCoursesTab 
            enrolledCourses={enrolledCourses} 
            courseStatusTab={courseStatusTab} 
            setCourseStatusTab={setCourseStatusTab}
            onRateClick={handleRateCourse}
          />
        );
      case 'exams': 
        return <ExamsTab />;
      case 'achievements': 
        return (
          <AchievementsTab 
            completedCourses={enrolledCourses.filter((c: any) => c.status === 'COMPLETED')} 
          />
        );
      default: 
        return (
          <OverviewTab 
            enrolledCourses={enrolledCourses} 
            isLoading={isLoading} 
            onRateClick={handleRateCourse} 
          />
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
        title="USER DASHBOARD"
        onLogout={() => setIsLogoutModalOpen(true)}
        userRoleLabel="Student"
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden p-8 gap-8">
        <DashboardHeader placeholder="Search your courses..." />
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderContent()}
        </div>
      </main>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        footer={
          <>
            <button onClick={() => setIsLogoutModalOpen(false)} className="px-6 py-2 text-sm text-slate-400">Cancel</button>
            <button onClick={handleConfirmLogout} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold">Logout</button>
          </>
        }
      >
        <p>Are you sure you want to log out from your learning dashboard?</p>
      </Modal>

      {selectedCourseForReview && (
        <CourseReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          course={selectedCourseForReview}
        />
      )}
    </div>
  );
};
