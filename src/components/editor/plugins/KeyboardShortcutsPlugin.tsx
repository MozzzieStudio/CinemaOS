/**
 * KeyboardShortcutsPlugin — Professional screenplay shortcuts
 * 
 * Final Draft-compatible shortcuts:
 * - Ctrl+1: Scene Heading
 * - Ctrl+2: Action
 * - Ctrl+3: Character
 * - Ctrl+4: Dialogue
 * - Ctrl+5: Parenthetical
 * - Ctrl+6: Transition
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  ParagraphNode,
} from "lexical";
import { useEffect } from "react";
import {
  $createSceneHeadingNode,
  $createActionNode,
  $createCharacterNode,
  $createDialogueNode,
  $createParentheticalNode,
} from "../nodes/ScriptNodes";

type FormatKey = '1' | '2' | '3' | '4' | '5' | '6';

// Use ParagraphNode as base type since all script nodes extend it
const FORMAT_MAP: Record<FormatKey, () => ParagraphNode> = {
  '1': $createSceneHeadingNode,
  '2': $createActionNode,
  '3': $createCharacterNode,
  '4': $createDialogueNode,
  '5': $createParentheticalNode,
  '6': $createActionNode, // Transition (handled as right-aligned action)
};

const FORMAT_NAMES: Record<FormatKey, string> = {
  '1': 'Scene Heading',
  '2': 'Action',
  '3': 'Character',
  '4': 'Dialogue',
  '5': 'Parenthetical',
  '6': 'Transition',
};

interface ShortcutsPluginProps {
  onFormatChange?: (format: string) => void;
}

export default function KeyboardShortcutsPlugin({ onFormatChange }: ShortcutsPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        // Check for Ctrl+Number
        if (event.ctrlKey && !event.shiftKey && !event.altKey) {
          const key = event.key as FormatKey;
          
          if (key >= '1' && key <= '6') {
            event.preventDefault();
            
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return false;

            const anchorNode = selection.anchor.getNode();
            const topNode = anchorNode.getTopLevelElement();
            
            if (!topNode) return false;

            // Create new node of the selected type
            const createNode = FORMAT_MAP[key];
            if (!createNode) return false;

            const newNode = createNode();
            
            // Transfer content to new node
            topNode.getChildren().forEach(child => {
              newNode.append(child);
            });
            
            // Handle transition (right-aligned)
            if (key === '6') {
              newNode.setFormat('right');
            }
            
            topNode.replace(newNode);
            newNode.selectEnd();
            
            // Notify parent of format change
            onFormatChange?.(FORMAT_NAMES[key]);
            
            return true;
          }
        }
        
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return removeListener;
  }, [editor, onFormatChange]);

  return null;
}
