
import React from 'react';

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const PixelCard: React.FC<PixelCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border-4 border-black p-4 relative ${onClick ? 'cursor-pointer hover:bg-gray-100 active:translate-y-1' : ''} ${className}`}
      style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
    >
      <div className="absolute top-0 left-0 w-2 h-2 bg-black opacity-20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-black opacity-20" />
      {children}
    </div>
  );
};
