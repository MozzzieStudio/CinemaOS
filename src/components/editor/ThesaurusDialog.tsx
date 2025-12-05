/**
 * ThesaurusDialog — Synonym lookup with AI integration
 * 
 * Shift+F7 to open thesaurus for selected word
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';

import { BUILT_IN_THESAURUS, BUILT_IN_THESAURUS_ES, ThesaurusSuggestion } from '../../data/thesaurus';

interface ThesaurusDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThesaurusDialog({ isOpen, onClose }: ThesaurusDialogProps) {
  const [editor] = useLexicalComposerContext();
  const [_selectedWord, setSelectedWord] = useState('');
  const [suggestions, setSuggestions] = useState<ThesaurusSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected word when dialog opens
  useEffect(() => {
    if (isOpen) {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const text = selection.getTextContent().trim();
          if (text && text.length > 0 && !text.includes(' ')) {
            setSelectedWord(text);
            setSearchTerm(text);
            lookupWord(text);
          } else {
            setSelectedWord('');
            setSearchTerm('');
            inputRef.current?.focus();
          }
        }
      });
    }
  }, [isOpen, editor]);

  // Lookup word in thesaurus
  const lookupWord = useCallback((word: string) => {
    if (!word.trim()) {
      setSuggestions(null);
      return;
    }

    setIsLoading(true);
    
    // Check built-in thesaurus first
    const upperWord = word.toUpperCase().trim();
    const dict = language === 'en' ? BUILT_IN_THESAURUS : BUILT_IN_THESAURUS_ES;
    
    if (dict[upperWord]) {
      setSuggestions(dict[upperWord]);
      setIsLoading(false);
      return;
    }

    // fallback for demo if word not in mock dict
    if (language === 'es' && !dict[upperWord]) {
         setSuggestions({
            word: word,
            partOfSpeech: 'unknown',
            synonyms: ['(Simulado) sinónimo 1', '(Simulado) sinónimo 2'],
         });
         setIsLoading(false);
         return;
    }

    // TODO: Could integrate with a real thesaurus API or AI here
    // For now, show empty result
    setSuggestions({
      word: word,
      partOfSpeech: 'unknown',
      synonyms: [],
    });
    setIsLoading(false);
  }, [language]);

  // Handle search
  const handleSearch = () => {
    lookupWord(searchTerm);
  };

  // Replace selected word with synonym
  const replaceWithSynonym = (synonym: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // If we have a selection, replace it
        if (!selection.isCollapsed()) {
          selection.insertText(synonym);
        }
      }
    });
    onClose();
  };

  // Handle keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        handleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Thesaurus</h2>
              <p className="text-xs text-white/50">Find the perfect word</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-2">
             <div className="flex bg-white/5 rounded-lg p-0.5 shrink-0">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${language === 'en' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('es')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${language === 'es' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  ES
                </button>
             </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'en' ? "Enter a word..." : "Escribe una palabra..."}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Look Up
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-white/50 py-8">
              Looking up synonyms...
            </div>
          ) : suggestions ? (
            <div className="space-y-4">
              {/* Word header */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{suggestions.word}</span>
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-xs">
                  {suggestions.partOfSpeech}
                </span>
              </div>

              {/* Synonyms */}
              {suggestions.synonyms.length > 0 ? (
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wide mb-2">Synonyms</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.synonyms.map((synonym, i) => (
                      <button
                        key={i}
                        onClick={() => replaceWithSynonym(synonym)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 rounded-full text-sm text-white/80 hover:text-white transition-colors"
                      >
                        {synonym}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-white/40 py-4">
                  No synonyms found for "{suggestions.word}"
                </div>
              )}

              {/* Antonyms */}
              {suggestions.antonyms && suggestions.antonyms.length > 0 && (
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wide mb-2">Antonyms</div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.antonyms.map((antonym, i) => (
                      <button
                        key={i}
                        onClick={() => replaceWithSynonym(antonym)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-full text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        {antonym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/40 py-8">
              <div className="text-3xl mb-2">📚</div>
              <p>Select a word or type to search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] text-xs text-white/30 text-center">
          Select a word and press Shift+F7 to open thesaurus
        </div>
      </div>
    </div>
  );
}
