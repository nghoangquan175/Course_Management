import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Eye,
  Search,
  User,
  Mail,
  Phone,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInstructorApplications } from '../../hooks/useInstructorApplications';
import { Modal } from '../common/Modal';
import { RefreshButton } from '../common/RefreshButton';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const InstructorApplicationManagement: React.FC = () => {
  const {
    applications,
    isLoading,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
    processApplication,
    isProcessing,
  } = useInstructorApplications();

  React.useEffect(() => {
    if (isError && !isLoading) {
      toast.error('Failed to refresh applications list. Showing cached data.');
    }
  }, [isError, isLoading]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'ALL'
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const filteredApps = applications.filter((app: any) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const appId = searchParams.get('appId');
  const selectedApp = appId ? applications.find((a: any) => a.id === appId) : null;

  const handleOpenDetail = (app: any) => {
    setSearchParams({ tab: 'applications', appId: app.id });
  };

  const handleBack = () => {
    setSearchParams({ tab: 'applications' });
  };

  const handleApprove = () => {
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (!selectedApp) return;
    processApplication(
      { id: selectedApp.id, status: 'APPROVED' },
      {
        onSuccess: () => {
          setIsApproveModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['instructor-applications'] });
          handleBack();
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedApp || !rejectionReason) return;
    processApplication(
      { id: selectedApp.id, status: 'REJECTED', rejectionReason },
      {
        onSuccess: () => {
          setIsRejectModalOpen(false);
          setRejectionReason('');
          queryClient.invalidateQueries({ queryKey: ['instructor-applications'] });
          handleBack();
        },
      }
    );
  };

  if (selectedApp) {
    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Application Details</h2>
              <p className="text-slate-500 text-sm">
                Reviewing application for {selectedApp.fullName}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {selectedApp.status === 'PENDING' && (
              <>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-green-600/20"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Applicant
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 glass border border-white/5 rounded-3xl p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Applicant Info Column */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                  Personal Information
                </h3>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">
                        Full Name
                      </p>
                      <p className="font-bold text-white text-lg">{selectedApp.fullName}</p>
                      <p className="text-xs text-slate-400">
                        {selectedApp.gender}, {selectedApp.age} years old
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">
                        Email Address
                      </p>
                      <p className="font-bold text-white">{selectedApp.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">
                        Phone Number
                      </p>
                      <p className="font-bold text-white">{selectedApp.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                  Bio & Experience
                </h3>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap italic">
                    "{selectedApp.bio}"
                  </p>
                </div>
              </div>
            </div>

            {/* CV Viewer Column */}
            <div className="lg:col-span-2 flex flex-col h-[700px] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Curriculum Vitae (CV)
                </h3>
                <a
                  href={selectedApp.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:underline font-bold flex items-center gap-1"
                >
                  Download CV <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex-1 bg-slate-950 rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl">
                <iframe
                  src={`https://docs.google.com/gview?url=${selectedApp.cvUrl}&embedded=true`}
                  className="w-full h-full border-none"
                  title="CV Viewer"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
        {/* Rejection Reason Modal */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Application"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || isProcessing}
                className="px-8 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-200 leading-relaxed font-medium">
                An email will be sent to the applicant explaining why their application was
                rejected. Please provide a constructive reason.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Insufficient teaching experience in the selected category..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-all resize-none"
              />
            </div>
          </div>
        </Modal>

        {/* Approval Confirmation Modal */}
        <Modal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          title="Approve Applicant"
          footer={
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={isProcessing}
                className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Confirm Approval
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 bg-green-500/5 border border-green-500/10 rounded-[2rem]">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold text-lg">Approve Instructor?</p>
                <p className="text-sm text-slate-400">
                  This will upgrade {selectedApp.fullName} to an instructor role.
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 uppercase font-black tracking-widest">
                  Applicant
                </span>
                <span className="text-white font-bold">{selectedApp.fullName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 uppercase font-black tracking-widest">Email</span>
                <span className="text-white font-medium">{selectedApp.email}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic text-center">
              An approval email will be automatically sent to the applicant.
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Instructor Applications
              {statusFilter !== 'ALL' && (
                <span className="ml-2 text-indigo-400 opacity-60">({statusFilter})</span>
              )}
            </h2>
          </div>
          <RefreshButton
            onRefresh={refetch}
            isRefreshing={isFetching}
            dataUpdatedAt={dataUpdatedAt}
          />
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 glass border border-white/5 rounded-3xl flex flex-col min-h-0 overflow-visible">
        <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md">
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Applicant
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Contact
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <div
                    className="flex items-center gap-2 relative cursor-pointer hover:text-white transition-colors group/status"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    <span className={statusFilter !== 'ALL' ? 'text-indigo-400' : ''}>Status</span>
                    <div
                      className={`p-1 rounded-md transition-all ${isFilterOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 group-hover/status:bg-white/5'}`}
                    >
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <AnimatePresence>
                      {isFilterOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsFilterOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-40 py-2 overflow-hidden"
                          >
                            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setStatusFilter(opt as any);
                                  setIsFilterOpen(false);
                                }}
                                className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 ${statusFilter === opt ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400'}`}
                              >
                                {opt === 'ALL' ? 'ALL STATUS' : opt}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Applied Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading || isFetching ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 bg-white/5 rounded w-32" />
                          <div className="h-3 bg-white/5 rounded w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-white/5 rounded w-40" />
                        <div className="h-3 bg-white/5 rounded w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-white/5 rounded-full w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-white/5 rounded w-24" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 bg-white/5 rounded-lg w-10 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredApps.length > 0 ? (
                filteredApps.map((app: any) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-white/2 transition-colors cursor-pointer group ${isFetching ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          {app.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover:text-indigo-400 transition-colors">
                            {app.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {app.gender}, {app.age} years
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" /> {app.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" /> {app.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          app.status === 'APPROVED'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : app.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                    {searchQuery ? 'No applications match your search.' : 'No applications found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
