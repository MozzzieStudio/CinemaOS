import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EditorState } from "lexical";

// Debounce helper
function debounce(func: Function, wait: number) {
  let timeout: any;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function AutoSavePlugin({
  projectId,
  scriptId,
}: {
  projectId: string;
  scriptId?: string;
}) {
  useLexicalComposerContext();

  const saveScript = useCallback(
    debounce(async (editorState: EditorState) => {
      const content = JSON.stringify(editorState.toJSON());
      
      try {
        console.log("Saving script...");
        
        // Check if running in Tauri context
        if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
          await invoke("save_script", {
            script: {
              id: scriptId ? { tb: "script", id: { String: scriptId } } : undefined,
              project_id: { tb: "project", id: { String: projectId } },
              title: "Untitled Script",
              content,
              version: 1,
            },
          });
          console.log("Script saved!");
        } else {
          console.log("[Browser Mode] Script save simulated:", { scriptId, contentLength: content.length });
        }
      } catch (error) {
        console.error("Failed to save script:", error);
      }
    }, 1000),
    [projectId, scriptId]
  );

  return <OnChangePlugin onChange={saveScript} />;
}
