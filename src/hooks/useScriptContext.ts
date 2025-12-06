/**
 * useScriptContext - Hook to extract context from Lexical editor
 */

import { useCallback } from 'react';
import { $getRoot, $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import type { ScriptContext } from '../types/agents';

interface UseScriptContextReturn {
  /** Extract current script context from editor */
  getContext: (editor: LexicalEditor) => ScriptContext;
}

export function useScriptContext(): UseScriptContextReturn {
  const getContext = useCallback((editor: LexicalEditor): ScriptContext => {
    let context: ScriptContext = {
      full_text: '',
      scene_characters: [],
    };

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const fullText = root.getTextContent();
      const selection = $getSelection();

      context.full_text = fullText;

      // Get selected text
      if ($isRangeSelection(selection)) {
        context.selection = selection.getTextContent();
        
        // Get cursor line (approximate)
        const anchor = selection.anchor;
        const textBefore = fullText.substring(0, anchor.offset);
        context.cursor_line = (textBefore.match(/\n/g) || []).length + 1;
      }

      // Extract current scene
      const lines = fullText.split('\n');
      let currentScene: string | undefined;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('INT.') || line.startsWith('EXT.')) {
          currentScene = line;
        }
        // Stop if we've passed the cursor
        if (context.cursor_line && i >= context.cursor_line) {
          break;
        }
      }
      context.current_scene = currentScene;

      // Extract characters (lines in ALL CAPS before dialogue)
      const characters = new Set<string>();
      const characterPattern = /^([A-Z][A-Z\s]+)$/;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (characterPattern.test(trimmed) && !trimmed.startsWith('INT.') && !trimmed.startsWith('EXT.')) {
          characters.add(trimmed);
        }
      }
      context.scene_characters = Array.from(characters);

      // Detect current element type
      if (context.selection) {
        const selTrimmed = context.selection.trim();
        if (selTrimmed.startsWith('INT.') || selTrimmed.startsWith('EXT.')) {
          context.current_element = 'scene_heading';
        } else if (characterPattern.test(selTrimmed)) {
          context.current_element = 'character';
        } else if (selTrimmed.startsWith('(') && selTrimmed.endsWith(')')) {
          context.current_element = 'parenthetical';
        } else {
          context.current_element = 'action';
        }
      }
    });

    return context;
  }, []);

  return { getContext };
}

export default useScriptContext;
