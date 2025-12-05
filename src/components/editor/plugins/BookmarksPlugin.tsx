/**
 * BookmarksPlugin — Save positions in the script
 * 
 * Ctrl+Shift+B to toggle, manage via panel
 */

import { useState, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, createCommand, COMMAND_PRIORITY_LOW } from 'lexical';

export interface Bookmark {
  id: string;
  name: string;
  nodeKey: string;
  offset: number;
  lineNumber: number;
  preview: string;
  createdAt: Date;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
}

export const TOGGLE_BOOKMARK_COMMAND = createCommand<void>('TOGGLE_BOOKMARK');

interface BookmarksPluginProps {
  bookmarks: Bookmark[];
  onBookmarksChange: (bookmarks: Bookmark[]) => void;
  onNavigateToBookmark: (bookmark: Bookmark) => void;
}

export default function BookmarksPlugin({ 
  bookmarks, 
  onBookmarksChange, 
  onNavigateToBookmark: _onNavigateToBookmark 
}: BookmarksPluginProps) {


  const [editor] = useLexicalComposerContext();

  // Register toggle bookmark command
  useEffect(() => {
    return editor.registerCommand(
      TOGGLE_BOOKMARK_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const node = selection.anchor.getNode();
          const topLevelElement = node.getTopLevelElement();
          
          if (!topLevelElement) return;

          const nodeKey = topLevelElement.getKey();
          const offset = selection.anchor.offset;
          const text = topLevelElement.getTextContent();
          const preview = text.slice(0, 50) + (text.length > 50 ? '...' : '');

          // Check if bookmark exists at this location
          const existingIndex = bookmarks.findIndex(b => b.nodeKey === nodeKey);

          if (existingIndex >= 0) {
            // Remove bookmark
            const updated = [...bookmarks];
            updated.splice(existingIndex, 1);
            onBookmarksChange(updated);
          } else {
            // Add bookmark
            const newBookmark: Bookmark = {
              id: `bookmark-${Date.now()}`,
              name: `Bookmark ${bookmarks.length + 1}`,
              nodeKey,
              offset,
              lineNumber: calculateLineNumber(nodeKey),
              preview,
              createdAt: new Date(),
              color: 'blue',
            };
            onBookmarksChange([...bookmarks, newBookmark]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, bookmarks, onBookmarksChange]);

  // Register Ctrl+Shift+B shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') {
        e.preventDefault();
        editor.dispatchCommand(TOGGLE_BOOKMARK_COMMAND, undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  return null; // Rendering handled by BookmarksPanel
}

// Helper function - would need actual implementation
function calculateLineNumber(_nodeKey: string): number {
  // In a real implementation, this would calculate the line number
  // based on the node's position in the document
  return 1;
}

// Bookmarks Panel Component
interface BookmarksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onBookmarksChange: (bookmarks: Bookmark[]) => void;
  onNavigateToBookmark: (bookmark: Bookmark) => void;
}

export function BookmarksPanel({
  isOpen,
  onClose,
  bookmarks,
  onBookmarksChange,
  onNavigateToBookmark,
}: BookmarksPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleRename = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditName(bookmark.name);
  };

  const saveRename = () => {
    if (!editingId) return;
    
    const updated = bookmarks.map(b => 
      b.id === editingId ? { ...b, name: editName } : b
    );
    onBookmarksChange(updated);
    setEditingId(null);
  };

  const handleDelete = (bookmarkId: string) => {
    const updated = bookmarks.filter(b => b.id !== bookmarkId);
    onBookmarksChange(updated);
  };

  const handleColorChange = (bookmarkId: string, color: Bookmark['color']) => {
    const updated = bookmarks.map(b =>
      b.id === bookmarkId ? { ...b, color } : b
    );
    onBookmarksChange(updated);
  };

  if (!isOpen) return null;

  const COLORS: Bookmark['color'][] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  const COLOR_CLASSES: Record<Bookmark['color'], string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="fixed right-4 top-20 z-50 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔖</span>
          <h3 className="text-sm font-semibold text-white">Bookmarks</h3>
          <span className="text-xs text-white/40">({bookmarks.length})</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="p-6 text-center text-white/40 text-sm">
            <div className="text-2xl mb-2">📑</div>
            <p>No bookmarks yet</p>
            <p className="text-xs mt-1">Press Ctrl+Shift+B to add one</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {bookmarks.map(bookmark => (
              <div 
                key={bookmark.id}
                className="group p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {/* Color indicator */}
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${COLOR_CLASSES[bookmark.color]} mt-1`} />
                    {/* Color picker on hover */}
                    <div className="absolute left-0 top-4 hidden group-hover:flex flex-col gap-1 bg-[#141414] p-1 rounded-lg border border-white/10 z-10">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(bookmark.id, color)}
                          className={`w-4 h-4 rounded-full ${COLOR_CLASSES[color]} hover:scale-110 transition-transform`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === bookmark.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={saveRename}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                        autoFocus
                        className="w-full px-2 py-0.5 bg-white/10 border border-white/20 rounded text-sm text-white outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => onNavigateToBookmark(bookmark)}
                        className="text-left w-full"
                      >
                        <div className="text-sm text-white font-medium truncate">
                          {bookmark.name}
                        </div>
                        <div className="text-xs text-white/40 truncate font-mono">
                          {bookmark.preview}
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRename(bookmark)}
                      className="p-1 text-white/40 hover:text-white"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(bookmark.id)}
                      className="p-1 text-white/40 hover:text-red-400"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/5 text-[10px] text-white/30 text-center">
        Ctrl+Shift+B to toggle bookmark
      </div>
    </div>
  );
}

// Hook for bookmark management
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('cinemaos-bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('cinemaos-bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  }, [bookmarks]);

  return { bookmarks, setBookmarks };
}
