import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
      <div className="px-4 py-3 rounded-card bg-charcoal text-white text-xs font-mono shadow-hover flex items-center gap-3 border border-charcoal/80">
        <span className="w-2 h-2 rounded-full bg-pastel-green-text"></span>
        <span>{message}</span>
      </div>
    </div>
  );
};
