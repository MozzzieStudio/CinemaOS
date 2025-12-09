
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand, 
  LexicalCommand, $getNodeByKey, $createTextNode 
} from "lexical";
import { useEffect } from "react";
import { $isDialogueNode } from "../nodes/ScriptNodes";
import { toast } from "sonner";

export const ADD_ALT_DIALOGUE_COMMAND: LexicalCommand<void> = createCommand("ADD_ALT_DIALOGUE_COMMAND");
export const CYCLE_ALT_DIALOGUE_COMMAND: LexicalCommand<void> = createCommand("CYCLE_ALT_DIALOGUE_COMMAND");

export default function AlternativeDialoguePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      ADD_ALT_DIALOGUE_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode().getTopLevelElement();
            if ($isDialogueNode(node)) {
              // We need to prompt the user for the alternative text.
              // Since we're inside a Lexical update, we can't show a React modal easily from here without state.
              // Instead, we will dispatch a custom event to the window to open a specialized prompt, 
              // receiving the node key.
              window.dispatchEvent(new CustomEvent('open-alt-dialogue-prompt', { 
                detail: { nodeKey: node.getKey(), currentText: node.getTextContent() } 
              }));
            } else {
              toast.error("Selection is not a Dialogue line.");
            }
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CYCLE_ALT_DIALOGUE_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode().getTopLevelElement();
            if ($isDialogueNode(node)) {
              const alts = node.getAlts();
              if (alts.length === 0) return;

              let currentIndex = node.getActiveAltIndex();
              let nextIndex = (currentIndex + 1) % alts.length;
              node.setActiveAltIndex(nextIndex);
              
              // Update the actual text content
              const newText = alts[nextIndex];
              node.clear();
              node.append($createTextNode(newText));
              node.selectEnd();
              
              toast.info(`Alt ${nextIndex + 1}/${alts.length}`);
            }
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  
  // Listen for the actual "Add Alt" submission from the UI
  useEffect(() => {
    const handleAddAlt = (e: CustomEvent) => {
      const { nodeKey, text } = e.detail;
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isDialogueNode(node)) {
            node.addAlt(text);
            // The node update automatically sets active index to new one,
            // but we need to update the text content in the editor to match.
            node.clear();
            node.append($createTextNode(text));
            node.selectEnd();
            toast.success("Alternative dialogue added");
        }
      });
    };
    
    window.addEventListener('submit-alt-dialogue', handleAddAlt as EventListener);
    return () => window.removeEventListener('submit-alt-dialogue', handleAddAlt as EventListener);
  }, [editor]);

  return null;
}
