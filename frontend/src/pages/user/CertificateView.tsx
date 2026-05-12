import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Download,
  Share2,
  ChevronLeft,
  Award,
  ExternalLink,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { certificateService } from '../../api/certificateService';
import { FullscreenLoader } from '../../components/common/FullscreenLoader';
import { toast } from 'react-hot-toast';
import { Logo } from '../../components/common/Logo';

export const CertificateView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!courseId) return;
      try {
        const data = await certificateService.getCertificate(courseId);
        setCertificate(data);
      } catch (error: any) {
        console.error('Error fetching certificate:', error);
        toast.error('Could not find your certificate.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [courseId]);

  const handleDownload = () => {
    if (!certificate?.pdfUrl) return;
    const link = document.createElement('a');
    link.href = certificate.pdfUrl;
    link.download = `Certificate_${certificate.certificateCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `My Certificate for ${certificate.courseTitleSnap}`,
          text: `I just completed the course ${certificate.courseTitleSnap}!`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) return <FullscreenLoader />;

  if (!certificate) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Award className="w-20 h-20 text-slate-800 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Certificate Not Found</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">
          We couldn't find the certificate you're looking for. Make sure you've completed all
          lessons and requirements.
        </p>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <Link to="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-300">Certificate</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
              title="Share Certificate"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Certificate Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-4 space-y-8"
            >
              <div className="relative group">
                <div className="relative p-8 bg-slate-900 border border-white/10 rounded-3xl space-y-6">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <Award className="w-8 h-8 text-indigo-500" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
                      Course Completed!
                    </h2>
                    <p className="text-slate-400">
                      Congratulations on achieving this milestone. Your hard work has paid off and
                      is now officially recognized.
                    </p>
                  </div>

                  <div className="space-y-4 py-6 border-y border-white/5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                          Course
                        </p>
                        <p className="text-slate-200 font-medium">{certificate.courseTitleSnap}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                          Recipient
                        </p>
                        <p className="text-slate-200 font-medium">{certificate.studentNameSnap}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                          Certificate ID
                        </p>
                        <p className="text-slate-400 font-mono text-sm">
                          {certificate.certificateCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/learning/${courseId}`)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back to Course
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Certificate Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-8"
            >
              <div className="relative group">
                {/* Glowing effect background */}
                <div className="absolute -inset-4 bg-indigo-500/15 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="relative bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Toolbar for Iframe */}
                  <div className="bg-slate-800/50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] hidden sm:block">
                        Verified PDF Document
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => window.open(certificate.pdfUrl, '_blank')}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Original
                      </button>
                    </div>
                  </div>

                  {/* Certificate Frame */}
                  <div className="aspect-[1.414/1] bg-white relative">
                    <iframe
                      src={`${certificate.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-none"
                      title="Certificate Preview"
                    />

                    {/* Shadow overlay to give depth */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.05)]"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Verification Footer - Centered below both columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12 text-center space-y-3"
          >
            <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
              <Award className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-medium tracking-wide">
                This certificate is digitally signed and verified by Course Edu.
              </p>
            </div>
            <div className="inline-block px-4 py-1.5 bg-slate-900 border border-white/5 rounded-full">
              <p className="text-slate-600 text-[10px] uppercase tracking-[0.25em] font-black">
                Official Record ID:{' '}
                <span className="text-slate-400 font-mono select-all ml-1">{certificate.id}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
