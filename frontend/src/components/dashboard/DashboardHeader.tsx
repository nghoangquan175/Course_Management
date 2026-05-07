import React from 'react';
import { Search, Home, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onSearch,
  placeholder = "Search everything..."
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
        <Link
          to="/"
          title="Back to Site"
          className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-white/5"
        >
          <Home className="w-5 h-5" />
        </Link>

        <button className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
        </button>
      </div>
    </header>
  );
};
