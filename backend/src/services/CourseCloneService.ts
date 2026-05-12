import { Course, Lesson, Exam, Question, Attachment, Category, User } from '../models';
import sequelize from '../config/db';
import { Transaction, Op } from 'sequelize';

export class CourseCloneService {
  /**
   * Deep clones a course including its lessons, exams, questions, and attachments.
   * @param sourceCourseId The ID of the course to clone
   * @returns The newly created course version
   */
  static async cloneCourse(sourceCourseId: string): Promise<Course> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // 1. Fetch source course with all relations
      const sourceCourse = await Course.findByPk(sourceCourseId, {
        include: [
          {
            model: Lesson,
            as: 'lessons',
            include: [
              {
                model: Exam,
                as: 'exam',
                include: [{ model: Question, as: 'questions' }],
              },
              {
                model: Attachment,
                as: 'attachments',
              },
            ],
          },
        ],
        transaction,
      });

      if (!sourceCourse) {
        throw new Error('Source course not found');
      }

      // 2. Prepare new version info
      const parentId = sourceCourse.parentCourseId || sourceCourse.id;

      // Get the highest version number for this lineage
      const maxVersionCourse = await Course.findOne({
        where: {
          [Op.or]: [{ id: parentId }, { parentCourseId: parentId }],
        },
        order: [['version', 'DESC']],
        transaction,
      });

      const nextVersion = (maxVersionCourse?.version || 1) + 1;
      const newSlug = `${sourceCourse.slug}-v${nextVersion}`;

      // 3. Create the new course (Draft)
      const newCourseData = sourceCourse.get({ plain: true });
      delete newCourseData.id;
      delete newCourseData.createdAt;
      delete newCourseData.updatedAt;
      delete newCourseData.deletedAt;
      delete newCourseData.lessons; // Handled separately

      const newCourse = await Course.create(
        {
          ...newCourseData,
          slug: newSlug,
          version: nextVersion,
          parentCourseId: parentId,
          status: 'DRAFT',
          isLatest: true, // We can set this to true for the draft
        },
        { transaction }
      );

      // 4. Clone Lessons
      if (sourceCourse.lessons && sourceCourse.lessons.length > 0) {
        for (const sourceLesson of sourceCourse.lessons) {
          const lessonData = sourceLesson.get({ plain: true });
          const sourceLessonId = lessonData.id;
          const sourceExam = lessonData.exam;
          const sourceAttachments = lessonData.attachments;

          delete lessonData.id;
          delete lessonData.courseId;
          delete lessonData.createdAt;
          delete lessonData.updatedAt;
          delete lessonData.exam;
          delete lessonData.attachments;

          const newLesson = await Lesson.create(
            {
              ...lessonData,
              courseId: newCourse.id,
            },
            { transaction }
          );

          // 4a. Clone Attachments
          if (sourceAttachments && sourceAttachments.length > 0) {
            for (const sourceAttachment of sourceAttachments) {
              const attachmentData = { ...sourceAttachment };
              delete attachmentData.id;
              delete attachmentData.lessonId;
              delete attachmentData.createdAt;
              delete attachmentData.updatedAt;

              await Attachment.create(
                {
                  ...attachmentData,
                  lessonId: newLesson.id,
                },
                { transaction }
              );
            }
          }

          // 4b. Clone Exam & Questions
          if (sourceExam) {
            const examData = { ...sourceExam };
            const sourceQuestions = examData.questions;

            delete examData.id;
            delete examData.lessonId;
            delete examData.createdAt;
            delete examData.updatedAt;
            delete examData.questions;

            const newExam = await Exam.create(
              {
                ...examData,
                lessonId: newLesson.id,
              },
              { transaction }
            );

            if (sourceQuestions && sourceQuestions.length > 0) {
              for (const sourceQuestion of sourceQuestions) {
                const questionData = { ...sourceQuestion };
                delete questionData.id;
                delete questionData.examId;
                delete questionData.createdAt;
                delete questionData.updatedAt;

                await Question.create(
                  {
                    ...questionData,
                    examId: newExam.id,
                  },
                  { transaction }
                );
              }
            }
          }
        }
      }

      await transaction.commit();
      return newCourse;
    } catch (error) {
      await transaction.rollback();
      console.error('Course cloning failed:', error);
      throw error;
    }
  }
}
