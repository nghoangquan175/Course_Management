import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileEdit, CheckCircle, XCircle, User, BookOpen, Clock, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';
import { Modal } from '../common/Modal';
import { toast } from 'react-hot-toast';

interface EditRequest {
  id: string;
  courseId: string;
  instructorId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  createdAt: string;
  course: {
    id: string;
    name: string;
    version: number;
    thumbnailUrl: string;
  };
  instructor: {
    id: string;
    name: string;
    email: string;
  };
}

export const AdminEditRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [isHandleModalOpen, setIsHandleModalOpen] = useState(false);
  const [handleAction, setHandleAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-edit-requests'],
    queryFn: async () => {
      const { data } = await api.get('/admin/edit-requests');
      return data;
    },
  });

  const handleMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      adminNote,
    }: {
      requestId: string;
      status: string;
      adminNote: string;
    }) => {
      const { data } = await api.put(`/admin/edit-requests/${requestId}/handle`, {
        status,
        adminNote,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Request handled successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-edit-requests'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsHandleModalOpen(false);
      setSelectedRequest(null);
      setAdminNote('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to handle request');
    },
  });

  const onConfirmHandle = () => {
    if (!selectedRequest || !handleAction) return;

    handleMutation.mutate({
      requestId: selectedRequest.id,
      status: handleAction === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      adminNote,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Course Edit Requests</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-500">{requests.length} Pending</span>
        </div>
      </div>

      <div className="flex-1 glass rounded-3xl border border-white/5 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length > 0 ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Instructor
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Course
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((request: EditRequest) => (
                  <tr key={request.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{request.instructor.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {request.instructor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 rounded bg-white/5 overflow-hidden flex-shrink-0">
                          {request.course.thumbnailUrl ? (
                            <img
                              src={request.course.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-3 h-3 text-slate-700" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{request.course.name}</p>
                          <span className="text-[10px] text-indigo-400 font-bold">
                            v{request.course.version}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className="text-sm text-slate-300 max-w-xs truncate"
                        title={request.reason}
                      >
                        {request.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setHandleAction('APPROVE');
                            setIsHandleModalOpen(true);
                          }}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                          title="Approve & Clone"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setHandleAction('REJECT');
                            setIsHandleModalOpen(true);
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FileEdit className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold mb-2">No Pending Requests</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              When instructors request to edit published courses, they will appear here for your
              review.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isHandleModalOpen}
        onClose={() => setIsHandleModalOpen(false)}
        title={handleAction === 'APPROVE' ? 'Approve Edit Request' : 'Reject Edit Request'}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsHandleModalOpen(false)}
              className="px-6 py-2 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmHandle}
              disabled={handleMutation.isPending}
              className={`px-6 py-2 ${handleAction === 'APPROVE' ? 'bg-green-600' : 'bg-red-600'} text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50`}
            >
              {handleMutation.isPending ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl border ${handleAction === 'APPROVE' ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${handleAction === 'APPROVE' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
              >
                {handleAction === 'APPROVE' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">
                  {handleAction === 'APPROVE'
                    ? 'Approving this request will automatically clone the course to a new DRAFT version.'
                    : 'Are you sure you want to reject this request?'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Instructor: {selectedRequest?.instructor.name}
                </p>
                <p className="text-xs text-slate-400">
                  Course: {selectedRequest?.course.name} (v{selectedRequest?.course.version})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
              Admin Note (Optional)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                handleAction === 'APPROVE'
                  ? 'Provide instructions or feedback...'
                  : 'Reason for rejection...'
              }
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
