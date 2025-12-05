/**
 * FormatToolbar — Format buttons that actually work
 * 
 * Click to convert current line to that element type
 */

import { useCallback } from 'react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $createTextNode } from 'lexical';
import {
  $createSceneHeadingNode,
  $createActionNode,
  $createCharacterNode,
  $createDialogueNode,
  $createParentheticalNode,
  $createTransitionNode,
} from './nodes/ScriptNodes';

interface FormatButtonProps {
  id: string;
  label: string;
  icon: string;
  shortcut: string;
  isActive: boolean;
  onClick: () => void;
}

function FormatButton({ label, icon, shortcut, isActive, onClick }: FormatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
          : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/95 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
        <span className="text-white">{label}</span>
        <span className="text-white/40 ml-2">{shortcut}</span>
      </div>
    </button>
  );
}

interface FormatToolbarProps {
  activeFormat: string;
  onFormatChange: (format: string) => void;
}

export default function FormatToolbar({ activeFormat, onFormatChange }: FormatToolbarProps) {
  const [editor] = useLexicalComposerContext();

  const applyFormat = useCallback((format: string, nodeCreator: () => any) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const topLevelNode = anchorNode.getTopLevelElement();
        
        if (topLevelNode) {
          const text = topLevelNode.getTextContent();
          const newNode = nodeCreator();
          
          // Replace the current node
          topLevelNode.replace(newNode);
          
          // If there was text, add it to the new node
          if (text.trim()) {
            const textNode = $createTextNode(text);
            newNode.append(textNode);
          }
          
          // Select the new node
          newNode.selectEnd();
        }
      }
    });
    onFormatChange(format);
  }, [editor, onFormatChange]);

  const formats = [
    { id: 'scene', label: 'Scene', icon: '🎬', shortcut: 'Ctrl+1', creator: $createSceneHeadingNode },
    { id: 'action', label: 'Action', icon: '📝', shortcut: 'Ctrl+2', creator: $createActionNode },
    { id: 'character', label: 'Character', icon: '👤', shortcut: 'Ctrl+3', creator: $createCharacterNode },
    { id: 'dialogue', label: 'Dialogue', icon: '💬', shortcut: 'Ctrl+4', creator: $createDialogueNode },
    { id: 'parenthetical', label: 'Paren', icon: '🎭', shortcut: 'Ctrl+5', creator: $createParentheticalNode },
    { id: 'transition', label: 'Trans', icon: '➡️', shortcut: 'Ctrl+6', creator: $createTransitionNode },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {formats.map((format) => (
        <FormatButton
          key={format.id}
          id={format.id}
          label={format.label}
          icon={format.icon}
          shortcut={format.shortcut}
          isActive={activeFormat.toLowerCase() === format.label.toLowerCase()}
          onClick={() => applyFormat(format.label, format.creator)}
        />
      ))}
    </div>
  );
}
