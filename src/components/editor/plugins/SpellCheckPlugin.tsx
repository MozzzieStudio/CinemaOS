/**
 * SpellCheckPlugin — Spell checking with custom dictionary
 * 
 * Uses browser spellcheck + custom screenplay dictionary
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

// Common screenplay terms that shouldn't be flagged (exported for use in other modules)
export const SCREENPLAY_DICTIONARY = new Set([
  // Scene elements
  'INT', 'EXT', 'I/E', 'DAY', 'NIGHT', 'DAWN', 'DUSK', 'CONTINUOUS', 'LATER', 'MOMENTS',
  // Extensions
  'V.O.', 'VO', 'O.S.', 'OS', 'O.C.', 'OC', 'CONT\'D', 'CONTD', 'PRE-LAP',
  // Transitions
  'CUT TO:', 'FADE IN:', 'FADE OUT:', 'FADE TO:', 'DISSOLVE TO:', 'SMASH CUT:',
  'MATCH CUT:', 'JUMP CUT:', 'TIME CUT:', 'INTERCUT', 'FLASHBACK', 'FLASHFORWARD',
  // Camera directions
  'POV', 'ANGLE ON', 'CLOSE ON', 'WIDE ON', 'INSERT', 'ECU', 'CU', 'MCU', 'MS', 'WS',
  'TRACKING', 'DOLLY', 'PAN', 'TILT', 'ZOOM', 'CRANE', 'STEADICAM', 'HANDHELD',
  // Production terms
  'SFX', 'VFX', 'CGI', 'SUPER', 'TITLE', 'CHYRON', 'MONTAGE', 'SERIES OF SHOTS',
  // Beat board
  'TEASER', 'COLD OPEN', 'ACT ONE', 'ACT TWO', 'ACT THREE', 'TAG', 'END OF',
  // Formatting
  'OMITTED', 'REVISED', 'CONTINUED', 'MORE',
]);

// User's custom dictionary (persisted to localStorage)
const CUSTOM_DICTIONARY_KEY = 'cinemaos-custom-dictionary';

interface SpellCheckConfig {
  enabled: boolean;
  autoCorrect: boolean;
  ignoredWords: Set<string>;
}

interface SpellCheckPluginProps {
  config: SpellCheckConfig;
}

export default function SpellCheckPlugin({ config }: SpellCheckPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [customDictionary, setCustomDictionary] = useState<Set<string>>(new Set());

  // Load custom dictionary from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_DICTIONARY_KEY);
      if (saved) {
        setCustomDictionary(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error('Failed to load custom dictionary:', e);
    }
  }, []);

  // Save custom dictionary to localStorage
  const saveCustomDictionary = useCallback((words: Set<string>) => {
    try {
      localStorage.setItem(CUSTOM_DICTIONARY_KEY, JSON.stringify([...words]));
    } catch (e) {
      console.error('Failed to save custom dictionary:', e);
    }
  }, []);

  // Add word to custom dictionary
  const addToDictionary = useCallback((word: string) => {
    const normalized = word.toUpperCase().trim();
    setCustomDictionary(prev => {
      const updated = new Set(prev);
      updated.add(normalized);
      saveCustomDictionary(updated);
      return updated;
    });
  }, [saveCustomDictionary]);

  // Enable/disable browser spellcheck on the editor
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.setAttribute('spellcheck', config.enabled ? 'true' : 'false');
    }
  }, [editor, config.enabled]);

  // Extract character names and add them to dictionary
  useEffect(() => {
    if (!config.enabled) return;

    const extractCharacterNames = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const content = root.getTextContent();
        
        // Find character names (uppercase lines that are likely character cues)
        const characterPattern = /^[A-Z][A-Z\s\.\-]+(?:\s*\([^)]+\))?$/gm;
        const matches = content.match(characterPattern) || [];
        
        matches.forEach(match => {
          const name = match.replace(/\s*\([^)]+\)\s*/g, '').trim();
          if (name.length > 0 && !customDictionary.has(name)) {
            addToDictionary(name);
          }
        });
      });
    };

    // Extract on load
    extractCharacterNames();

    // Re-extract when content changes significantly
    const unregister = editor.registerUpdateListener(({ dirtyElements }) => {
      if (dirtyElements.size > 5) {
        extractCharacterNames();
      }
    });

    return unregister;
  }, [editor, config.enabled, customDictionary, addToDictionary]);

  return null; // This plugin doesn't render anything
}

// Hook for spell check configuration
export function useSpellCheck() {
  const [config, setConfig] = useState<SpellCheckConfig>({
    enabled: true,
    autoCorrect: false,
    ignoredWords: new Set(),
  });

  const toggleEnabled = () => setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  const toggleAutoCorrect = () => setConfig(prev => ({ ...prev, autoCorrect: !prev.autoCorrect }));
  
  const ignoreWord = (word: string) => {
    setConfig(prev => ({
      ...prev,
      ignoredWords: new Set([...prev.ignoredWords, word.toUpperCase().trim()]),
    }));
  };

  return {
    config,
    setConfig,
    toggleEnabled,
    toggleAutoCorrect,
    ignoreWord,
  };
}

// Common misspellings in screenplays
export const AUTO_CORRECTIONS: Record<string, string> = {
  'teh': 'the',
  'adn': 'and',
  'taht': 'that',
  'hte': 'the',
  'woudl': 'would',
  'shoudl': 'should',
  'coudl': 'could',
  'becuase': 'because',
  'tiem': 'time',
  'thier': 'their',
  'recieve': 'receive',
  'acheive': 'achieve',
  'beleive': 'believe',
  'occured': 'occurred',
  'tommorow': 'tomorrow',
  'wierd': 'weird',
  'definately': 'definitely',
  'seperate': 'separate',
  'untill': 'until',
  'accross': 'across',
};
