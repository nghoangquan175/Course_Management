import React, { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, icon }) => {
  return (
    <div className="glass p-5 rounded-2xl border border-white/5 space-y-3">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-white/5 rounded-lg text-slate-400">{icon}</div>
        {trend && (
          <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-amber-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
};
