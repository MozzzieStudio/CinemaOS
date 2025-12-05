/**
 * RevisionPlugin — Track Changes for Screenplay Revisions
 * 
 * Implements colored revision marks following Hollywood standards:
 * WHITE → BLUE → PINK → YELLOW → GREEN → GOLDENROD → BUFF → SALMON → CHERRY
 */

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot,
  $getSelection,
  $isRangeSelection,
  TextNode,
  LexicalEditor,
} from 'lexical';

// Standard revision colors (in order)
export const REVISION_COLORS = [
  { name: 'WHITE', color: '#ffffff', bg: 'transparent' },
  { name: 'BLUE', color: '#4a90d9', bg: '#4a90d920' },
  { name: 'PINK', color: '#e91e8c', bg: '#e91e8c20' },
  { name: 'YELLOW', color: '#f5c842', bg: '#f5c84220' },
  { name: 'GREEN', color: '#4caf50', bg: '#4caf5020' },
  { name: 'GOLDENROD', color: '#daa520', bg: '#daa52020' },
  { name: 'BUFF', color: '#f0dc82', bg: '#f0dc8220' },
  { name: 'SALMON', color: '#fa8072', bg: '#fa807220' },
  { name: 'CHERRY', color: '#de3163', bg: '#de316320' },
] as const;

export interface RevisionMark {
  type: 'insert' | 'delete';
  timestamp: string;
  colorIndex: number;
  author?: string;
}

export interface RevisionConfig {
  enabled: boolean;
  currentColorIndex: number;
  showMarks: boolean;
}

interface RevisionPluginProps {
  config: RevisionConfig;
  onConfigChange: (config: RevisionConfig) => void;
}

export default function RevisionPlugin({ config, onConfigChange }: RevisionPluginProps) {
  const [editor] = useLexicalComposerContext();

  // Track text changes when revision mode is enabled
  useEffect(() => {
    if (!config.enabled) return;

    const removeListener = editor.registerTextContentListener((textContent) => {
      // Text has changed - mark as revised
      // This is a simplified implementation - full implementation would
      // track individual character changes
    });

    return removeListener;
  }, [editor, config.enabled]);

  // Apply revision styling
  useEffect(() => {
    if (!config.showMarks) return;

    // Add CSS for revision marks
    const styleId = 'revision-marks-style';
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    const color = REVISION_COLORS[config.currentColorIndex];
    style.textContent = `
      .revision-insert {
        color: ${color.color};
        background-color: ${color.bg};
        text-decoration: underline;
      }
      .revision-delete {
        color: #ff4444;
        text-decoration: line-through;
        opacity: 0.6;
      }
      .revision-asterisk::before {
        content: '*';
        color: ${color.color};
        font-weight: bold;
        margin-right: 4px;
      }
    `;

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [config.showMarks, config.currentColorIndex]);

  return null; // This is a logic-only plugin
}

/**
 * Hook to manage revision state
 */
export function useRevision() {
  const [config, setConfig] = useState<RevisionConfig>({
    enabled: false,
    currentColorIndex: 1, // Start with BLUE (index 1)
    showMarks: true,
  });

  const toggleRevisionMode = () => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const nextColor = () => {
    setConfig(prev => ({
      ...prev,
      currentColorIndex: (prev.currentColorIndex + 1) % REVISION_COLORS.length,
    }));
  };

  const setColor = (index: number) => {
    setConfig(prev => ({
      ...prev,
      currentColorIndex: Math.max(0, Math.min(index, REVISION_COLORS.length - 1)),
    }));
  };

  const toggleShowMarks = () => {
    setConfig(prev => ({ ...prev, showMarks: !prev.showMarks }));
  };

  return {
    config,
    setConfig,
    toggleRevisionMode,
    nextColor,
    setColor,
    toggleShowMarks,
    currentColor: REVISION_COLORS[config.currentColorIndex],
  };
}

/**
 * Revision Panel Component
 */
interface RevisionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: RevisionConfig;
  onConfigChange: (config: RevisionConfig) => void;
}

export function RevisionPanel({ isOpen, onClose, config, onConfigChange }: RevisionPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Revision Mode</h2>
              <p className="text-xs text-white/50">Track changes to your script</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white/80">Track Changes</span>
            <button
              onClick={() => onConfigChange({ ...config, enabled: !config.enabled })}
              className={`w-12 h-6 rounded-full transition-colors ${
                config.enabled ? 'bg-violet-600' : 'bg-white/10'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Show Marks Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white/80">Show Revision Marks</span>
            <button
              onClick={() => onConfigChange({ ...config, showMarks: !config.showMarks })}
              className={`w-12 h-6 rounded-full transition-colors ${
                config.showMarks ? 'bg-violet-600' : 'bg-white/10'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                config.showMarks ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Color Selection */}
          <div>
            <div className="text-sm text-white/50 mb-3">Revision Color</div>
            <div className="flex flex-wrap gap-2">
              {REVISION_COLORS.map((color, index) => (
                <button
                  key={color.name}
                  onClick={() => onConfigChange({ ...config, currentColorIndex: index })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    config.currentColorIndex === index
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="text-xs text-white/40 mt-2">
              Current: {REVISION_COLORS[config.currentColorIndex].name}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/2 text-xs text-white/30 text-center">
          Revisions follow Hollywood standard color sequence
        </div>
      </div>
    </div>
  );
}
