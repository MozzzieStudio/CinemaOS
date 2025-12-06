/**
 * ScriptCompareDialog — Compare two script versions side-by-side
 * 
 * Features:
 * - Side-by-side diff view
 * - Inline highlighting (green = added, red = removed)
 * - Navigate between changes
 * - Import from file or paste
 */

import { useState, useMemo, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed' | 'modified';
  leftText: string;
  rightText: string;
  leftLineNum?: number;
  rightLineNum?: number;
}

interface ScriptCompareDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScriptCompareDialog({ isOpen, onClose }: ScriptCompareDialogProps) {
  const [editor] = useLexicalComposerContext();
  const [compareText, setCompareText] = useState('');
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  // Get current script text
  const currentText = useMemo(() => {
    let text = '';
    editor.getEditorState().read(() => {
      const root = $getRoot();
      text = root.getTextContent();
    });
    return text;
  }, [editor]);

  // Compute diff
  const diff = useMemo(() => {
    if (!compareText) return [];
    return computeDiff(currentText, compareText);
  }, [currentText, compareText]);

  // Count changes
  const changeCount = useMemo(() => {
    return diff.filter(d => d.type !== 'unchanged').length;
  }, [diff]);

  // Navigate changes
  const navigateToChange = useCallback((direction: 'next' | 'prev') => {
    const changeIndices = diff
      .map((d, i) => d.type !== 'unchanged' ? i : -1)
      .filter(i => i !== -1);
    
    if (changeIndices.length === 0) return;

    let newIndex = currentChangeIndex;
    if (direction === 'next') {
      newIndex = (currentChangeIndex + 1) % changeIndices.length;
    } else {
      newIndex = currentChangeIndex <= 0 ? changeIndices.length - 1 : currentChangeIndex - 1;
    }
    
    setCurrentChangeIndex(newIndex);
    
    // Scroll to change
    const element = document.getElementById(`diff-line-${changeIndices[newIndex]}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [diff, currentChangeIndex]);

  // Handle file import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCompareText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative w-full max-w-6xl h-[85vh] bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Compare Scripts</h2>
              <p className="text-xs text-white/50">
                {changeCount > 0 ? `${changeCount} differences found` : 'Paste or import a script to compare'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {changeCount > 0 && (
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => navigateToChange('prev')}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                  title="Previous change"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="px-2 text-xs text-white/50">
                  {currentChangeIndex + 1} / {changeCount}
                </span>
                <button
                  onClick={() => navigateToChange('next')}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                  title="Next change"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Current Script */}
          <div className="flex-1 flex flex-col border-r border-white/10">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
              <span className="text-sm font-medium text-white/70">Current Version</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
              {diff.length > 0 ? (
                diff.map((line, index) => (
                  <DiffLineLeft key={index} line={line} index={index} />
                ))
              ) : (
                <pre className="text-white/60 whitespace-pre-wrap">{currentText}</pre>
              )}
            </div>
          </div>

          {/* Right Panel - Compare Script */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
              <span className="text-sm font-medium text-white/70">Compare With</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {compareText ? (
                <div className="p-4 font-mono text-sm">
                  {diff.map((line, index) => (
                    <DiffLineRight key={index} line={line} index={index} />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="text-center space-y-4 max-w-md">
                    <span className="text-5xl block mb-4">📄</span>
                    <h3 className="text-lg font-medium text-white">Add a script to compare</h3>
                    <p className="text-sm text-white/50">
                      Paste script text below or import from a file
                    </p>

                    {/* Paste area */}
                    <textarea
                      value={compareText}
                      onChange={(e) => setCompareText(e.target.value)}
                      placeholder="Paste script content here..."
                      className="w-full h-40 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-violet-500 resize-none font-mono"
                    />

                    {/* Or divider */}
                    <div className="flex items-center gap-4 text-white/30">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs">OR</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* File import */}
                    <input
                      type="file"
                      accept=".txt,.fdx,.fountain"
                      onChange={handleFileImport}
                      className="hidden"
                      id="compare-file-input"
                    />
                    <label
                      htmlFor="compare-file-input"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import File
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 px-6 py-3 border-t border-white/10 bg-white/2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
            <span className="text-white/50">Removed</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
            <span className="text-white/50">Added</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
            <span className="text-white/50">Modified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Diff line components
function DiffLineLeft({ line, index }: { line: DiffLine; index: number }) {
  const bgClass = {
    unchanged: '',
    removed: 'bg-red-500/10 border-l-2 border-red-500',
    added: 'bg-white/2 text-white/20',
    modified: 'bg-amber-500/10 border-l-2 border-amber-500',
  }[line.type];

  return (
    <div 
      id={`diff-line-${index}`}
      className={`flex gap-3 px-2 py-0.5 ${bgClass}`}
    >
      <span className="text-white/20 text-right w-8 shrink-0 select-none">
        {line.leftLineNum}
      </span>
      <span className={line.type === 'removed' ? 'text-red-300' : line.type === 'modified' ? 'text-amber-300' : 'text-white/70'}>
        {line.leftText}
      </span>
    </div>
  );
}

function DiffLineRight({ line, index: _index }: { line: DiffLine; index: number }) {
  const bgClass = {
    unchanged: '',
    added: 'bg-emerald-500/10 border-l-2 border-emerald-500',
    removed: 'bg-white/2 text-white/20',
    modified: 'bg-amber-500/10 border-l-2 border-amber-500',
  }[line.type];

  return (
    <div className={`flex gap-3 px-2 py-0.5 ${bgClass}`}>
      <span className="text-white/20 text-right w-8 shrink-0 select-none">
        {line.rightLineNum}
      </span>
      <span className={line.type === 'added' ? 'text-emerald-300' : line.type === 'modified' ? 'text-amber-300' : 'text-white/70'}>
        {line.rightText}
      </span>
    </div>
  );
}

/**
 * Simple line-by-line diff algorithm
 */
function computeDiff(leftText: string, rightText: string): DiffLine[] {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const lcs = computeLCS(leftLines, rightLines);
  
  let leftIndex = 0;
  let rightIndex = 0;
  let leftLineNum = 1;
  let rightLineNum = 1;

  for (const [leftMatch, rightMatch] of lcs) {
    // Lines removed from left
    while (leftIndex < leftMatch) {
      result.push({
        type: 'removed',
        leftText: leftLines[leftIndex],
        rightText: '',
        leftLineNum: leftLineNum++,
      });
      leftIndex++;
    }

    // Lines added to right
    while (rightIndex < rightMatch) {
      result.push({
        type: 'added',
        leftText: '',
        rightText: rightLines[rightIndex],
        rightLineNum: rightLineNum++,
      });
      rightIndex++;
    }

    // Matching line
    if (leftIndex < leftLines.length && rightIndex < rightLines.length) {
      result.push({
        type: 'unchanged',
        leftText: leftLines[leftIndex],
        rightText: rightLines[rightIndex],
        leftLineNum: leftLineNum++,
        rightLineNum: rightLineNum++,
      });
      leftIndex++;
      rightIndex++;
    }
  }

  // Remaining lines
  while (leftIndex < leftLines.length) {
    result.push({
      type: 'removed',
      leftText: leftLines[leftIndex],
      rightText: '',
      leftLineNum: leftLineNum++,
    });
    leftIndex++;
  }

  while (rightIndex < rightLines.length) {
    result.push({
      type: 'added',
      leftText: '',
      rightText: rightLines[rightIndex],
      rightLineNum: rightLineNum++,
    });
    rightIndex++;
  }

  return result;
}

/**
 * Compute Longest Common Subsequence for diff
 */
function computeLCS(left: string[], right: string[]): [number, number][] {
  const m = left.length;
  const n = right.length;
  
  // Build LCS table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matching pairs
  const matches: [number, number][] = [];
  let i = m, j = n;
  
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      matches.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return matches;
}

/**
 * Hook for script comparison
 */
export function useScriptCompare() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
