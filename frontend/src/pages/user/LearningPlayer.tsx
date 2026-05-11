import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  FileText,
  Sun,
  Moon,
  Menu,
  Award,
  Star,
  Download,
  Info,
  ExternalLink,
} from 'lucide-react';
import Hls from 'hls.js';
import { courseService } from '../../api/courseService';
import { progressService } from '../../api/progressService';
import { certificateService } from '../../api/certificateService';
import { getStreamingUrl } from '../../utils/videoUtils';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { toast } from 'react-hot-toast';
import { CourseReviewModal } from '../../components/course/CourseReviewModal';

export const LearningPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [user, navigate, location]);
  const [course, setCourse] = useState<any>(null);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [videoCompletedLessons, setVideoCompletedLessons] = useState<Set<string>>(new Set());
  const [showRatingBtn, setShowRatingBtn] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'qa'>('overview');
  const [lastTime, setLastTime] = useState(0);
  const [isResumed, setIsResumed] = useState(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [showCertConfirmModal, setShowCertConfirmModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchCourseAndInitialLesson = async () => {
      try {
        if (!id) return;
        setIsLoading(true);

        // 1. Fetch Outline and Progress in parallel
        const [courseData, progressData] = await Promise.all([
          courseService.getById(id, 'outline'),
          progressService.getCourseProgress(id),
        ]);

        // Sort lessons by order
        if (courseData.lessons) {
          courseData.lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        }
        setCourse(courseData);
        setCurrentProgress(courseData.userEnrollment?.progress || 0);

        // Track completed lessons
        if (progressData && progressData.progress) {
          const records = progressData.progress;
          const completed = new Set<string>();
          const videoCompleted = new Set<string>();
          records.forEach((p: any) => {
            if (p.status === 'COMPLETED') completed.add(p.lessonId);
            if (p.isVideoCompleted) videoCompleted.add(p.lessonId);
          });
          setCompletedLessons(completed);
          setVideoCompletedLessons(videoCompleted);

          // Fetch certificate if 100%
          const lessonsTotal = courseData.lessons?.length || 0;
          if (completed.size === lessonsTotal && lessonsTotal > 0) {
            try {
              const cert = await certificateService.getCertificate(id);
              setCertificate(cert);
            } catch (e) {
              /* ignore */
            }
          }
        }

        // Determine which lesson to start with
        const stateLessonId = (location.state as any)?.lessonId;
        let initialLessonId = stateLessonId;

        if (!initialLessonId && progressData?.progress?.length > 0) {
          initialLessonId = progressData.progress[0].lessonId;
          setLastTime(progressData.progress[0].lastWatchedSecond || 0);
        }

        if (!initialLessonId && courseData.lessons?.length > 0) {
          initialLessonId = courseData.lessons[0].id;
        }

        const lessonIdx = courseData.lessons.findIndex((l: any) => l.id === initialLessonId);
        if (lessonIdx !== -1) {
          setCurrentLessonIdx(lessonIdx);

          // 2. Fetch Initial Lesson Detail IMMEDIATELY to show video faster
          setIsLessonLoading(true);
          try {
            const detail = await courseService.getLessonDetail(initialLessonId);
            setActiveLesson(detail);
          } catch (e) {
            console.error('Failed to fetch initial lesson detail:', e);
          } finally {
            setIsLessonLoading(false);
          }
        }
      } catch (error) {
        toast.error('Failed to load course content');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseAndInitialLesson();
  }, [id, navigate]); // Remove location.state dependency to avoid re-fetch on every state change

  // Fetch Lesson Detail when index changes (Skip first run because fetchCourseAndInitialLesson handles it)
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const fetchLessonDetail = async () => {
      if (!course?.lessons?.[currentLessonIdx]) return;

      const lessonId = course.lessons[currentLessonIdx].id;
      setIsLessonLoading(true);
      try {
        const detail = await courseService.getLessonDetail(lessonId);
        setActiveLesson(detail);
      } catch (error) {
        toast.error('Failed to load lesson details');
      } finally {
        setIsLessonLoading(false);
      }
    };

    fetchLessonDetail();
  }, [currentLessonIdx]);

  const currentLesson = course?.lessons?.[currentLessonIdx];

  // HLS logic
  useEffect(() => {
    if (activeLesson?.videoUrl && videoRef.current) {
      const video = videoRef.current;
      const hlsUrl = getStreamingUrl(activeLesson.videoUrl);

      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((e) => console.log('Autoplay prevented:', e));
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.play().catch((e) => console.log('Autoplay prevented:', e));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsResumed(false);
    };
  }, [currentLesson]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && lastTime > 0 && !isResumed) {
      videoRef.current.currentTime = lastTime;
      setIsResumed(true);
    }
  };

  const syncProgress = React.useCallback(
    async (isVideoDone = false) => {
      if (!videoRef.current && !isVideoDone && currentLesson?.videoUrl) return;
      if (!currentLesson || !id) return;

      try {
        const res = await progressService.updateProgress({
          courseId: id,
          lessonId: currentLesson.id,
          lastWatchedSecond: videoRef.current
            ? Math.floor(videoRef.current.currentTime)
            : undefined,
          isVideoCompleted: isVideoDone,
        });

        if (res.courseProgress !== undefined) {
          setCurrentProgress(res.courseProgress);
        }

        if (isVideoDone) {
          const newVideoCompleted = new Set(videoCompletedLessons);
          newVideoCompleted.add(currentLesson.id);
          setVideoCompletedLessons(newVideoCompleted);
        }

        if (res.status === 'COMPLETED') {
          const newCompleted = new Set(completedLessons);
          newCompleted.add(currentLesson.id);
          setCompletedLessons(newCompleted);
        }
      } catch (error) {
        console.error('Failed to sync progress:', error);
      }
    },
    [id, currentLesson, videoRef, videoCompletedLessons, completedLessons]
  );

  // Handle Rich Text lessons - auto complete video part
  useEffect(() => {
    if (activeLesson && !activeLesson.videoUrl && !videoCompletedLessons.has(activeLesson.id)) {
      syncProgress(true);
    }
  }, [activeLesson, videoCompletedLessons, syncProgress]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || !currentLesson) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    // Sync every 15 seconds
    if (currentTime - lastSyncTimeRef.current > 10) {
      syncProgress();
      lastSyncTimeRef.current = currentTime;
    }

    const progress = currentTime / duration;
    if (progress > 0.95 && !videoCompletedLessons.has(currentLesson.id)) {
      setShowRatingBtn(true);
      syncProgress(true);
    }
  };

  const nextLesson = () => {
    if (currentLessonIdx < (course?.lessons?.length || 0) - 1) {
      setCurrentLessonIdx((prev) => prev + 1);
      setShowRatingBtn(false);
    }
  };

  const prevLesson = () => {
    if (currentLessonIdx > 0) {
      setCurrentLessonIdx((prev) => prev - 1);
      setShowRatingBtn(false);
    }
  };

  const progressPercentage = currentProgress;

  const hasRated = course?.reviews?.some((r: any) => r.userId === user?.id);
  const shouldShowRating = !hasRated && (showRatingBtn || completedLessons.size > 0);

  const handleGetCertificate = async () => {
    if (!id || isGeneratingCert) return;

    if (certificate) {
      window.open(certificate.pdfUrl, '_blank');
      return;
    }

    setIsGeneratingCert(true);
    try {
      const newCert = await certificateService.generateCertificate(id);
      setCertificate(newCert);
      toast.success('Certificate generated successfully!');
      window.open(newCert.pdfUrl, '_blank');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Failed to generate certificate. Ensure all quizzes are passed.'
      );
    } finally {
      setIsGeneratingCert(false);
    }
  };

  if (isLoading) return <FullscreenLoader />;
  if (!course) return null;

  return (
    <div
      className={`flex flex-col h-screen ${isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'} overflow-hidden transition-colors duration-300`}
    >
      {/* Top Bar */}
      <header
        className={`h-16 shrink-0 flex items-center justify-between px-6 border-b ${isDarkMode ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm'} z-20`}
      >
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <h1 className="font-bold truncate max-w-[200px] lg:max-w-md">{course.name}</h1>
        </div>

        <div className="flex items-center gap-6">
          {shouldShowRating && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="hidden md:flex px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold items-center gap-2 hover:bg-indigo-500/20 transition-all animate-in fade-in zoom-in duration-300"
            >
              <Star className="w-4 h-4" /> Rate Course
            </button>
          )}

          <div className="hidden md:flex items-center gap-3">
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {progressPercentage}% completed
            </span>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 lg:hidden hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <div className="max-w-5xl mx-auto p-6 lg:p-10">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative group mb-8">
              {isLessonLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-slate-400 font-medium animate-pulse">Loading content...</p>
                </div>
              ) : activeLesson?.videoUrl ? (
                <video
                  ref={videoRef}
                  key={activeLesson.id}
                  src={activeLesson.videoUrl ? getStreamingUrl(activeLesson.videoUrl) : undefined}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPause={() => syncProgress()}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-900">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-2">
                    <FileText className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="italic">This lesson contains reading material</p>
                </div>
              )}
            </div>

            {/* Lesson Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black">{currentLesson?.title}</h2>
                  {activeLesson?.exam && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          navigate(`/exam/${activeLesson.id}`, {
                            state: {
                              completedLessonIds: Array.from(completedLessons),
                            },
                          });
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${videoCompletedLessons.has(activeLesson.id) ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105' : 'bg-white/5 text-slate-500 cursor-not-allowed opacity-50'}`}
                        disabled={!videoCompletedLessons.has(activeLesson.id)}
                      >
                        <ExternalLink className="w-3 h-3" />{' '}
                        {currentLesson.highestScore !== null ? 'RETAKE QUIZ' : 'TAKE QUIZ'}
                      </button>
                      {currentLesson.highestScore !== null && (
                        <p
                          className={`text-[10px] font-bold text-center ${currentLesson.highestScore >= (activeLesson.exam?.passingScore || 50) ? 'text-green-500' : 'text-red-500'}`}
                        >
                          Highest Score: {currentLesson.highestScore}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  Updated on {new Date(course.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={prevLesson}
                  disabled={currentLessonIdx === 0}
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl disabled:opacity-30 hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextLesson}
                  disabled={currentLessonIdx === (course.lessons?.length || 0) - 1}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm disabled:opacity-30 hover:bg-white/10 flex items-center gap-2 transition-all"
                >
                  Next Lesson <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs / Description */}
            <div className="space-y-12">
              <div className="border-b border-white/10 flex gap-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-4 border-b-2 font-bold text-sm transition-all ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`pb-4 border-b-2 font-bold text-sm transition-all ${activeTab === 'resources' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Resources
                </button>
                <button
                  onClick={() => setActiveTab('qa')}
                  className={`pb-4 border-b-2 font-bold text-sm transition-all ${activeTab === 'qa' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Q&A
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="prose prose-invert max-w-full break-words overflow-hidden">
                  <h3 className="text-xl font-bold mb-4">{currentLesson?.title}</h3>
                  <div
                    className="text-slate-400 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{
                      __html:
                        activeLesson?.content ||
                        activeLesson?.textContent ||
                        'No detailed content for this lesson yet.',
                    }}
                  />
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" /> Attached Documents
                  </h3>
                  {activeLesson?.attachments?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeLesson.attachments.map((file: any) => (
                        <a
                          key={file.id}
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold truncate max-w-[150px]">
                                {file.name || 'Document'}
                              </p>
                              <p className="text-[10px] text-slate-500">PDF • Attachment</p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-center">
                      No documents available for this lesson.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'qa' && (
                <div className="text-center py-20">
                  <Info className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 italic text-sm">Community Q&A coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar - Playlist */}
        <aside
          className={`${isSidebarOpen ? 'w-80 lg:w-96' : 'w-0'} shrink-0 border-l ${isDarkMode ? 'border-white/10 bg-slate-900/30' : 'border-slate-200 bg-slate-50'} flex flex-col transition-all duration-300 overflow-hidden relative`}
        >
          <div className="p-6 border-b border-white/10 shrink-0">
            <h3 className="font-bold flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" /> Course Content
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {course.lessons?.map((lesson: any, index: number) => (
              <button
                key={lesson.id}
                onClick={() => {
                  setCurrentLessonIdx(index);
                  setShowRatingBtn(false);
                }}
                className={`w-full flex items-center gap-4 p-5 text-left border-b border-white/5 transition-all ${currentLessonIdx === index ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : 'hover:bg-white/5'}`}
              >
                <div className="shrink-0">
                  {completedLessons.has(lesson.id) ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full border-2 ${currentLessonIdx === index ? 'border-indigo-500 text-indigo-500' : 'border-slate-700 text-slate-700'} flex items-center justify-center text-[10px] font-bold`}
                    >
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold truncate ${currentLessonIdx === index ? 'text-indigo-400' : ''}`}
                  >
                    {lesson.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" />{' '}
                    {lesson.videoDuration ? Math.round(lesson.videoDuration / 60) : 5} min
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Certificate Button Area */}
          {progressPercentage === 100 && (
            <div className="p-6 border-t border-white/10 bg-black/20 shrink-0">
              <button
                onClick={() => {
                  if (certificate) handleGetCertificate();
                  else setShowCertConfirmModal(true);
                }}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all shadow-xl ${certificate ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20' : 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20'}`}
              >
                <Award className="w-5 h-5" />
                {certificate ? 'VIEW CERTIFICATE' : 'GET CERTIFICATE'}
              </button>
            </div>
          )}
        </aside>
      </div>

      {course && (
        <CourseReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          course={{
            id: course.id,
            name: course.name,
            thumbnailUrl: course.thumbnailUrl,
            instructorName: course.instructor?.name,
            totalStudents: course.totalStudents,
            averageRating: course.rating,
          }}
        />
      )}

      {/* Certificate Confirmation Modal */}
      {showCertConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowCertConfirmModal(false)}
          ></div>
          <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 mx-auto">
              <Award className="w-10 h-10 text-indigo-400" />
            </div>

            <div className="text-center mb-10">
              <h3 className="text-3xl font-black mb-4">Claim Your Reward!</h3>
              <p className="text-slate-400 leading-relaxed">
                Congratulations! You've successfully completed all requirements for{' '}
                <span className="text-white font-bold">{course?.name}</span>. Are you ready to
                generate your official certificate?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowCertConfirmModal(false)}
                className="py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
              >
                Not yet
              </button>
              <button
                onClick={async () => {
                  await handleGetCertificate();
                  setShowCertConfirmModal(false);
                }}
                disabled={isGeneratingCert}
                className="py-4 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isGeneratingCert ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Generate <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
