import { Request, Response, NextFunction } from 'express';
import Lesson from '../models/Lesson';
import Attachment from '../models/Attachment';
import Course from '../models/Course';

export const getCourseLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const lessons = await Lesson.findAll({
      where: { courseId },
      include: [{ model: Attachment, as: 'attachments' }],
      order: [['order', 'ASC']],
    });
    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, title, textContent, videoUrl, videoDuration, attachments } = req.body;
    
    // Check ownership
    const course = await Course.findByPk(courseId as string);
    if (!course || course.instructorId !== req.user?.id) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }

    // Get max order
    const maxOrder = await Lesson.max('order', { where: { courseId } }) as number || 0;

    const lesson = await Lesson.create({
      courseId,
      title,
      textContent,
      videoUrl,
      videoDuration,
      order: maxOrder + 1,
    });

    // Create attachments if any
    if (attachments && Array.isArray(attachments)) {
      await Promise.all(attachments.map((att: any) => 
        Attachment.create({ ...att, lessonId: lesson.id })
      ));
    }

    const fullLesson = await Lesson.findByPk(lesson.id as string, {
      include: [{ model: Attachment, as: 'attachments' }]
    });

    res.status(201).json(fullLesson);
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, textContent, videoUrl, videoDuration, attachments } = req.body;

    const lesson = await Lesson.findByPk(id as string, { include: [Course] });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    
    // Check ownership
    const course = await Course.findByPk(lesson.courseId as string);
    if (!course || course.instructorId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await lesson.update({ title, textContent, videoUrl, videoDuration });

    // Update attachments
    if (attachments && Array.isArray(attachments)) {
      await Attachment.destroy({ where: { lessonId: id } });
      await Promise.all(attachments.map((att: any) => 
        Attachment.create({ ...att, lessonId: id })
      ));
    }

    const updatedLesson = await Lesson.findByPk(id as string, {
      include: [{ model: Attachment, as: 'attachments' }]
    });

    res.status(200).json(updatedLesson);
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByPk(id as string);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const course = await Course.findByPk(lesson.courseId as string);
    if (!course || course.instructorId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await lesson.destroy();
    res.status(200).json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const reorderLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { lessonOrders } = req.body; // [{id, order}]

    const course = await Course.findByPk(courseId as string);
    if (!course || course.instructorId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Promise.all(lessonOrders.map((item: any) => 
      Lesson.update({ order: item.order }, { where: { id: item.id, courseId } })
    ));

    res.status(200).json({ message: 'Lessons reordered successfully' });
  } catch (error) {
    next(error);
  }
};
