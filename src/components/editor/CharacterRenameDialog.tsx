/**
 * CharacterRenameDialog — Bulk rename character across script
 * 
 * Find all occurrences and replace at once
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, TextNode, LexicalNode } from 'lexical';

interface CharacterRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CharacterOccurrence {
  context: string;
  type: 'heading' | 'dialogue' | 'action';
}

export default function CharacterRenameDialog({ isOpen, onClose }: CharacterRenameDialogProps) {
  const [editor] = useLexicalComposerContext();
  const [characters, setCharacters] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [newName, setNewName] = useState('');
  const [occurrences, setOccurrences] = useState<CharacterOccurrence[]>([]);
  const [_isSearching, setIsSearching] = useState(false);
  const newNameRef = useRef<HTMLInputElement>(null);

  // Extract all character names from the script
  const extractCharacters = useCallback(() => {
    const foundCharacters = new Set<string>();
    
    editor.getEditorState().read(() => {
      const root = $getRoot();
      
      const processNode = (node: LexicalNode) => {
        // Check if this is a character element
        const element = node.getTopLevelElement?.();
        if (element && 'getType' in element) {
          const type = (element as any).__type;
          if (type === 'character' || type === 'screenplay-character') {
            const text = node.getTextContent().trim();
            // Remove extensions like (V.O.), (O.S.), (CONT'D)
            const cleanName = text.replace(/\s*\([^)]+\)\s*/g, '').trim();
            if (cleanName && cleanName.length > 0) {
              foundCharacters.add(cleanName.toUpperCase());
            }
          }
        }
        
        // Process children
        if ('getChildren' in node && typeof node.getChildren === 'function') {
          node.getChildren().forEach((child: LexicalNode) => processNode(child));
        }
      };

      processNode(root);
    });

    // Sort alphabetically
    const sorted = Array.from(foundCharacters).sort();
    setCharacters(sorted);
    
    // Select first character by default
    if (sorted.length > 0 && !selectedCharacter) {
      setSelectedCharacter(sorted[0]);
    }
  }, [editor, selectedCharacter]);

  // Find occurrences of selected character
  const findOccurrences = useCallback(() => {
    if (!selectedCharacter) {
      setOccurrences([]);
      return;
    }

    setIsSearching(true);
    const found: CharacterOccurrence[] = [];
    
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      
      // Create regex for character name
      const regex = new RegExp(`\\b${escapeRegExp(selectedCharacter)}\\b`, 'gi');
      
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(text.length, match.index + selectedCharacter.length + 30);
        const context = (start > 0 ? '...' : '') + 
                       text.slice(start, end) + 
                       (end < text.length ? '...' : '');
        
        // Determine type based on context (simplified)
        let type: 'heading' | 'dialogue' | 'action' = 'action';
        if (context.includes('INT.') || context.includes('EXT.')) {
          type = 'heading';
        } else if (text.slice(match.index - 50, match.index).match(/^\s*$/m)) {
          type = 'dialogue';
        }
        
        found.push({ context, type });
      }
    });

    setOccurrences(found);
    setIsSearching(false);
  }, [editor, selectedCharacter]);

  // Extract characters when dialog opens
  useEffect(() => {
    if (isOpen) {
      extractCharacters();
    }
  }, [isOpen, extractCharacters]);

  // Find occurrences when character is selected
  useEffect(() => {
    findOccurrences();
  }, [selectedCharacter, findOccurrences]);

  // Focus new name input when character is selected
  useEffect(() => {
    if (selectedCharacter && newNameRef.current) {
      newNameRef.current.focus();
      setNewName(selectedCharacter);
    }
  }, [selectedCharacter]);

  // Handle rename
  const handleRename = () => {
    if (!selectedCharacter || !newName.trim() || selectedCharacter === newName.trim().toUpperCase()) {
      return;
    }

    const finalNewName = newName.trim().toUpperCase();
    
    editor.update(() => {
      const root = $getRoot();
      const regex = new RegExp(`\\b${escapeRegExp(selectedCharacter)}\\b`, 'gi');
      
      const processNode = (node: LexicalNode) => {
        if (node instanceof TextNode) {
          const text = node.getTextContent();
          if (regex.test(text)) {
            const newText = text.replace(regex, finalNewName);
            node.setTextContent(newText);
          }
        }
        
        if ('getChildren' in node && typeof node.getChildren === 'function') {
          node.getChildren().forEach((child: LexicalNode) => processNode(child));
        }
      };

      processNode(root);
    });

    // Update UI
    setCharacters(prev => {
      const updated = prev.filter(c => c !== selectedCharacter);
      if (!updated.includes(finalNewName)) {
        updated.push(finalNewName);
      }
      return updated.sort();
    });
    
    setSelectedCharacter(finalNewName);
    setNewName(finalNewName);
    findOccurrences();
  };

  // Handle keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleRename();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Rename Character</h2>
              <p className="text-xs text-white/50">Find and replace character name throughout script</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Character Selection */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wide">Select Character</label>
            {characters.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white/5 rounded-lg border border-white/10">
                {characters.map(char => (
                  <button
                    key={char}
                    onClick={() => setSelectedCharacter(char)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      selectedCharacter === char
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center text-white/40 text-sm">
                No characters found in script
              </div>
            )}
          </div>

          {/* New Name Input */}
          {selectedCharacter && (
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wide">New Name</label>
              <input
                ref={newNameRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value.toUpperCase())}
                placeholder="Enter new character name..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white uppercase placeholder-white/30 outline-none focus:border-violet-500/50"
              />
            </div>
          )}

          {/* Occurrences Preview */}
          {occurrences.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-white/50 uppercase tracking-wide">
                {occurrences.length} Occurrences Found
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-white/5 rounded-lg border border-white/10">
                {occurrences.slice(0, 10).map((occ, i) => (
                  <div 
                    key={i}
                    className="text-xs text-white/60 font-mono p-2 bg-white/5 rounded"
                  >
                    <span className={`inline-block w-16 text-[10px] uppercase ${
                      occ.type === 'heading' ? 'text-blue-400' :
                      occ.type === 'dialogue' ? 'text-green-400' :
                      'text-amber-400'
                    }`}>
                      [{occ.type}]
                    </span>
                    {occ.context}
                  </div>
                ))}
                {occurrences.length > 10 && (
                  <div className="text-xs text-white/40 text-center py-2">
                    +{occurrences.length - 10} more occurrences
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-xs text-white/30">
            Ctrl+Enter to rename
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              disabled={!selectedCharacter || !newName.trim() || selectedCharacter === newName.trim().toUpperCase()}
              className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Rename All ({occurrences.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility function
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
