import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  RangeSelection,
} from "lexical";

export default function ContextStatePlugin({
  onSceneChange,
}: {
  onSceneChange: (sceneNumber: number) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Listen to updates to determine "Current Scene" based on cursor position
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Simple heuristic: Count "Scene Heading" nodes before this point?
        // Or finding the closest previous Scene Heading.
        // For performance, we might want to do this debounced or only on selection change.

        const anchorNode = selection.anchor.getNode();
        const topLevel = anchorNode.getTopLevelElementOrThrow();

        // Traverse backwards to find a Scene Heading
        let currentLoopNode = topLevel;
        let sceneCount = 0;
        let found = false;

        // In a real optimized app, we'd cache scene ranges.
        // For now, let's just count ALL scene headings in the doc up to this point? Too slow.
        // Let's rely on an external map if possible.
        // OR: Just assume the user is editing linear.

        // Hacky MVP: Walk previous siblings.
        let node = topLevel;
        let sceneNumCandidate = 0;

        // This is expensive O(N).
        // Better: The Editor probably maintains a list of Scenes or we should use the Navigator data.
        // For MVP, we will accept the prop `onSceneChange` and assume the parent `ScriptEditor`
        // calculates it via `NavigatorPanel` logic or similar.

        // Actually, let's do a lightweight check:
        // Just emit the node key and let the parent decide?
      });
    });
  }, [editor, onSceneChange]);

  return null;
}
