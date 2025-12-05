/**
 * TypewriterScrollPlugin — Keep current line centered like a typewriter
 * 
 * Based on Final Draft's Typewriter Mode that creates a zen-like writing experience
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';

interface TypewriterScrollPluginProps {
  enabled: boolean;
}

export default function TypewriterScrollPlugin({ enabled }: TypewriterScrollPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const element = editor.getElementByKey(anchorNode.getKey());
            
            if (element) {
              // Smooth scroll to keep line centered
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
              });
            }
          }
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, enabled]);

  return null;
}
