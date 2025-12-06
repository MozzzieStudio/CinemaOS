/**
 * BreakdownPlugin — Production breakdown tagging
 * 
 * Features:
 * - Tag text with production categories (Cast, Props, VFX, etc.)
 * - Colored underlines in editor
 * - Right-click context menu for tagging
 * - Export breakdown report
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  createCommand,
  LexicalCommand,
  COMMAND_PRIORITY_LOW,
} from 'lexical';

// Commands
export const TAG_SELECTION_COMMAND: LexicalCommand<string> = createCommand('TAG_SELECTION');
export const CLEAR_TAG_COMMAND: LexicalCommand<void> = createCommand('CLEAR_TAG');
export const OPEN_BREAKDOWN_REPORT_COMMAND: LexicalCommand<void> = createCommand('OPEN_BREAKDOWN_REPORT');

// Standard breakdown categories (following industry standards)
export const BREAKDOWN_CATEGORIES = [
  { id: 'cast', color: '#e74c3c', label: 'Cast', icon: '👤' },
  { id: 'stunt', color: '#f39c12', label: 'Stunts', icon: '🤸' },
  { id: 'extra', color: '#9b59b6', label: 'Extras', icon: '👥' },
  { id: 'sfx', color: '#2ecc71', label: 'SFX', icon: '💥' },
  { id: 'vfx', color: '#3498db', label: 'VFX', icon: '✨' },
  { id: 'prop', color: '#1abc9c', label: 'Props', icon: '🔧' },
  { id: 'vehicle', color: '#e67e22', label: 'Vehicles', icon: '🚗' },
  { id: 'wardrobe', color: '#fd79a8', label: 'Wardrobe', icon: '👔' },
  { id: 'makeup', color: '#a29bfe', label: 'Makeup', icon: '💄' },
  { id: 'animal', color: '#00b894', label: 'Animals', icon: '🐕' },
  { id: 'music', color: '#6c5ce7', label: 'Music', icon: '🎵' },
  { id: 'sound', color: '#00cec9', label: 'Sound', icon: '🔊' },
] as const;

export type BreakdownCategory = typeof BREAKDOWN_CATEGORIES[number]['id'];

export interface BreakdownTag {
  id: string;
  category: BreakdownCategory;
  text: string;
  sceneHeading?: string;
  nodeKey: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
}

interface BreakdownPluginProps {
  onTagsChange?: (tags: BreakdownTag[]) => void;
}

export default function BreakdownPlugin({ onTagsChange }: BreakdownPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [tags, setTags] = useState<BreakdownTag[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showReport, setShowReport] = useState(false);

  // Get current scene heading for context
  const getCurrentSceneHeading = useCallback((): string | undefined => {
    let sceneHeading: string | undefined;
    
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();
      const root = $getRoot();
      const children = root.getChildren();
      
      // Find the scene heading before current node
      for (const child of children) {
        const type = (child as any).__type || child.getType();
        if (type === 'scene-heading') {
          sceneHeading = child.getTextContent();
        }
        if (child.getKey() === anchorNode.getKey() || 
            child.getKey() === anchorNode.getTopLevelElement()?.getKey()) {
          break;
        }
      }
    });

    return sceneHeading;
  }, [editor]);

  // Handle context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) return;

        const text = selection.getTextContent().trim();
        if (!text) return;

        e.preventDefault();
        setSelectedText(text);
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
      });
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [editor]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  // Tag selection with category
  const tagSelection = useCallback((category: BreakdownCategory) => {
    const sceneHeading = getCurrentSceneHeading();
    
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();
      
      const newTag: BreakdownTag = {
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category,
        text: selectedText,
        sceneHeading,
        nodeKey: anchorNode.getKey(),
        startOffset: selection.anchor.offset,
        endOffset: selection.focus.offset,
        createdAt: new Date().toISOString(),
      };

      setTags(prev => {
        const updated = [...prev, newTag];
        onTagsChange?.(updated);
        return updated;
      });
    });

    setShowContextMenu(false);
  }, [editor, selectedText, getCurrentSceneHeading, onTagsChange]);

  // Apply visual styles for tags
  useEffect(() => {
    const styleId = 'breakdown-tag-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // Generate CSS for each category
    const categoryStyles = BREAKDOWN_CATEGORIES.map(cat => `
      .breakdown-tag-${cat.id} {
        background: ${cat.color}15;
        border-bottom: 2px solid ${cat.color};
        padding: 0 2px;
        border-radius: 2px;
        cursor: pointer;
      }
      .breakdown-tag-${cat.id}:hover {
        background: ${cat.color}30;
      }
    `).join('\n');

    styleEl.textContent = categoryStyles;

    return () => {
      if (styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);

  // Register commands
  useEffect(() => {
    const commands = [
      editor.registerCommand(
        TAG_SELECTION_COMMAND,
        (category: string) => {
          tagSelection(category as BreakdownCategory);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        OPEN_BREAKDOWN_REPORT_COMMAND,
        () => {
          setShowReport(true);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
    ];

    return () => commands.forEach(unregister => unregister());
  }, [editor, tagSelection]);

  return (
    <>
      {/* Context Menu */}
      {showContextMenu && (
        <BreakdownContextMenu
          position={menuPosition}
          onSelect={tagSelection}
          selectedText={selectedText}
        />
      )}

      {/* Breakdown Report */}
      {showReport && (
        <BreakdownReport
          tags={tags}
          onClose={() => setShowReport(false)}
          onRemoveTag={(tagId) => {
            setTags(prev => {
              const updated = prev.filter(t => t.id !== tagId);
              onTagsChange?.(updated);
              return updated;
            });
          }}
        />
      )}
    </>
  );
}

