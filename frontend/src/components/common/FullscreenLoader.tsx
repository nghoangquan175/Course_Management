import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface FullscreenLoaderProps {
  label?: string;
}

export const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ label = "Loading..." }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md"
    >
      <div className="relative flex items-center justify-center">
        {/* Decorative Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
        />
        <Loader2 className="absolute w-8 h-8 text-indigo-400 animate-spin" />
      </div>
      
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-slate-400 font-medium tracking-widest uppercase text-[10px]"
      >
        {label}
      </motion.p>
    </motion.div>
  );
};
