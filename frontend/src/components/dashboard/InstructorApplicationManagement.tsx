import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Eye, 
  Search,
  User,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { useInstructorApplications } from '../../hooks/useInstructorApplications';
import { Modal } from '../common/Modal';

export const InstructorApplicationManagement: React.FC = () => {
  const { applications, isLoading, processApplication, isProcessing } = useInstructorApplications();
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingApps = applications.filter((app: any) => app.status === 'PENDING');
  
  const filteredApps = pendingApps.filter((app: any) => 
    app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDetail = (app: any) => {
    setSelectedApp(app);
    setIsDetailModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedApp) return;
    processApplication({ id: selectedApp.id, status: 'APPROVED' });
    setIsDetailModalOpen(false);
  };

  const handleReject = () => {
    if (!selectedApp || !rejectionReason) return;
    processApplication({ id: selectedApp.id, status: 'REJECTED', rejectionReason });
    setIsRejectModalOpen(false);
    setIsDetailModalOpen(false);
    setRejectionReason('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Instructor Applications</h2>
          <p className="text-slate-500 text-sm">Review and process new instructor registrations</p>
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

      <div className="flex-1 glass border border-white/5 rounded-3xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Applicant</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Applied Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredApps.length > 0 ? (
                filteredApps.map((app: any) => (
                  <tr key={app.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-bold">
                          {app.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{app.fullName}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{app.gender}, {app.age} years</p>
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
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenDetail(app)}
                        className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">
                    {searchQuery ? 'No applications match your search.' : 'No pending applications at the moment.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Application Details"
        maxWidth="max-w-6xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-3">
              <button
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
              >
                <XCircle className="w-4 h-4" /> Reject Application
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-green-500/20"
              >
                <CheckCircle className="w-4 h-4" /> Approve Applicant
              </button>
            </div>
            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-bold text-sm"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedApp && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Applicant Info Column */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Personal Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Full Name</p>
                      <p className="font-bold text-white">{selectedApp.fullName}</p>
                      <p className="text-xs text-slate-400">{selectedApp.gender}, {selectedApp.age} years old</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Email Address</p>
                      <p className="font-bold text-white">{selectedApp.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Phone Number</p>
                      <p className="font-bold text-white">{selectedApp.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Bio & Experience</h3>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedApp.bio}
                  </p>
                </div>
              </div>
            </div>

            {/* CV Viewer Column */}
            <div className="lg:col-span-2 flex flex-col h-[600px] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Curriculum Vitae (CV)</h3>
                <a 
                  href={selectedApp.cvUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Open in new tab <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="flex-1 bg-slate-950 rounded-2xl border border-white/10 overflow-hidden relative group">
                <iframe
                  src={`https://docs.google.com/gview?url=${selectedApp.cvUrl}&embedded=true`}
                  className="w-full h-full border-none"
                  title="CV Viewer"
                ></iframe>
                
                {/* Fallback overlay if iframe fails or file is not PDF */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity">
                  <FileText className="w-12 h-12 text-white opacity-20" />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Application"
        footer={
          <>
            <button 
              onClick={() => setIsRejectModalOpen(false)} 
              className="px-6 py-2 text-sm text-slate-400"
            >
              Cancel
            </button>
            <button 
              onClick={handleReject}
              disabled={!rejectionReason || isProcessing}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-2"
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-200 leading-relaxed">
              An email will be sent to the applicant explaining why their application was rejected. Please be constructive.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Reason for Rejection *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Insufficient teaching experience, invalid documents..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
