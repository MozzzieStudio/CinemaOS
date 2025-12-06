/**
 * CharacterHighlightPlugin — Highlight lines for specific characters
 * 
 * Features:
 * - Assign unique colors to each character
 * - Toggle to highlight all lines for a character
 * - Useful for actors reviewing their lines
 * - Ctrl+Shift+H opens character selector
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  createCommand,
  LexicalCommand,
  COMMAND_PRIORITY_LOW,
} from 'lexical';

// Commands
export const TOGGLE_CHARACTER_HIGHLIGHT_COMMAND: LexicalCommand<string> = createCommand('TOGGLE_CHARACTER_HIGHLIGHT');
export const OPEN_CHARACTER_SELECTOR_COMMAND: LexicalCommand<void> = createCommand('OPEN_CHARACTER_SELECTOR');

// Predefined colors for characters
const CHARACTER_COLORS = [
  { name: 'Purple', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
  { name: 'Blue', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
  { name: 'Green', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
  { name: 'Yellow', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)' },
  { name: 'Orange', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
  { name: 'Pink', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' },
  { name: 'Cyan', color: '#22d3ee', bg: 'rgba(34, 211, 238, 0.15)' },
  { name: 'Red', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
];

interface CharacterInfo {
  name: string;
  colorIndex: number;
  lineCount: number;
}

interface CharacterHighlightPluginProps {
  onCharactersExtracted?: (characters: CharacterInfo[]) => void;
}

export default function CharacterHighlightPlugin({ onCharactersExtracted }: CharacterHighlightPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [characters, setCharacters] = useState<Map<string, CharacterInfo>>(new Map());
  const [highlightedCharacter, setHighlightedCharacter] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Extract characters from the script
  const extractCharacters = useCallback(() => {
    const foundCharacters = new Map<string, CharacterInfo>();
    let colorIndex = 0;

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const children = root.getChildren();
      
      children.forEach(child => {
        const type = (child as any).__type || child.getType();
        
        if (type === 'character') {
          const name = child.getTextContent().trim()
            .replace(/\s*\([^)]+\)\s*/g, '') // Remove extensions like (V.O.)
            .toUpperCase();
          
          if (name && name.length > 0) {
            const existing = foundCharacters.get(name);
            if (existing) {
              existing.lineCount++;
            } else {
              foundCharacters.set(name, {
                name,
                colorIndex: colorIndex++ % CHARACTER_COLORS.length,
                lineCount: 1,
              });
            }
          }
        }
      });
    });

    setCharacters(foundCharacters);
    
    if (onCharactersExtracted) {
      onCharactersExtracted(Array.from(foundCharacters.values()));
    }
  }, [editor, onCharactersExtracted]);

  // Extract on mount and content changes
  useEffect(() => {
    extractCharacters();
    
    const unregister = editor.registerUpdateListener(({ dirtyElements }) => {
      if (dirtyElements.size > 0) {
        extractCharacters();
      }
    });

    return unregister;
  }, [editor, extractCharacters]);

  // Apply highlighting styles
  useEffect(() => {
    const styleId = 'character-highlight-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    if (!highlightedCharacter) {
      styleEl.textContent = '';
      // Remove all highlight classes
      editor.getEditorState().read(() => {
        const root = $getRoot();
        root.getChildren().forEach(child => {
          const element = editor.getElementByKey(child.getKey());
          if (element) {
            element.classList.remove('character-highlighted', 'character-dimmed');
          }
        });
      });
      return;
    }

    const charInfo = characters.get(highlightedCharacter);
    if (!charInfo) return;

    const colorData = CHARACTER_COLORS[charInfo.colorIndex];
    styleEl.textContent = `
      .character-highlighted {
        background-color: ${colorData.bg} !important;
        border-left: 3px solid ${colorData.color} !important;
        padding-left: 8px !important;
      }
      .character-dimmed {
        opacity: 0.4;
      }
    `;

    // Apply classes to relevant elements
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const children = root.getChildren();
      let inHighlightedBlock = false;

      children.forEach(child => {
        const element = editor.getElementByKey(child.getKey());
        if (!element) return;

        const type = (child as any).__type || child.getType();
        
        if (type === 'character') {
          const name = child.getTextContent().trim()
            .replace(/\s*\([^)]+\)\s*/g, '')
            .toUpperCase();
          
          inHighlightedBlock = name === highlightedCharacter;
        }

        if (inHighlightedBlock && (type === 'character' || type === 'dialogue' || type === 'parenthetical')) {
          element.classList.add('character-highlighted');
          element.classList.remove('character-dimmed');
        } else {
          element.classList.remove('character-highlighted');
          element.classList.add('character-dimmed');
        }

        // Scene headings and transitions reset the block
        if (type === 'scene-heading' || type === 'transition') {
          inHighlightedBlock = false;
        }
      });
    });

    return () => {
      styleEl.textContent = '';
    };
  }, [editor, highlightedCharacter, characters]);

  // Command handlers
  useEffect(() => {
    const unregisterToggle = editor.registerCommand(
      TOGGLE_CHARACTER_HIGHLIGHT_COMMAND,
      (characterName: string) => {
        if (highlightedCharacter === characterName) {
          setHighlightedCharacter(null);
        } else {
          setHighlightedCharacter(characterName);
        }
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterOpen = editor.registerCommand(
      OPEN_CHARACTER_SELECTOR_COMMAND,
      () => {
        setShowSelector(true);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterToggle();
      unregisterOpen();
    };
  }, [editor, highlightedCharacter]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        setShowSelector(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render character selector
  if (!showSelector) return null;

  return (
    <CharacterSelectorDialog
      characters={Array.from(characters.values())}
      highlightedCharacter={highlightedCharacter}
      onSelect={(name) => {
        setHighlightedCharacter(name === highlightedCharacter ? null : name);
        setShowSelector(false);
      }}
      onClear={() => {
        setHighlightedCharacter(null);
        setShowSelector(false);
      }}
      onClose={() => setShowSelector(false)}
    />
  );
}

/**
 * Character Selector Dialog
 */
interface CharacterSelectorDialogProps {
  characters: CharacterInfo[];
  highlightedCharacter: string | null;
  onSelect: (name: string) => void;
  onClear: () => void;
  onClose: () => void;
}

function CharacterSelectorDialog({
  characters,
  highlightedCharacter,
  onSelect,
  onClear,
  onClose,
}: CharacterSelectorDialogProps) {
  // Sort by line count (most lines first)
  const sortedCharacters = [...characters].sort((a, b) => b.lineCount - a.lineCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎭</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Character Highlighting</h2>
              <p className="text-xs text-white/50">Select a character to highlight their lines</p>
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
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {sortedCharacters.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              <span className="text-4xl mb-4 block">📝</span>
              <p>No characters found in script</p>
              <p className="text-xs mt-2">Add character dialogue to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {sortedCharacters.map((char) => {
                const colorData = CHARACTER_COLORS[char.colorIndex];
                const isHighlighted = highlightedCharacter === char.name;
                
                return (
                  <button
                    key={char.name}
                    onClick={() => onSelect(char.name)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isHighlighted
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: colorData.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">
                        {char.name}
                      </div>
                      <div className="text-xs text-white/40">
                        {char.lineCount} {char.lineCount === 1 ? 'line' : 'lines'}
                      </div>
                    </div>
                    {isHighlighted && (
                      <span className="text-xs text-emerald-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {highlightedCharacter && (
          <div className="px-6 py-3 border-t border-white/10 bg-white/2">
            <button
              onClick={onClear}
              className="w-full py-2 text-sm bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
            >
              Clear Highlighting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for character highlighting
 */
export function useCharacterHighlight() {
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [highlightedCharacter, setHighlightedCharacter] = useState<string | null>(null);

  return {
    characters,
    setCharacters,
    highlightedCharacter,
    setHighlightedCharacter,
  };
}
