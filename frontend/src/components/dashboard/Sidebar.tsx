import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  title: string;
  onLogout: () => void;
  userRoleLabel: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  activeItem, 
  onItemClick, 
  title, 
  onLogout,
  userRoleLabel
}) => {
  const { user } = useAuth();

  return (
    <aside className="w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col h-full p-6 gap-8">
      <div className="">
        <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-none">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeItem === item.id 
                ? 'bg-red-500/10 text-red-500' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-1 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-bold shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{userRoleLabel}</p>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};
