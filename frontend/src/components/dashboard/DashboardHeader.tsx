import React from 'react';
import { Search } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { DashboardSwitcher } from './DashboardSwitcher';

interface DashboardHeaderProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onSearch,
  placeholder = 'Search everything...',
}) => {
  return (
    <header className="flex items-center justify-between">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 outline-none focus:border-red-500/50 transition-all text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <DashboardSwitcher />
        <NotificationBell />
      </div>
    </header>
  );
};
