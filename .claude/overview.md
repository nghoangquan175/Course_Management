# Project Overview

## Project Summary
Project name: Course Management (MOHA Software)

This is a comprehensive Learning Management System (LMS) designed for course creation, enrollment, and instructor management.

### Technology Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL (ORM: Sequelize)
- **Auth**: JWT-based (stored in secure HTTP-only cookies)
- **Email**: Nodemailer (Gmail SMTP configured for production)
- **Files**: Cloudinary for images/videos and CV uploads

## Architecture
The project follows a monorepo-style structure for clean separation of concerns:
- **frontend/**: React UI application
- **backend/**: Node.js Express REST API server
- **Root Level**: Global configuration for Git Hooks (Husky), Lint-staged, and Prettier.

## High-Level Structure

### Frontend
- **src/pages**: Route-based pages (Home, BecomeInstructor, Dashboard, LearningPlayer...)
- **src/components**: Reusable UI components (Dashboard tabs, Course cards, Modals...)
- **src/hooks**: Custom React hooks for data fetching (useAuth, useInstructorApplications...)
- **src/api**: Service layer for API interaction (courseService, cloudinaryService...)
- **src/routes**: Centralized navigation definitions

### Backend
- **src/routes**: API route definitions (auth, courses, instructor-applications...)
- **src/controllers**: Business logic and request handlers
- **src/models**: Sequelize models (User, Course, InstructorApplication, Enrollment...)
- **src/services**: Core services (mailService, cloudinaryService...)
- **src/config**: System & Database configuration (Sequelize, Mail transporter)
- **migrations/**: Database schema version control (root of backend)
- **seeders/**: Database seed data (root of backend)

## Key Features
- **Instructor Partnership System**: End-to-end workflow for users to apply as instructors with administrative approval/rejection.
- **Learning Interface**: Video persistence, progress tracking, and automated certification.
- **Management Dashboard**: Specialized portals for Admins, Instructors, and Students.
- **DevOps/Standards**: Integrated Prettier, Husky, and lint-staged for consistent code quality.
