import { Request, Response, NextFunction } from 'express';
import UserProgress, { ProgressStatus } from '../models/UserProgress';
import Exam from '../models/Exam';
import ExamResult from '../models/ExamResult';
import Lesson from '../models/Lesson';
import Enrollment from '../models/Enrollment';
import { Op } from 'sequelize';

export const updateProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, lessonId, isVideoCompleted, lastWatchedSecond } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let progress = await UserProgress.findOne({
      where: { userId, courseId, lessonId }
    });

    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // 1. Update Video Status
    let updatedIsVideoCompleted = progress?.isVideoCompleted || false;
    if (isVideoCompleted === true) {
      updatedIsVideoCompleted = true;
    }

    // 2. Check Quiz Status
    const exam = await Exam.findOne({ where: { lessonId } });
    let isQuizPassed = true;
    if (exam) {
      const examResult = await ExamResult.findOne({
        where: { userId, examId: exam.id }
      });
      isQuizPassed = !!examResult?.isPassed;
    }

    // 3. Determine Overall Lesson Status
    let newStatus = ProgressStatus.IN_PROGRESS;
    
    // Logic: 
    // Video part is done if: (Lesson has no video) OR (isVideoCompleted is true)
    const videoPartDone = !lesson.videoUrl || updatedIsVideoCompleted;
    
    if (videoPartDone && isQuizPassed) {
      newStatus = ProgressStatus.COMPLETED;
    }

    // Ensure status never reverts from COMPLETED
    if (progress?.status === ProgressStatus.COMPLETED) {
      newStatus = ProgressStatus.COMPLETED;
    }

    if (progress) {
      progress.isVideoCompleted = updatedIsVideoCompleted;
      progress.status = newStatus;
      if (lastWatchedSecond !== undefined) progress.lastWatchedSecond = lastWatchedSecond;
      await progress.save();
    } else {
      progress = await UserProgress.create({
        userId,
        courseId,
        lessonId,
        isVideoCompleted: updatedIsVideoCompleted,
        status: newStatus,
        lastWatchedSecond: lastWatchedSecond || 0
      });
    }

    // 4. Calculate total course progress and update Enrollment
    const allLessons = await Lesson.findAll({ 
      where: { courseId },
      attributes: ['id', 'videoUrl']
    });
    
    if (allLessons.length > 0) {
      const allProg = await UserProgress.findAll({ where: { userId, courseId } });
      const progMap = new Map(allProg.map(p => [p.lessonId, p.isVideoCompleted]));
      
      const allExams = await Exam.findAll({
        where: { lessonId: { [Op.in]: allLessons.map(l => l.id) } }
      });
      const examMap = new Map(allExams.map(ex => [ex.lessonId, ex.id]));
      
      const allResults = await ExamResult.findAll({ where: { userId } });
      const passedExams = new Set(allResults.filter(r => r.isPassed).map(r => r.examId));

      let completedCount = 0;
      for (const l of allLessons) {
        const isVideoDone = !l.videoUrl || progMap.get(l.id);
        const examId = examMap.get(l.id);
        const quizPassed = examId ? passedExams.has(examId) : true;

        if (isVideoDone && quizPassed) {
          completedCount++;
        }
      }

      const totalPercentage = Math.round((completedCount / allLessons.length) * 100);
      await Enrollment.update(
        { progress: totalPercentage },
        { where: { userId, courseId } }
      );
      
      return res.status(200).json({
        ...progress.toJSON(),
        courseProgress: totalPercentage
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [progressRecords, examResults] = await Promise.all([
      UserProgress.findAll({
        where: { userId, courseId },
        order: [['updatedAt', 'DESC']]
      }),
      ExamResult.findAll({
        where: { userId },
        include: [
          {
            model: Exam,
            as: 'exam',
            where: { lessonId: { [Op.not]: null } }, // Filter to only related exams
            include: [{ model: Lesson, as: 'lesson', where: { courseId } }]
          }
        ]
      })
    ]);

    res.status(200).json({
      progress: progressRecords,
      examResults: examResults
    });
  } catch (error) {
    next(error);
  }
};
