/**
 * Focus Mode — Distraction-free writing
 * 
 * Based on Final Draft's Focus Mode: hides all UI except editor and format toolbar
 */

import { useEffect } from 'react';

interface FocusModeProps {
  isActive: boolean;
  onExit: () => void;
}

export default function FocusMode({ isActive, onExit }: FocusModeProps) {
  // F11 keyboard shortcut
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onExit]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      {/* Minimalist Exit Button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group"
        title="Exit Focus Mode (F11 or Esc)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="absolute -bottom-8 right-0 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          ESC to exit
        </span>
      </button>

      {/* Editor Content (passed as children) */}
      <div className="flex-1 overflow-hidden">
        {/* The actual editor will be rendered here by parent */}
      </div>
    </div>
  );
}
