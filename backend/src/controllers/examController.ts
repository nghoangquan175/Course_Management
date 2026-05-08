import { Request, Response, NextFunction } from 'express';
import Exam from '../models/Exam';
import ExamResult from '../models/ExamResult';
import Question from '../models/Question';
import Lesson from '../models/Lesson';
import Course from '../models/Course';
import UserProgress, { ProgressStatus } from '../models/UserProgress';
import Enrollment from '../models/Enrollment';
import sequelize from '../config/db';
import { Op } from 'sequelize';

export const getLessonExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params;
    const exam = await Exam.findOne({
      where: { lessonId },
      include: [
        { model: Question, as: 'questions' },
        { model: Lesson, as: 'lesson' },
      ],
      order: [[{ model: Question, as: 'questions' }, 'order', 'ASC']],
    });
    res.status(200).json(exam);
  } catch (error) {
    next(error);
  }
};

export const upsertExam = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();
  try {
    const { lessonId, title, description, passingScore, timeLimit, questions } = req.body;

    // Check ownership of the course/lesson
    const lesson = await Lesson.findByPk(lessonId as string, {
      include: [{ model: Course, as: 'course' }],
    });

    if (!lesson || !lesson.course) {
      return res.status(404).json({ message: 'Lesson or Course not found' });
    }

    if (lesson.course.instructorId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // 1. Find or Create Exam
    let exam = await Exam.findOne({ where: { lessonId }, transaction });

    if (!exam) {
      exam = await Exam.create(
        {
          lessonId,
          title,
          description,
          passingScore,
          timeLimit,
        },
        { transaction }
      );
    } else {
      await exam.update(
        {
          title,
          description,
          passingScore,
          timeLimit,
        },
        { transaction }
      );
    }

    // 2. Handle Questions
    await Question.destroy({ where: { examId: exam.id }, transaction });

    if (questions && Array.isArray(questions)) {
      for (const [index, q] of questions.entries()) {
        const { id: oldId, createdAt, updatedAt, deletedAt, ...questionData } = q;
        await Question.create(
          {
            ...questionData,
            examId: exam!.id,
            order: index + 1,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    const fullExam = await Exam.findByPk(exam.id as string, {
      include: [{ model: Question, as: 'questions' }],
    });

    res.status(200).json(fullExam);
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('UPSERT EXAM ERROR:', error);
    next(error);
  }
};

export const deleteExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id as string, { include: [Lesson] });

    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const lesson = await Lesson.findByPk(exam.lessonId as string);
    const course = await Course.findByPk(lesson?.courseId as string);
    if (!course || course.instructorId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await exam.destroy();
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const submitExam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { examId, answers } = req.body; // answers: { [questionId: string]: string }
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const exam = await Exam.findByPk(examId as string, {
      include: [{ model: Question, as: 'questions' }],
    });

    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Calculate score
    const questions = exam.questions || [];
    let correctCount = 0;

    questions.forEach((q: any) => {
      if (answers[q.id] !== undefined && Number(answers[q.id]) === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const isPassed = score >= exam.passingScore;

    // Always create a NEW ExamResult for every attempt (persistence log)
    const result = await ExamResult.create({
      userId,
      examId,
      score,
      isPassed,
      userAnswers: answers, // Store what user selected
    });

    // SYNC PROGRESS: If passed, check if lesson can be marked COMPLETED
    if (isPassed) {
      const lesson = await Lesson.findByPk(exam.lessonId);
      if (lesson) {
        const [progress] = await UserProgress.findOrCreate({
          where: { userId, lessonId: lesson.id, courseId: lesson.courseId },
          defaults: { status: ProgressStatus.IN_PROGRESS, isVideoCompleted: !lesson.videoUrl },
        });

        // If video is done (or no video), mark lesson as COMPLETED
        if (progress.isVideoCompleted) {
          progress.status = ProgressStatus.COMPLETED;
          await progress.save();
        }

        // Recalculate total course progress
        const courseId = lesson.courseId;
        const allLessons = await Lesson.findAll({
          where: { courseId },
          attributes: ['id', 'videoUrl'],
        });

        if (allLessons.length > 0) {
          const allProg = await UserProgress.findAll({ where: { userId, courseId } });
          const progMap = new Map(allProg.map((p) => [p.lessonId, p.isVideoCompleted]));

          const allExams = await Exam.findAll({
            where: { lessonId: { [Op.in]: allLessons.map((l) => l.id) } },
          });
          const examMap = new Map(allExams.map((ex) => [ex.lessonId, ex.id]));

          const allResults = await ExamResult.findAll({ where: { userId } });
          const passedExams = new Set(allResults.filter((r) => r.isPassed).map((r) => r.examId));

          let completedCount = 0;
          for (const l of allLessons) {
            const isVideoDone = !l.videoUrl || progMap.get(l.id);
            const exId = examMap.get(l.id);
            const quizPassed = exId ? passedExams.has(exId) : true;

            if (isVideoDone && quizPassed) {
              completedCount++;
            }
          }

          const totalPercentage = Math.round((completedCount / allLessons.length) * 100);
          await Enrollment.update({ progress: totalPercentage }, { where: { userId, courseId } });
        }
      }
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyExamResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const results = await ExamResult.findAll({
      where: { userId },
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [
            {
              model: Lesson,
              as: 'lesson',
              attributes: ['id', 'title', 'courseId'],
              include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

export const getResultById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await ExamResult.findByPk(id as string, {
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [
            { model: Question, as: 'questions' },
            { model: Lesson, as: 'lesson' },
          ],
        },
      ],
    });

    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.userId !== userId) return res.status(403).json({ message: 'Unauthorized' });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
