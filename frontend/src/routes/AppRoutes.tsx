import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../layouts/Layout';
import { Home } from '../pages/Home';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ActivationStatusPage } from '../pages/auth/ActivationStatusPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserDashboard } from '../pages/user/UserDashboard';
import { InstructorDashboard } from '../pages/instructor/InstructorDashboard';
import { PublicCourseDetail } from '../pages/user/PublicCourseDetail';
import { LearningPlayer } from '../pages/user/LearningPlayer';
import { ExamPlayer } from '../pages/user/ExamPlayer';
import { BecomeInstructor } from '../pages/user/BecomeInstructor';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'course/:id',
        element: <PublicCourseDetail />,
      },
    ],
  },
  {
    path: '/become-instructor',
    element: <BecomeInstructor />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <AdminDashboard />,
  },
  {
    path: '/dashboard',
    element: <UserDashboard />,
  },
  {
    path: '/instructor/dashboard',
    element: <InstructorDashboard />,
  },
  {
    path: '/learning/:id',
    element: <LearningPlayer />,
  },
  {
    path: '/exam/:lessonId',
    element: <ExamPlayer />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/activate/:token',
    element: <ActivationStatusPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordPage />,
  },
]);
