import React, { useState } from 'react';
import {
  Plus,
  ChevronDown,
  Edit,
  Eye,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Send,
  Undo,
  CheckCircle,
  XCircle,
  Globe,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateCourseForm } from '../../pages/instructor/CreateCourseForm';
import { CourseDetailView } from './CourseDetailView';
import { CurriculumEditor } from './CurriculumEditor';
import { Modal } from '../common/Modal';
import { useCourseActions } from '../../hooks/useCourseQueries';

export type CourseStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONTENT_APPROVED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'DELETED';

export interface CourseData {
  id: string;
  name: string;
  thumbnailUrl: string;
  status: CourseStatus;
  totalStudents: number;
  instructor?: string;
  createdAt: string;
  deletedAt?: string;
}

interface CourseManagementProps {
  courses: CourseData[];
  showCreateButton?: boolean;
  isAdmin?: boolean;
  onRefresh?: (status?: string) => void;
  currentStatus?: CourseStatus | 'all';
  isLoading?: boolean;
  onViewChange?: (view: string) => void;
  currentUserId?: string;
  initialView?: 'list' | 'create' | 'edit' | 'detail' | 'curriculum';
  initialCourseId?: string;
}

export const CourseManagement: React.FC<CourseManagementProps> = ({
  courses,
  showCreateButton = true,
  isAdmin = false,
  onRefresh,
  currentStatus = 'all',
  isLoading = false,
  onViewChange,
  currentUserId,
  initialView = 'list',
  initialCourseId,
}) => {
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail' | 'curriculum'>(
    initialView
  );

  // Notify parent of view changes
  React.useEffect(() => {
    if (onViewChange) {
      onViewChange(view);
    }
  }, [view, onViewChange]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [courseToRestore, setCourseToRestore] = useState<string | null>(null);
  const hasInitializedRef = React.useRef(false);

  // Effect to handle initial course from props
  React.useEffect(() => {
    // Only apply initial values if we haven't initialized yet
    if (hasInitializedRef.current) return;

    if (initialCourseId) {
      const course = courses.find((c) => c.id === initialCourseId);
      if (course) {
        setTimeout(() => setSelectedCourse(course), 0);
        hasInitializedRef.current = true;
      } else if (initialView === 'detail') {
        setTimeout(() => setSelectedCourse({ id: initialCourseId } as any), 0);
        hasInitializedRef.current = true;
      }
    }
  }, [initialView, initialCourseId, courses]);

  // Workflow Modal State
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [activeWorkflowAction, setActiveWorkflowAction] = useState<string | null>(null);
  const [courseToProcess, setCourseToProcess] = useState<string | null>(null);

  const courseActions = useCourseActions();

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    courseActions.mutate(
      { id: courseToDelete, action: 'delete' },
      {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setCourseToDelete(null);
        },
      }
    );
  };

  const handleRestoreCourse = async () => {
    if (!courseToRestore) return;
    courseActions.mutate(
      { id: courseToRestore, action: 'restore' },
      {
        onSuccess: () => {
          setIsRestoreModalOpen(false);
          setCourseToRestore(null);
        },
      }
    );
  };

  const handleWorkflowAction = async () => {
    if (!activeWorkflowAction || !courseToProcess) return;

    courseActions.mutate(
      {
        id: courseToProcess,
        action: activeWorkflowAction,
      },
      {
        onSuccess: () => {
          setIsWorkflowModalOpen(false);
          setActiveWorkflowAction(null);
          setCourseToProcess(null);
        },
      }
    );
  };

  const workflowConfigs: Record<
    string,
    { title: string; description: string; icon: any; color: string; buttonText: string }
  > = {
    submit: {
      title: 'Submit for Approval',
      description: 'Are you sure you want to submit this course for approval?',
      icon: Send,
      color: 'bg-purple-500',
      buttonText: 'Confirm Submission',
    },
    withdraw: {
      title: 'Withdraw Course',
      description: 'Are you sure you want to withdraw this course? It will return to DRAFT.',
      icon: Undo,
      color: 'bg-amber-500',
      buttonText: 'Confirm Withdrawal',
    },
    approve: {
      title: 'Approve Course',
      description: 'Are you sure you want to approve this course?',
      icon: CheckCircle,
      color: 'bg-green-600',
      buttonText: 'Confirm Approval',
    },
    reject: {
      title: 'Reject Course',
      description: 'Are you sure you want to reject this course?',
      icon: XCircle,
      color: 'bg-red-600',
      buttonText: 'Confirm Rejection',
    },
    publish: {
      title: 'Publish Course',
      description: 'Are you sure you want to publish this course?',
      icon: Globe,
      color: 'bg-green-600',
      buttonText: 'Publish Now',
    },
    unpublish: {
      title: 'Unpublish Course',
      description: 'Are you sure you want to unpublish this course?',
      icon: XCircle,
      color: 'bg-amber-500',
      buttonText: 'Unpublish',
    },
    requestEdit: {
      title: 'Request Edit',
      description: 'Are you sure you want to request changes? Course will return to DRAFT.',
      icon: AlertCircle,
      color: 'bg-blue-600',
      buttonText: 'Request Edit',
    },
  };

  const statusColors: Record<CourseStatus, string> = {
    DRAFT: 'bg-slate-500/10 text-slate-400',
    PENDING: 'bg-amber-500/10 text-amber-500',
    CONTENT_APPROVED: 'bg-blue-500/10 text-blue-500',
    PUBLISHED: 'bg-green-500/10 text-green-500',
    UNPUBLISHED: 'bg-rose-500/10 text-rose-500',
    DELETED: 'bg-red-500/10 text-red-700',
  };

  const statusOptions: (CourseStatus | 'all')[] = [
    'all',
    'DRAFT',
    'PENDING',
    'CONTENT_APPROVED',
    'PUBLISHED',
    'UNPUBLISHED',
    'DELETED',
  ];

  if (view === 'create') {
    return (
      <CreateCourseForm
        onBack={() => {
          setView('list');
          if (onRefresh) onRefresh();
        }}
      />
    );
  }

  if (view === 'edit' && selectedCourse) {
    return (
      <CreateCourseForm
        onBack={() => {
          setView('list');
          if (onRefresh) onRefresh();
        }}
        initialData={selectedCourse}
      />
    );
  }

  if (view === 'detail' && selectedCourse) {
    return (
      <CourseDetailView
        courseId={selectedCourse.id}
        onBack={() => setView('list')}
        isAdmin={isAdmin}
      />
    );
  }

  if (view === 'curriculum' && selectedCourse) {
    return (
      <CurriculumEditor
        courseId={selectedCourse.id}
        courseName={selectedCourse.name}
        onBack={() => setView('list')}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-xl font-bold">{isAdmin ? 'All Courses' : 'My Courses'}</h2>
        {showCreateButton && (
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Create New Course
          </button>
        )}
      </div>

      <div className="flex-1 glass rounded-3xl border border-white/5 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Course Info
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Instructor
                  </th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2 relative">
                    <span className={currentStatus !== 'all' ? 'text-indigo-400' : ''}>
                      Status {currentStatus !== 'all' && `(${currentStatus.replace('_', ' ')})`}
                    </span>
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`p-1 rounded-md transition-all ${isFilterOpen ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10 text-slate-500'}`}
                    >
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isFilterOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsFilterOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 py-2 overflow-hidden"
                          >
                            {statusOptions.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setIsFilterOpen(false);
                                  if (onRefresh) onRefresh(opt);
                                }}
                                className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 ${currentStatus === opt ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400'}`}
                              >
                                {opt === 'all' ? 'ALL STATUS' : opt.replace('_', ' ')}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Students
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 relative">
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-indigo-400 transition-colors">
                          {course.name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Created on {course.createdAt}
                        </p>
                      </div>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {typeof course.instructor === 'object'
                        ? (course.instructor as any)?.name
                        : course.instructor || 'Unknown'}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${course.deletedAt ? statusColors['DELETED'] : statusColors[course.status]}`}
                    >
                      {course.deletedAt ? 'DELETED' : course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {course.totalStudents?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {course.deletedAt ? (
                        <button
                          onClick={() => {
                            setCourseToRestore(course.id);
                            setIsRestoreModalOpen(true);
                          }}
                          className="p-2 hover:bg-green-500/10 rounded-lg text-green-500/50 hover:text-green-500 flex items-center gap-2 text-[10px] font-bold uppercase"
                        >
                          <RotateCcw className="w-4 h-4" /> Restore
                        </button>
                      ) : (
                        <>
                          {!isAdmin ? (
                            // INSTRUCTOR ACTIONS
                            <>
                              {course.status === 'DRAFT' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setView('curriculum');
                                      setSelectedCourse(course);
                                    }}
                                    className="p-2 hover:bg-indigo-500/10 rounded-lg text-indigo-500/50 hover:text-indigo-500 transition-all"
                                    title="Edit Curriculum"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setView('edit');
                                      setSelectedCourse(course);
                                    }}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                                    title="Edit Info"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveWorkflowAction('submit');
                                      setCourseToProcess(course.id);
                                      setIsWorkflowModalOpen(true);
                                    }}
                                    className="p-2 hover:bg-purple-500/10 rounded-lg text-purple-500/50 hover:text-purple-500 transition-all"
                                    title="Submit"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                  {/* Trash only for owner in DRAFT */}
                                  <button
                                    onClick={() => {
                                      setCourseToDelete(course.id);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-2 hover:bg-white/5 rounded-lg text-red-500/50 hover:text-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {course.status === 'PENDING' && (
                                <button
                                  onClick={() => {
                                    setActiveWorkflowAction('withdraw');
                                    setCourseToProcess(course.id);
                                    setIsWorkflowModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-amber-500/10 rounded-lg text-amber-500/50 hover:text-amber-500"
                                  title="Recall Submission"
                                >
                                  <Undo className="w-4 h-4" />
                                </button>
                              )}
                              {(course.status === 'PUBLISHED' ||
                                course.status === 'UNPUBLISHED') && (
                                <button
                                  onClick={() => {
                                    setActiveWorkflowAction('requestEdit');
                                    setCourseToProcess(course.id);
                                    setIsWorkflowModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500/50 hover:text-blue-500"
                                  title="Request Edit"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            // ADMIN ACTIONS
                            <>
                              {course.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setActiveWorkflowAction('approve');
                                      setCourseToProcess(course.id);
                                      setIsWorkflowModalOpen(true);
                                    }}
                                    className="p-2 hover:bg-green-500/10 rounded-lg text-green-500/50"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveWorkflowAction('reject');
                                      setCourseToProcess(course.id);
                                      setIsWorkflowModalOpen(true);
                                    }}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/50"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {(course.status === 'CONTENT_APPROVED' ||
                                course.status === 'UNPUBLISHED') && (
                                <button
                                  onClick={() => {
                                    setActiveWorkflowAction('publish');
                                    setCourseToProcess(course.id);
                                    setIsWorkflowModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-green-500/10 rounded-lg text-green-500/50"
                                  title="Publish"
                                >
                                  <Globe className="w-4 h-4" />
                                </button>
                              )}
                              {course.status === 'PUBLISHED' && (
                                <button
                                  onClick={() => {
                                    setActiveWorkflowAction('unpublish');
                                    setCourseToProcess(course.id);
                                    setIsWorkflowModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-amber-500/10 rounded-lg text-amber-500/50"
                                  title="Take Down"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              {/* Admin also only sees trash for THEIR OWN drafts */}
                              {course.status === 'DRAFT' &&
                                ((course as any).instructorId === currentUserId ||
                                  (typeof course.instructor === 'object' &&
                                    (course.instructor as any)?.id === currentUserId)) && (
                                  <button
                                    onClick={() => {
                                      setCourseToDelete(course.id);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-2 hover:bg-white/5 rounded-lg text-red-500/50 hover:text-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setView('detail');
                            }}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-6 py-2 text-sm text-slate-400"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCourse}
              disabled={courseActions.isPending}
              className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50"
            >
              {courseActions.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-slate-300">
          <p>Are you sure you want to delete this course?</p>
        </div>
      </Modal>

      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Restore Course"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsRestoreModalOpen(false)}
              className="px-6 py-2 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleRestoreCourse}
              disabled={courseActions.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50"
            >
              {courseActions.isPending ? 'Restoring...' : 'Confirm Restore'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4">
          <RotateCcw className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Confirm Restoration</h3>
          <p className="text-slate-400 text-sm">Restore this course to active list?</p>
        </div>
      </Modal>

      <Modal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        title={activeWorkflowAction ? workflowConfigs[activeWorkflowAction].title : ''}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsWorkflowModalOpen(false)}
              className="px-6 py-2 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleWorkflowAction}
              disabled={courseActions.isPending}
              className={`px-6 py-2 ${activeWorkflowAction ? workflowConfigs[activeWorkflowAction].color : 'bg-indigo-600'} text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50`}
            >
              {courseActions.isPending
                ? 'Processing...'
                : activeWorkflowAction
                  ? workflowConfigs[activeWorkflowAction].buttonText
                  : 'Confirm'}
            </button>
          </div>
        }
      >
        {activeWorkflowAction && (
          <div className="flex flex-col items-center py-4">
            <div
              className={`w-16 h-16 rounded-full ${workflowConfigs[activeWorkflowAction].color}/10 flex items-center justify-center mb-4`}
            >
              {React.createElement(workflowConfigs[activeWorkflowAction].icon, {
                className: `w-8 h-8 ${workflowConfigs[activeWorkflowAction].color.replace('bg-', 'text-')}`,
              })}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {workflowConfigs[activeWorkflowAction].title}
            </h3>
            <p className="text-slate-400 text-sm">
              {workflowConfigs[activeWorkflowAction].description}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
