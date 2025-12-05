/**
 * FocusModePlugin — Distraction-free writing experience
 * 
 * WHAT IT SHOULD DO:
 * - Dim all paragraphs EXCEPT the one you're currently typing in
 * - The current paragraph stays at full brightness
 * - Adjacent paragraphs are slightly dimmed
 * - Other paragraphs are heavily dimmed
 * 
 * This creates a "spotlight" effect that helps writers focus on
 * the current moment without distractions.
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection, 
  SELECTION_CHANGE_COMMAND, 
  COMMAND_PRIORITY_LOW 
} from 'lexical';

interface FocusModePluginProps {
  enabled: boolean;
}

// Focus Mode CSS - injected when enabled
const FOCUS_MODE_STYLES = `
/* ============================================
   FOCUS MODE - Paragraph Spotlight Effect
   ============================================ */

/* All paragraphs in the editor start dimmed */
body.focus-mode-enabled [contenteditable="true"] > * {
  opacity: 0.2;
  transition: opacity 0.25s ease-out;
}

/* The currently focused paragraph is fully visible */
body.focus-mode-enabled [contenteditable="true"] > .fm-focused {
  opacity: 1 !important;
}

/* Adjacent paragraphs (prev/next) are partially visible */
body.focus-mode-enabled [contenteditable="true"] > .fm-adjacent {
  opacity: 0.5 !important;
}

/* Optional: Subtle darkening of everything outside editor */
body.focus-mode-enabled .script-editor-wrapper::before {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 0;
}

/* Keep the editor paper itself bright */
body.focus-mode-enabled .script-editor-wrapper .editor-paper {
  position: relative;
  z-index: 1;
}
`;

export default function FocusModePlugin({ enabled }: FocusModePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  // Apply focus classes to DOM elements
  const updateFocusClasses = useCallback((focusedKey: string | null) => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // Clear all existing focus classes
    rootElement.querySelectorAll('.fm-focused, .fm-adjacent').forEach(el => {
      el.classList.remove('fm-focused', 'fm-adjacent');
    });

    if (!focusedKey) return;

    // Get the focused element
    const focusedElement = editor.getElementByKey(focusedKey);
    if (!focusedElement) return;

    // Mark as focused
    focusedElement.classList.add('fm-focused');

    // Mark adjacent elements
    const prevSibling = focusedElement.previousElementSibling;
    const nextSibling = focusedElement.nextElementSibling;
    
    if (prevSibling && prevSibling.getAttribute('data-lexical-node')) {
      prevSibling.classList.add('fm-adjacent');
    }
    if (nextSibling && nextSibling.getAttribute('data-lexical-node')) {
      nextSibling.classList.add('fm-adjacent');
    }
  }, [editor]);

  // Inject/remove styles
  useEffect(() => {
    const STYLE_ID = 'focus-mode-css';
    
    if (enabled) {
      // Add styles if not present
      if (!document.getElementById(STYLE_ID)) {
        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = FOCUS_MODE_STYLES;
        document.head.appendChild(styleEl);
      }
      // Add body class
      document.body.classList.add('focus-mode-enabled');
      console.log('[FocusMode] ✅ Enabled');
    } else {
      // Remove body class
      document.body.classList.remove('focus-mode-enabled');
      // Remove styles
      const styleEl = document.getElementById(STYLE_ID);
      if (styleEl) styleEl.remove();
      // Clear all focus classes
      updateFocusClasses(null);
      console.log('[FocusMode] ❌ Disabled');
    }

    return () => {
      document.body.classList.remove('focus-mode-enabled');
      const styleEl = document.getElementById(STYLE_ID);
      if (styleEl) styleEl.remove();
    };
  }, [enabled, updateFocusClasses]);

  // Track selection changes
  useEffect(() => {
    if (!enabled) return;

    const unregister = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const topLevel = node.getTopLevelElement();
            
            if (topLevel) {
              const key = topLevel.getKey();
              if (key !== currentKey) {
                setCurrentKey(key);
                // Defer DOM update
                requestAnimationFrame(() => {
                  updateFocusClasses(key);
                });
              }
            }
          }
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return unregister;
  }, [editor, enabled, currentKey, updateFocusClasses]);

  return null;
}

/**
 * Hook to manage focus mode state
 */
export function useFocusMode() {
  const [isActive, setIsActive] = useState(false);

  const toggle = () => setIsActive(prev => !prev);
  const enable = () => setIsActive(true);
  const disable = () => setIsActive(false);

  return {
    isActive,
    toggle,
    enable,
    disable,
    setIsActive,
  };
}
