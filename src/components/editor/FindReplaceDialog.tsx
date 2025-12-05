/**
 * FindReplaceDialog — Find & Replace functionality for Script Editor
 * 
 * Premium glassmorphism design with keyboard shortcuts
 */

import { useState, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

interface FindReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FindReplaceDialog({ isOpen, onClose }: FindReplaceDialogProps) {
  const [editor] = useLexicalComposerContext();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  // Find matches in editor content
  const findMatches = useCallback(() => {
    if (!findText) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      
      const flags = caseSensitive ? 'g' : 'gi';
      const pattern = wholeWord ? `\\b${findText}\\b` : findText;
      
      try {
        const regex = new RegExp(pattern, flags);
        const matches = text.match(regex);
        setMatchCount(matches ? matches.length : 0);
        if (matches && matches.length > 0 && currentMatch === 0) {
          setCurrentMatch(1);
        }
      } catch {
        setMatchCount(0);
      }
    });
  }, [editor, findText, caseSensitive, wholeWord, currentMatch]);

  // Run find when text changes
  useEffect(() => {
    findMatches();
  }, [findMatches]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && e.shiftKey) {
        // Find previous
        setCurrentMatch(prev => prev > 1 ? prev - 1 : matchCount);
      } else if (e.key === 'Enter') {
        // Find next
        setCurrentMatch(prev => prev < matchCount ? prev + 1 : 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, matchCount]);

  const handleReplaceOne = useCallback(() => {
    if (!findText || matchCount === 0) return;

    editor.update(() => {
      const root = $getRoot();
      
      const flags = caseSensitive ? 'g' : 'gi';
      const pattern = wholeWord ? `\\b${findText}\\b` : findText;
      
      try {
        const regex = new RegExp(pattern, flags);
        let count = 0;
        const targetIndex = currentMatch - 1;
        
        // Find the specific occurrence to replace
        root.getAllTextNodes().forEach((node) => {
          const nodeText = node.getTextContent();
          const match = nodeText.match(regex);
          if (match) {
            match.forEach(() => {
              if (count === targetIndex) {
                const newText = nodeText.replace(regex, replaceText);
                node.setTextContent(newText);
              }
              count++;
            });
          }
        });

        setMatchCount(prev => prev - 1);
        if (currentMatch > matchCount - 1) {
          setCurrentMatch(Math.max(1, matchCount - 1));
        }
      } catch {
        // Invalid regex
      }
    });
  }, [editor, findText, replaceText, caseSensitive, wholeWord, matchCount, currentMatch]);

  const handleReplaceAll = useCallback(() => {
    if (!findText || matchCount === 0) return;

    editor.update(() => {
      const root = $getRoot();
      const flags = caseSensitive ? 'g' : 'gi';
      const pattern = wholeWord ? `\\b${findText}\\b` : findText;
      
      try {
        const regex = new RegExp(pattern, flags);
        
        root.getAllTextNodes().forEach((node) => {
          const nodeText = node.getTextContent();
          if (regex.test(nodeText)) {
            const newText = nodeText.replace(regex, replaceText);
            node.setTextContent(newText);
          }
        });

        setMatchCount(0);
        setCurrentMatch(0);
      } catch {
        // Invalid regex
      }
    });
  }, [editor, findText, replaceText, caseSensitive, wholeWord, matchCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-[480px] bg-[#1a1a1a]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-violet-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <h2 className="text-sm font-semibold text-white">Find & Replace</h2>
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
        <div className="p-4 space-y-4">
          {/* Find Input */}
          <div className="space-y-1">
            <label className="text-xs text-white/50 uppercase tracking-wide">Find</label>
            <div className="relative">
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Enter text to find..."
                autoFocus
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
              />
              {matchCount > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">
                  {currentMatch} of {matchCount}
                </span>
              )}
            </div>
          </div>

          {/* Replace Input */}
          <div className="space-y-1">
            <label className="text-xs text-white/50 uppercase tracking-wide">Replace with</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement text..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/20"
              />
              Match case
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/20"
              />
              Whole word
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMatch(prev => prev > 1 ? prev - 1 : matchCount)}
              disabled={matchCount === 0}
              className="px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentMatch(prev => prev < matchCount ? prev + 1 : 1)}
              disabled={matchCount === 0}
              className="px-3 py-1.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplaceOne}
              disabled={matchCount === 0}
              className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={matchCount === 0}
              className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
