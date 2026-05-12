import User, { UserRole } from './User';
import Category from './Category';
import Course, { CourseStatus } from './Course';
import Lesson from './Lesson';
import Attachment from './Attachment';
import Exam from './Exam';
import Question from './Question';
import Review from './Review';
import Enrollment from './Enrollment';
import UserProgress, { ProgressStatus } from './UserProgress';
import RefreshToken from './RefreshToken';
import ExamResult from './ExamResult';
import Certificate from './Certificate';
import InstructorApplication from './InstructorApplication';
import Notification from './Notification';
import CourseEditRequest from './CourseEditRequest';

// --- User Associations ---
User.hasMany(Course, { foreignKey: 'instructorId', as: 'instructedCourses' });
User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
User.hasMany(UserProgress, { foreignKey: 'userId', as: 'progress' });
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
User.hasMany(ExamResult, { foreignKey: 'userId', as: 'examResults' });
User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates' });
User.hasMany(InstructorApplication, { foreignKey: 'userId', as: 'instructorApplications' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(CourseEditRequest, { foreignKey: 'instructorId', as: 'editRequests' });

// --- RefreshToken Associations ---
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Category Associations ---
Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

// --- Course Associations ---
Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });
Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Course.hasMany(Review, { foreignKey: 'courseId', as: 'reviews' });
Course.hasMany(UserProgress, { foreignKey: 'courseId', as: 'progress' });
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates' });
Course.belongsTo(Course, { foreignKey: 'parentCourseId', as: 'parent' });
Course.hasMany(Course, { foreignKey: 'parentCourseId', as: 'versions' });
Course.hasMany(CourseEditRequest, { foreignKey: 'courseId', as: 'editRequests' });

// --- Lesson Associations ---
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Lesson.hasOne(Exam, { foreignKey: 'lessonId', as: 'exam' });
Lesson.hasMany(UserProgress, { foreignKey: 'lessonId', as: 'progress' });

// --- Exam Associations ---
Exam.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
Exam.hasMany(Question, { foreignKey: 'examId', as: 'questions' });
Exam.hasMany(ExamResult, { foreignKey: 'examId', as: 'results' });

// --- Question Associations ---
Question.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

// --- Review Associations ---
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// --- Enrollment Associations ---
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// --- UserProgress Associations ---
UserProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserProgress.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
UserProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

// --- ExamResult Associations ---
ExamResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ExamResult.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

// --- Certificate Associations ---
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// --- InstructorApplication Associations ---
InstructorApplication.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- Notification Associations ---
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// --- CourseEditRequest Associations ---
CourseEditRequest.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CourseEditRequest.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

export {
  User,
  UserRole,
  Category,
  Course,
  CourseStatus,
  Lesson,
  Attachment,
  Exam,
  Question,
  Review,
  Enrollment,
  UserProgress,
  ProgressStatus,
  ExamResult,
  Certificate,
  InstructorApplication,
  Notification,
  CourseEditRequest,
};
