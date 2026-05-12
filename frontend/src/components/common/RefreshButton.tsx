import React, { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  dataUpdatedAt?: number;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isRefreshing,
  dataUpdatedAt,
}) => {
  const [, setTick] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Update the time display every minute
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Cooldown timer
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRefresh = () => {
    if (cooldown > 0 || isRefreshing) return;
    onRefresh();
    setCooldown(5); // 5 seconds cooldown
  };

  const isDisabled = isRefreshing || cooldown > 0;

  return (
    <div className="flex items-center gap-3">
      {dataUpdatedAt && (
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          Last updated: {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={isDisabled}
        className={`p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group ${
          isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
        title="Refresh Data"
      >
        <RotateCw
          className={`w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-all ${
            isRefreshing ? 'animate-spin text-indigo-400' : ''
          }`}
        />
      </button>
    </div>
  );
};
