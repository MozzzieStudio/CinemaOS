/**
 * SmartTypePlugin — Intelligent autocomplete for screenwriting
 * 
 * Character names, locations, time of day, extensions
 */

import { useState, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection, 
  TextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  $getRoot,
} from 'lexical';

interface SmartTypeConfig {
  enabled: boolean;
  characters: boolean;
  locations: boolean;
  times: boolean;
  extensions: boolean;
  transitions: boolean;
}

interface Suggestion {
  text: string;
  type: 'character' | 'location' | 'time' | 'extension' | 'transition';
  icon: string;
}

// Default suggestions
const DEFAULT_TIMES = ['DAY', 'NIGHT', 'DAWN', 'DUSK', 'MORNING', 'EVENING', 'LATER', 'CONTINUOUS', 'MOMENTS LATER'];
const DEFAULT_EXTENSIONS = ['(V.O.)', '(O.S.)', '(O.C.)', "(CONT'D)", '(PRE-LAP)', '(SUBTITLE)'];
const DEFAULT_TRANSITIONS = ['CUT TO:', 'FADE IN:', 'FADE OUT:', 'DISSOLVE TO:', 'SMASH CUT:', 'MATCH CUT:', 'JUMP CUT:', 'TIME CUT:'];

interface SmartTypePluginProps {
  config: SmartTypeConfig;
}

