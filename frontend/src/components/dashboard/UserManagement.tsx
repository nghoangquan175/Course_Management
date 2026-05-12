import React from 'react';
import { Mail, User, MoreVertical } from 'lucide-react';
import { RefreshButton } from '../common/RefreshButton';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActivated: boolean;
  createdAt: string;
}

interface UserManagementProps {
  users: UserData[];
  title: string;
  showAddButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  dataUpdatedAt?: number;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  title,
  showAddButton = true,
  onRefresh,
  isRefreshing = false,
  dataUpdatedAt,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {onRefresh && (
            <RefreshButton
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
              dataUpdatedAt={dataUpdatedAt}
            />
          )}
        </div>
        {showAddButton && (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all">
              Add New
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 glass rounded-3xl border border-white/5 overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Joined Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 relative">
              {isRefreshing
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5" />
                          <div className="space-y-2">
                            <div className="h-4 bg-white/5 rounded w-32" />
                            <div className="h-3 bg-white/5 rounded w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-white/5 rounded w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white/5" />
                          <div className="h-3 bg-white/5 rounded w-16" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-white/5 rounded w-24" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-8 bg-white/5 rounded-lg w-10 ml-auto" />
                      </td>
                    </tr>
                  ))
                : users.map((u) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-white/5 transition-colors group ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{u.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'ADMIN'
                              ? 'bg-red-500/10 text-red-500'
                              : u.role === 'INSTRUCTOR'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${u.isActivated ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-600'}`}
                          ></div>
                          <span className="text-xs">{u.isActivated ? 'Activated' : 'Pending'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-500 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
