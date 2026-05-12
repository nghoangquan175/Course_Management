import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import cloudinaryRoutes from './routes/cloudinaryRoutes';
import categoryRoutes from './routes/categoryRoutes';
import courseRoutes from './routes/courseRoutes';
import lessonRoutes from './routes/lessonRoutes';
import examRoutes from './routes/examRoutes';
import progressRoutes from './routes/progressRoutes';
import certificateRoutes from './routes/certificateRoutes';
import reviewRoutes from './routes/reviewRoutes';
import instructorApplicationRoutes from './routes/instructorApplicationRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import instructorRoutes from './routes/instructorRoutes';

dotenv.config();

const app: Application = express();

app.set('trust proxy', 1);

// Middlewares
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL].filter(
      Boolean
    ) as string[],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructor', instructorRoutes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to Course Management API' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;

  // In production, hide stack traces and internal error details for 500 errors
  let message = err.message || 'Something went wrong';
  if (process.env.NODE_ENV === 'production' && status === 500) {
    console.error('INTERNAL SERVER ERROR:', err);
    message = 'An internal server error occurred. Please try again later.';
  }

  res.status(status).json({
    success: false,
    status,
    message,
  });
});

export default app;