export default function SmartTypePlugin({ config }: SmartTypePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [triggerWord, setTriggerWord] = useState('');

  // Extracted data from script
  const [characters, setCharacters] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Extract characters and locations from script
  const extractData = useCallback(() => {
    const foundCharacters = new Set<string>();
    const foundLocations = new Set<string>();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const content = root.getTextContent();
      const lines = content.split('\n');

      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Character names (uppercase, not scene headings)
        if (trimmed.match(/^[A-Z][A-Z\s\.\-]+$/) && 
            !trimmed.match(/^(INT\.|EXT\.|I\/E\.)/) &&
            trimmed.length < 40) {
          const cleanName = trimmed.replace(/\s*\([^)]+\)\s*/g, '').trim();
          if (cleanName.length > 1) {
            foundCharacters.add(cleanName);
          }
        }

        // Locations from scene headings
        const locationMatch = trimmed.match(/^(?:INT\.|EXT\.|I\/E\.)\s*(.+?)(?:\s*-\s*.+)?$/i);
        if (locationMatch) {
          const location = locationMatch[1].trim();
          if (location.length > 0) {
            foundLocations.add(location);
          }
        }
      });
    });

    setCharacters([...foundCharacters].sort());
    setLocations([...foundLocations].sort());
  }, [editor]);

  // Extract on mount and content changes
  useEffect(() => {
    extractData();
    
    const unregister = editor.registerUpdateListener(({ dirtyElements }) => {
      if (dirtyElements.size > 3) {
        extractData();
      }
    });

    return unregister;
  }, [editor, extractData]);

  // Generate suggestions based on current input
  const generateSuggestions = useCallback((query: string, context: 'character' | 'location' | 'time' | 'general') => {
    if (!config.enabled || query.length < 1) {
      setSuggestions([]);
      return;
    }

    const upper = query.toUpperCase();
    const results: Suggestion[] = [];

    // Character suggestions
    if (config.characters && (context === 'character' || context === 'general')) {
      characters
        .filter(c => c.startsWith(upper))
        .slice(0, 5)
        .forEach(c => results.push({ text: c, type: 'character', icon: '👤' }));
    }

    // Extension suggestions (after character names)
    if (config.extensions && context === 'character') {
      DEFAULT_EXTENSIONS
        .filter(e => e.toLowerCase().includes(query.toLowerCase()))
        .forEach(e => results.push({ text: e, type: 'extension', icon: '🎤' }));
    }

    // Location suggestions
    if (config.locations && (context === 'location' || context === 'general')) {
      locations
        .filter(l => l.toUpperCase().startsWith(upper))
        .slice(0, 5)
        .forEach(l => results.push({ text: l, type: 'location', icon: '📍' }));
    }

    // Time of day suggestions
    if (config.times && context === 'time') {
      DEFAULT_TIMES
        .filter(t => t.startsWith(upper))
        .forEach(t => results.push({ text: t, type: 'time', icon: '🕐' }));
    }

    // Transition suggestions
    if (config.transitions && context === 'general') {
      DEFAULT_TRANSITIONS
        .filter(t => t.toUpperCase().startsWith(upper))
        .forEach(t => results.push({ text: t, type: 'transition', icon: '🎬' }));
    }

    setSuggestions(results.slice(0, 8));
    setSelectedIndex(0);
  }, [config, characters, locations]);

  // Monitor text input for suggestions
  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setSuggestions([]);
          return;
        }

        const node = selection.anchor.getNode();
        if (!(node instanceof TextNode)) {
          setSuggestions([]);
          return;
        }

        const text = node.getTextContent();
        const offset = selection.anchor.offset;
        
        // Find the current word being typed
        const beforeCursor = text.slice(0, offset);
        const wordMatch = beforeCursor.match(/(\S+)$/);
        
        if (!wordMatch) {
          setSuggestions([]);
          return;
        }

        const currentWord = wordMatch[1];
        setTriggerWord(currentWord);

        // Determine context based on element type or content
        let context: 'character' | 'location' | 'time' | 'general' = 'general';
        
        // Check if we're in a character element
        const topElement = node.getTopLevelElement();
        if (topElement) {
          const type = (topElement as any).__type;
          if (type === 'character' || type === 'screenplay-character') {
            context = 'character';
          } else if (type === 'scene-heading' || type === 'screenplay-scene-heading') {
            // Check if after " - " for time of day
            if (beforeCursor.includes(' - ')) {
              context = 'time';
            } else {
              context = 'location';
            }
          }
        }

        // Get caret position for popup
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setPosition({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }

        generateSuggestions(currentWord, context);
      });
    });

    return unregister;
  }, [editor, generateSuggestions]);

  // Apply selected suggestion
  const applySuggestion = useCallback((suggestion: Suggestion) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const node = selection.anchor.getNode();
      if (!(node instanceof TextNode)) return;

      const text = node.getTextContent();
      const offset = selection.anchor.offset;
      
      // Replace the trigger word with the suggestion
      const beforeTrigger = text.slice(0, offset - triggerWord.length);
      const afterCursor = text.slice(offset);
      
      const newText = beforeTrigger + suggestion.text + afterCursor;
      node.setTextContent(newText);

      // Move selection to end of inserted text
      selection.anchor.offset = beforeTrigger.length + suggestion.text.length;
      selection.focus.offset = beforeTrigger.length + suggestion.text.length;
    });

    setSuggestions([]);
  }, [editor, triggerWord]);

  // Handle keyboard navigation
  useEffect(() => {
    if (suggestions.length === 0) return;

    const commands = [
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => {
          if (suggestions.length === 0) return false;
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        () => {
          if (suggestions.length === 0) return false;
          setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        () => {
          if (suggestions.length === 0) return false;
          applySuggestion(suggestions[selectedIndex]);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        () => {
          if (suggestions.length === 0) return false;
          applySuggestion(suggestions[selectedIndex]);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (suggestions.length === 0) return false;
          setSuggestions([]);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
    ];

    return () => commands.forEach(unregister => unregister());
  }, [editor, suggestions, selectedIndex, applySuggestion]);

  // Render suggestions popup
  if (suggestions.length === 0 || !position) return null;

  return (
    <div 
      className="fixed z-50 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={{ top: position.top, left: position.left, minWidth: '180px' }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.type}-${suggestion.text}`}
          onClick={() => applySuggestion(suggestion)}
          className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
            index === selectedIndex
              ? 'bg-violet-500/20 text-white'
              : 'text-white/70 hover:bg-white/5'
          }`}
        >
          <span>{suggestion.icon}</span>
          <span className="truncate">{suggestion.text}</span>
          <span className="ml-auto text-[10px] text-white/30 uppercase">
            {suggestion.type}
          </span>
        </button>
      ))}
      <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-white/30">
        Tab/Enter to select • Esc to close
      </div>
    </div>
  );
}

// Hook for SmartType configuration
export function useSmartType() {
  const [config, setConfig] = useState<SmartTypeConfig>({
    enabled: true,
    characters: true,
    locations: true,
    times: true,
    extensions: true,
    transitions: true,
  });

  const toggleEnabled = () => setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  const toggleCharacters = () => setConfig(prev => ({ ...prev, characters: !prev.characters }));
  const toggleLocations = () => setConfig(prev => ({ ...prev, locations: !prev.locations }));
  const toggleTimes = () => setConfig(prev => ({ ...prev, times: !prev.times }));
  const toggleExtensions = () => setConfig(prev => ({ ...prev, extensions: !prev.extensions }));
  const toggleTransitions = () => setConfig(prev => ({ ...prev, transitions: !prev.transitions }));

  return {
    config,
    setConfig,
    toggleEnabled,
    toggleCharacters,
    toggleLocations,
    toggleTimes,
    toggleExtensions,
    toggleTransitions,
  };
}
