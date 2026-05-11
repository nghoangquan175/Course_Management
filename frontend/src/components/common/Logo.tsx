import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  isLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  iconSize = 24,
  textSize = 'text-2xl',
  isLink = true,
}) => {
  const content = (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
        <BookOpen size={iconSize} className="text-white" />
      </div>
      <span
        className={`${textSize} font-black bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-tighter`}
      >
        COURSE EDU
      </span>
    </div>
  );

  if (!isLink) return content;

  return (
    <Link to="/" className="inline-block">
      {content}
    </Link>
  );
};
