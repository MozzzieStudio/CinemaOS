/**
 * GoToDialog — Quick navigation to page/scene
 * 
 * Ctrl+G to open, jump to specific page or scene
 */

import { useState, useEffect, useRef } from 'react';

interface GoToDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  totalScenes: number;
  onGoToPage: (page: number) => void;
  onGoToScene: (scene: number) => void;
}

export default function GoToDialog({ 
  isOpen, 
  onClose, 
  totalPages, 
  totalScenes,
  onGoToPage,
  onGoToScene 
}: GoToDialogProps) {
  const [mode, setMode] = useState<'page' | 'scene'>('page');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Handle keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);
    
    if (isNaN(num) || num < 1) return;

    if (mode === 'page') {
      if (num <= totalPages) {
        onGoToPage(num);
        onClose();
      }
    } else {
      if (num <= totalScenes) {
        onGoToScene(num);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const max = mode === 'page' ? totalPages : totalScenes;
  const label = mode === 'page' ? 'Page' : 'Scene';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-80 bg-[#1a1a1a]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-violet-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6ZM7.5 6h.008v.008H7.5V6Zm2.25 0h.008v.008H9.75V6Z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Go To</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('page')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'page'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              📄 Page
            </button>
            <button
              type="button"
              onClick={() => setMode('scene')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'scene'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
              }`}
            >
              🎬 Scene
            </button>
          </div>

          {/* Input */}
          <div className="space-y-1">
            <label className="text-xs text-white/50">
              {label} number (1-{max})
            </label>
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={max}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${label.toLowerCase()} number...`}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              Go
            </button>
          </div>
        </form>

        {/* Keyboard hint */}
        <div className="px-4 py-2 border-t border-white/5 text-[10px] text-white/30 text-center">
          Press Enter to go • Esc to close
        </div>
      </div>
    </div>
  );
}
