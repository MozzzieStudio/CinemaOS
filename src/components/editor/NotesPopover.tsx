/**
 * NotesPopover — Floating note editor for ScriptNotes
 * 
 * Dialog-based modal for adding notes (no anchor needed)
 */

import { useState, useEffect } from 'react';
import { addNote, type ScriptNote } from './plugins/ScriptNotesPlugin';

interface NotesPopoverProps {
  elementKey: string | null;
  onClose: () => void;
}

const NOTE_COLORS = [
  { id: 'yellow' as const, name: 'Yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
  { id: 'blue' as const, name: 'Blue', bg: 'bg-blue-500/20', text: 'text-blue-500' },
  { id: 'green' as const, name: 'Green', bg: 'bg-green-500/20', text: 'text-green-500' },
  { id: 'pink' as const, name: 'Pink', bg: 'bg-pink-500/20', text: 'text-pink-500' },
  { id: 'orange' as const, name: 'Orange', bg: 'bg-orange-500/20', text: 'text-orange-500' },
];

const EMOJIS = ['📝', '💡', '⚠️', '✅', '❌', '🎬', '🎭', '💬', '🔥', '⭐'];

export default function NotesPopover({ elementKey, onClose }: NotesPopoverProps) {
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<ScriptNote['color']>('yellow');
  const [selectedEmoji, setSelectedEmoji] = useState<string | undefined>(undefined);

  // Handle Escape key to close
  useEffect(() => {
    if (!elementKey) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elementKey, onClose]);

  const handleSave = () => {
    if (!elementKey || !content.trim()) return;
    
    addNote({
      elementKey,
      content: content.trim(),
      color: selectedColor,
      emoji: selectedEmoji,
      author: 'You',
    });

    setContent('');
    setSelectedEmoji(undefined);
    onClose();
  };

  if (!elementKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-5 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h3 className="text-base font-semibold text-white">Add ScriptNote</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-white/40 mb-3">Press Ctrl+N to add a note to the current line</p>

        {/* Note Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your note here..."
          className="w-full h-28 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 resize-none mb-4"
          autoFocus
        />

        {/* Color Picker */}
        <div className="mb-4">
          <label className="text-xs text-white/50 mb-2 block">Note Color</label>
          <div className="flex gap-2">
            {NOTE_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                className={`w-9 h-9 rounded-lg ${color.bg} ${
                  selectedColor === color.id ? 'ring-2 ring-offset-2 ring-offset-[#1e1e1e] ring-white/40 scale-110' : ''
                } transition-all hover:scale-105`}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Emoji Picker */}
        <div className="mb-5">
          <label className="text-xs text-white/50 mb-2 block">Emoji (Optional)</label>
          <div className="flex gap-1.5 flex-wrap">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(selectedEmoji === emoji ? undefined : emoji)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg ${
                  selectedEmoji === emoji ? 'bg-violet-500/30 ring-1 ring-violet-500/50' : 'bg-white/5 hover:bg-white/10'
                } transition-all text-lg`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex-1 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save Note
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

