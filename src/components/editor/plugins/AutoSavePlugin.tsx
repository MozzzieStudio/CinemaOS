import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EditorState } from "lexical";

// Debounce helper for backend saves only
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
  const [editor] = useLexicalComposerContext();
  const lastSavedRef = useRef<string>('');

  // Save to localStorage immediately (fast) - this is used by Extract from Script
  const saveToLocalStorage = useCallback((editorState: EditorState) => {
    const content = JSON.stringify(editorState.toJSON());
    const storageKey = `cinema-os-script-${projectId}`;
    localStorage.setItem(storageKey, content);
    lastSavedRef.current = content;
    console.log("[AutoSave] Saved to localStorage:", { contentLength: content.length });
  }, [projectId]);

  // Save to Tauri backend (debounced for performance)
  const saveToBackend = useCallback(
    debounce(async (editorState: EditorState) => {
      const content = JSON.stringify(editorState.toJSON());
      
      // Only save to backend in Tauri context
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        try {
          await invoke("save_script", {
            script: {
              id: scriptId ? { tb: "script", id: { String: scriptId } } : undefined,
              project_id: { tb: "project", id: { String: projectId } },
              title: "Untitled Script",
              content,
              version: 1,
            },
          });
          console.log("[AutoSave] Saved to Tauri backend!");
        } catch (error) {
          console.error("[AutoSave] Failed to save to backend:", error);
        }
      }
    }, 2000),
    [projectId, scriptId]
  );

  // Combined save function
  const handleChange = useCallback((editorState: EditorState) => {
    // Always save to localStorage immediately (for Extract from Script)
    saveToLocalStorage(editorState);
    // Debounce backend saves
    saveToBackend(editorState);
  }, [saveToLocalStorage, saveToBackend]);

  // Save on unmount (when user switches modes)
  useEffect(() => {
    return () => {
      console.log("[AutoSave] Component unmounting - ensuring data is saved");
      // Final save to localStorage on unmount
      editor.getEditorState().read(() => {
        const content = JSON.stringify(editor.getEditorState().toJSON());
        const storageKey = `cinema-os-script-${projectId}`;
        localStorage.setItem(storageKey, content);
        console.log("[AutoSave] Final save on unmount complete");
      });
    };
  }, [editor, projectId]);

  return <OnChangePlugin onChange={handleChange} />;
}
