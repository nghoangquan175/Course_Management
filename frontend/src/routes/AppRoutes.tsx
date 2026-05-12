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
import { CertificateView } from '../pages/user/CertificateView';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicRoute } from '../components/auth/PublicRoute';

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
    element: (
      <ProtectedRoute>
        <BecomeInstructor />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/admin/login',
    element: (
      <PublicRoute>
        <AdminLoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['USER', 'INSTRUCTOR', 'ADMIN']}>
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/instructor/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <InstructorDashboard />
      </ProtectedRoute>
    ),
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
    path: '/certificate/:courseId',
    element: (
      <ProtectedRoute>
        <CertificateView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: '/activate/:token',
    element: <ActivationStatusPage />,
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password/:token',
    element: (
      <PublicRoute>
        <ResetPasswordPage />
      </PublicRoute>
    ),
  },
]);
