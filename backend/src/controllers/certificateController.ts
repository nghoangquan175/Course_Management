import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import moment from 'moment';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import PuppeteerManager from '../utils/puppeteerManager';
import { 
  Certificate, 
  Course, 
  User, 
  Lesson, 
  Enrollment, 
  UserProgress, 
  Exam, 
  ExamResult 
} from '../models';

export const generateCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // 1. Check if certificate already exists
    const existingCert = await Certificate.findOne({ where: { userId, courseId } });
    if (existingCert) {
      return res.status(200).json(existingCert);
    }

    // 2. Validate Completion (Lessons + Exams)
    const course = await Course.findByPk(courseId, {
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name'] },
        { 
          model: Lesson, 
          as: 'lessons',
          include: [{ model: Exam, as: 'exam' }]
        }
      ]
    });

    if (!course) return res.status(404).json({ message: 'Course not found' });

    const lessons = course.lessons || [];
    const totalLessons = lessons.length;
    let completedCount = 0;

    for (const lesson of lessons) {
      const videoProgress = await UserProgress.findOne({
        where: { userId, courseId, lessonId: lesson.id }
      });
      const videoDone = videoProgress?.status === 'COMPLETED';

      if (lesson.exam) {
        const examResult = await ExamResult.findOne({
          where: { userId, examId: lesson.exam.id, isPassed: true }
        });
        if (videoDone && examResult) completedCount++;
      } else {
        if (videoDone) completedCount++;
      }
    }

    if (completedCount < totalLessons || totalLessons === 0) {
      return res.status(400).json({ 
        message: 'Course not fully completed yet. Finish all lessons and pass all quizzes.',
        progress: `${completedCount}/${totalLessons}`
      });
    }

    // 3. Prepare Data
    const student = await User.findByPk(userId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const certificateCode = `CERT-${moment().format('YYYYMMDD')}-${userId.substring(0, 4)}-${courseId.substring(0, 4)}`.toUpperCase();
    const issuedDate = moment().format('MMMM Do, YYYY');

    // 4. Compile HTML Template
    const templatePath = path.join(__dirname, '../templates/certificate.hbs');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateHtml);
    
    const html = template({
      studentName: student.name,
      courseName: course.name,
      instructorName: course.instructor?.name || 'Instructor',
      issuedDate,
      certificateCode
    });

    // 5. Convert to PDF
    const pdfBuffer = await PuppeteerManager.generatePDF(html);

    // 6. Upload to Cloudinary using Stream
    const uploadResult: any = await new Promise((resolve, reject) => {
      const readable = new Readable();
      readable.push(pdfBuffer);
      readable.push(null);

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'course_edu/certificates',
          resource_type: 'raw',
          public_id: `cert_${userId}_${courseId}`,
          format: 'pdf'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      readable.pipe(stream);
    });

    // 7. Save to DB
    const certificate = await Certificate.create({
      userId,
      courseId,
      pdfUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      certificateCode,
      studentNameSnap: student.name,
      courseTitleSnap: course.name,
      issuedAt: new Date()
    });

    // 8. Mark Enrollment as COMPLETED
    await Enrollment.update(
      { status: 'COMPLETED' },
      { where: { userId, courseId } }
    );

    res.status(201).json(certificate);
  } catch (error) {
    console.error('GENERATE CERTIFICATE ERROR:', error);
    next(error);
  }
};

export const getCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    const certificate = await Certificate.findOne({ where: { userId, courseId } });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    res.status(200).json(certificate);
  } catch (error) {
    next(error);
  }
};