/**
 * Context Menu for tagging
 */
interface BreakdownContextMenuProps {
  position: { x: number; y: number };
  onSelect: (category: BreakdownCategory) => void;
  selectedText: string;
}

function BreakdownContextMenu({ position, onSelect, selectedText }: BreakdownContextMenuProps) {
  return (
    <div
      className="fixed z-100 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 border-b border-white/10 bg-white/5">
        <div className="text-xs text-white/50">Tag as:</div>
        <div className="text-sm text-white truncate max-w-[200px]">"{selectedText}"</div>
      </div>
      <div className="p-1 max-h-[300px] overflow-y-auto">
        {BREAKDOWN_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 rounded transition-colors"
          >
            <span>{cat.icon}</span>
            <span style={{ color: cat.color }}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Breakdown Report Dialog
 */
interface BreakdownReportProps {
  tags: BreakdownTag[];
  onClose: () => void;
  onRemoveTag: (tagId: string) => void;
}

function BreakdownReport({ tags, onClose, onRemoveTag }: BreakdownReportProps) {
  const [groupBy, setGroupBy] = useState<'category' | 'scene'>('category');
  const [filter, setFilter] = useState<BreakdownCategory | 'all'>('all');

  // Group tags
  const groupedTags = tags.reduce((acc, tag) => {
    const key = groupBy === 'category' ? tag.category : (tag.sceneHeading || 'Unknown Scene');
    if (!acc[key]) acc[key] = [];
    acc[key].push(tag);
    return acc;
  }, {} as Record<string, BreakdownTag[]>);

  // Filter
  const filteredGroups = filter === 'all' 
    ? groupedTags 
    : Object.fromEntries(
        Object.entries(groupedTags).filter(([key]) => 
          groupBy === 'category' ? key === filter : true
        )
      );

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Category', 'Item', 'Scene', 'Created'];
    const rows = tags.map(t => [
      BREAKDOWN_CATEGORIES.find(c => c.id === t.category)?.label || t.category,
      `"${t.text}"`,
      `"${t.sceneHeading || ''}"`,
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breakdown_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Breakdown Report</h2>
              <p className="text-xs text-white/50">{tags.length} items tagged</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
            >
              Export CSV
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-white/10 bg-white/2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'category' | 'scene')}
              className="px-2 py-1 bg-white/5 border border-white/10 rounded text-sm outline-none"
            >
              <option value="category">Category</option>
              <option value="scene">Scene</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as BreakdownCategory | 'all')}
              className="px-2 py-1 bg-white/5 border border-white/10 rounded text-sm outline-none"
            >
              <option value="all">All Categories</option>
              {BREAKDOWN_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.keys(filteredGroups).length === 0 ? (
            <div className="text-center text-white/40 py-12">
              <span className="text-4xl mb-4 block">📝</span>
              <p>No breakdown tags yet</p>
              <p className="text-xs mt-2">Select text in your script and right-click to tag</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredGroups).map(([group, groupTags]) => {
                const catInfo = BREAKDOWN_CATEGORIES.find(c => c.id === group);
                
                return (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-3">
                      {catInfo && (
                        <>
                          <span>{catInfo.icon}</span>
                          <h3 className="text-sm font-semibold" style={{ color: catInfo.color }}>
                            {catInfo.label}
                          </h3>
                        </>
                      )}
                      {!catInfo && (
                        <h3 className="text-sm font-semibold text-white">{group}</h3>
                      )}
                      <span className="text-xs text-white/40">({groupTags.length})</span>
                    </div>
                    <div className="space-y-2">
                      {groupTags.map(tag => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">{tag.text}</div>
                            {tag.sceneHeading && groupBy !== 'scene' && (
                              <div className="text-xs text-white/40 truncate">{tag.sceneHeading}</div>
                            )}
                          </div>
                          <button
                            onClick={() => onRemoveTag(tag.id)}
                            className="ml-2 p-1 text-white/30 hover:text-red-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for breakdown tags
 */
export function useBreakdownTags() {
  const [tags, setTags] = useState<BreakdownTag[]>([]);
  const [showReport, setShowReport] = useState(false);

  return {
    tags,
    setTags,
    showReport,
    openReport: () => setShowReport(true),
    closeReport: () => setShowReport(false),
  };
}
