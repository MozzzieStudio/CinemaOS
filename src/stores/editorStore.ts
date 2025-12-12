/**
 * CinemaOS Store
 * 
 * Zustand v5 with best practices:
 * - Slices pattern for modular state
 * - Persist middleware for session persistence
 * - Devtools for debugging
 * - Immer for immutable updates
 * - Selector hooks to avoid re-renders
 */

import { create, StateCreator } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ═══════════════════════════════════════════════════════════════════════════════
// SLICE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface NavigationSlice {
  isNavigatorOpen: boolean;
  isBeatBoardOpen: boolean;
  isIndexCardsOpen: boolean;
  isAnalysisOpen: boolean;
  isSidebarOpen: boolean;
  
  toggleNavigator: () => void;
  setNavigatorOpen: (open: boolean) => void;
  toggleBeatBoard: () => void;
  setBeatBoardOpen: (open: boolean) => void;
  toggleIndexCards: () => void;
  setIndexCardsOpen: (open: boolean) => void;
  toggleAnalysis: () => void;
  setAnalysisOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

interface DialogSlice {
  isExportOpen: boolean;
  isKeyboardShortcutsOpen: boolean;
  isCommandPaletteOpen: boolean;
  isPreferencesOpen: boolean;
  isGoToOpen: boolean;
  isTitlePageOpen: boolean;
  isCharRenameOpen: boolean;
  isReportsOpen: boolean;
  isThesaurusOpen: boolean;
  isBookmarksOpen: boolean;
  isFindReplaceOpen: boolean;
  
  setExportOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setPreferencesOpen: (open: boolean) => void;
  setGoToOpen: (open: boolean) => void;
  setTitlePageOpen: (open: boolean) => void;
  setCharRenameOpen: (open: boolean) => void;
  setReportsOpen: (open: boolean) => void;
  setThesaurusOpen: (open: boolean) => void;
  setBookmarksOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setFindReplaceOpen: (open: boolean) => void;
  closeAllDialogs: () => void;
}

interface FeatureSlice {
  isRevisionPanelOpen: boolean;
  isWritingStatsOpen: boolean;
  isScriptCompareOpen: boolean;
  isSceneLockPanelOpen: boolean;
  isSpeakingModeOpen: boolean;
  isVersionHistoryOpen: boolean;
  isAltDialogueOpen: boolean;
  isFocusModeActive: boolean;
  isTypewriterEnabled: boolean;
  
  setRevisionPanelOpen: (open: boolean) => void;
  setWritingStatsOpen: (open: boolean) => void;
  setScriptCompareOpen: (open: boolean) => void;
  setSceneLockPanelOpen: (open: boolean) => void;
  setSpeakingModeOpen: (open: boolean) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setAltDialogueOpen: (open: boolean) => void;
  setFocusModeActive: (active: boolean) => void;
  setTypewriterEnabled: (enabled: boolean) => void;
}

interface DataSlice {
  altDialogueData: { nodeKey: string | null; currentText: string };
  notePopoverElementKey: string | null;
  
  setAltDialogueData: (data: { nodeKey: string | null; currentText: string }) => void;
  setNotePopoverElementKey: (key: string | null) => void;
}

// Combined store type
type EditorStore = NavigationSlice & DialogSlice & FeatureSlice & DataSlice;

// ═══════════════════════════════════════════════════════════════════════════════
// SLICE IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const createNavigationSlice: StateCreator<
  EditorStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  NavigationSlice
> = (set) => ({
  isNavigatorOpen: false,
  isBeatBoardOpen: false,
  isIndexCardsOpen: false,
  isAnalysisOpen: false,
  isSidebarOpen: false,

  toggleNavigator: () => set((state) => { state.isNavigatorOpen = !state.isNavigatorOpen; }, false, 'nav/toggleNavigator'),
  setNavigatorOpen: (open) => set((state) => { state.isNavigatorOpen = open; }, false, 'nav/setNavigatorOpen'),
  toggleBeatBoard: () => set((state) => { state.isBeatBoardOpen = !state.isBeatBoardOpen; }, false, 'nav/toggleBeatBoard'),
  setBeatBoardOpen: (open) => set((state) => { state.isBeatBoardOpen = open; }, false, 'nav/setBeatBoardOpen'),
  toggleIndexCards: () => set((state) => { state.isIndexCardsOpen = !state.isIndexCardsOpen; }, false, 'nav/toggleIndexCards'),
  setIndexCardsOpen: (open) => set((state) => { state.isIndexCardsOpen = open; }, false, 'nav/setIndexCardsOpen'),
  toggleAnalysis: () => set((state) => { state.isAnalysisOpen = !state.isAnalysisOpen; }, false, 'nav/toggleAnalysis'),
  setAnalysisOpen: (open) => set((state) => { state.isAnalysisOpen = open; }, false, 'nav/setAnalysisOpen'),
  toggleSidebar: () => set((state) => { state.isSidebarOpen = !state.isSidebarOpen; }, false, 'nav/toggleSidebar'),
  setSidebarOpen: (open) => set((state) => { state.isSidebarOpen = open; }, false, 'nav/setSidebarOpen'),
});

const createDialogSlice: StateCreator<
  EditorStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  DialogSlice
> = (set) => ({
  isExportOpen: false,
  isKeyboardShortcutsOpen: false,
  isCommandPaletteOpen: false,
  isPreferencesOpen: false,
  isGoToOpen: false,
  isTitlePageOpen: false,
  isCharRenameOpen: false,
  isReportsOpen: false,
  isThesaurusOpen: false,
  isBookmarksOpen: false,
  isFindReplaceOpen: false,

  setExportOpen: (open) => set((state) => { state.isExportOpen = open; }, false, 'dialog/setExportOpen'),
  setKeyboardShortcutsOpen: (open) => set((state) => { state.isKeyboardShortcutsOpen = open; }, false, 'dialog/setKeyboardShortcutsOpen'),
  setCommandPaletteOpen: (open) => set((state) => { state.isCommandPaletteOpen = open; }, false, 'dialog/setCommandPaletteOpen'),
  setPreferencesOpen: (open) => set((state) => { state.isPreferencesOpen = open; }, false, 'dialog/setPreferencesOpen'),
  setGoToOpen: (open) => set((state) => { state.isGoToOpen = open; }, false, 'dialog/setGoToOpen'),
  setTitlePageOpen: (open) => set((state) => { state.isTitlePageOpen = open; }, false, 'dialog/setTitlePageOpen'),
  setCharRenameOpen: (open) => set((state) => { state.isCharRenameOpen = open; }, false, 'dialog/setCharRenameOpen'),
  setReportsOpen: (open) => set((state) => { state.isReportsOpen = open; }, false, 'dialog/setReportsOpen'),
  setThesaurusOpen: (open) => set((state) => { state.isThesaurusOpen = open; }, false, 'dialog/setThesaurusOpen'),
  setBookmarksOpen: (open) => set((state) => { 
    state.isBookmarksOpen = typeof open === 'function' ? open(state.isBookmarksOpen) : open; 
  }, false, 'dialog/setBookmarksOpen'),
  setFindReplaceOpen: (open) => set((state) => { state.isFindReplaceOpen = open; }, false, 'dialog/setFindReplaceOpen'),
  
  closeAllDialogs: () => set((state) => {
    state.isExportOpen = false;
    state.isKeyboardShortcutsOpen = false;
    state.isCommandPaletteOpen = false;
    state.isPreferencesOpen = false;
    state.isGoToOpen = false;
    state.isTitlePageOpen = false;
    state.isCharRenameOpen = false;
    state.isReportsOpen = false;
    state.isThesaurusOpen = false;
    state.isBookmarksOpen = false;
    state.isFindReplaceOpen = false;
  }, false, 'dialog/closeAllDialogs'),
});

const createFeatureSlice: StateCreator<
  EditorStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  FeatureSlice
> = (set) => ({
  isRevisionPanelOpen: false,
  isWritingStatsOpen: false,
  isScriptCompareOpen: false,
  isSceneLockPanelOpen: false,
  isSpeakingModeOpen: false,
  isVersionHistoryOpen: false,
  isAltDialogueOpen: false,
  isFocusModeActive: false,
  isTypewriterEnabled: false,

  setRevisionPanelOpen: (open) => set((state) => { state.isRevisionPanelOpen = open; }, false, 'feature/setRevisionPanelOpen'),
  setWritingStatsOpen: (open) => set((state) => { state.isWritingStatsOpen = open; }, false, 'feature/setWritingStatsOpen'),
  setScriptCompareOpen: (open) => set((state) => { state.isScriptCompareOpen = open; }, false, 'feature/setScriptCompareOpen'),
  setSceneLockPanelOpen: (open) => set((state) => { state.isSceneLockPanelOpen = open; }, false, 'feature/setSceneLockPanelOpen'),
  setSpeakingModeOpen: (open) => set((state) => { state.isSpeakingModeOpen = open; }, false, 'feature/setSpeakingModeOpen'),
  setVersionHistoryOpen: (open) => set((state) => { state.isVersionHistoryOpen = open; }, false, 'feature/setVersionHistoryOpen'),
  setAltDialogueOpen: (open) => set((state) => { state.isAltDialogueOpen = open; }, false, 'feature/setAltDialogueOpen'),
  setFocusModeActive: (active) => set((state) => { state.isFocusModeActive = active; }, false, 'feature/setFocusModeActive'),
  setTypewriterEnabled: (enabled) => set((state) => { state.isTypewriterEnabled = enabled; }, false, 'feature/setTypewriterEnabled'),
});

const createDataSlice: StateCreator<
  EditorStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  DataSlice
> = (set) => ({
  altDialogueData: { nodeKey: null, currentText: '' },
  notePopoverElementKey: null,

  setAltDialogueData: (data) => set((state) => { state.altDialogueData = data; }, false, 'data/setAltDialogueData'),
  setNotePopoverElementKey: (key) => set((state) => { state.notePopoverElementKey = key; }, false, 'data/setNotePopoverElementKey'),
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMBINED STORE WITH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    devtools(
      immer(
        persist(
          (...args) => ({
            ...createNavigationSlice(...args),
            ...createDialogSlice(...args),
            ...createFeatureSlice(...args),
            ...createDataSlice(...args),
          }),
          {
            name: 'cinema-os-editor',
            partialize: (state) => ({
              // Only persist user preferences, not transient dialog state
              isFocusModeActive: state.isFocusModeActive,
              isTypewriterEnabled: state.isTypewriterEnabled,
              isSidebarOpen: state.isSidebarOpen,
            }),
          }
        )
      ),
      { name: 'CinemaOS Editor', enabled: import.meta.env.DEV }
    )
  )
);

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTOR HOOKS (avoid re-renders)
// ═══════════════════════════════════════════════════════════════════════════════

// Navigation selectors
export const useIsNavigatorOpen = () => useEditorStore((s) => s.isNavigatorOpen);
export const useIsBeatBoardOpen = () => useEditorStore((s) => s.isBeatBoardOpen);
export const useIsIndexCardsOpen = () => useEditorStore((s) => s.isIndexCardsOpen);
export const useIsAnalysisOpen = () => useEditorStore((s) => s.isAnalysisOpen);
export const useIsSidebarOpen = () => useEditorStore((s) => s.isSidebarOpen);

// Dialog selectors
export const useIsExportOpen = () => useEditorStore((s) => s.isExportOpen);
export const useIsCommandPaletteOpen = () => useEditorStore((s) => s.isCommandPaletteOpen);
export const useIsPreferencesOpen = () => useEditorStore((s) => s.isPreferencesOpen);
export const useIsFindReplaceOpen = () => useEditorStore((s) => s.isFindReplaceOpen);

// Feature selectors
export const useIsFocusModeActive = () => useEditorStore((s) => s.isFocusModeActive);
export const useIsTypewriterEnabled = () => useEditorStore((s) => s.isTypewriterEnabled);
export const useIsSpeakingModeOpen = () => useEditorStore((s) => s.isSpeakingModeOpen);

// Action selectors (these never change, so they're stable)
export const useEditorActions = () => useEditorStore((s) => ({
  toggleNavigator: s.toggleNavigator,
  toggleSidebar: s.toggleSidebar,
  setCommandPaletteOpen: s.setCommandPaletteOpen,
  setExportOpen: s.setExportOpen,
  closeAllDialogs: s.closeAllDialogs,
}));

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe to focus mode changes (useful for CSS transitions)
 */
export function subscribeToFocusMode(callback: (active: boolean) => void) {
  return useEditorStore.subscribe(
    (state) => state.isFocusModeActive,
    callback,
    { equalityFn: Object.is }
  );
}

/**
 * Subscribe to sidebar changes
 */
export function subscribeToSidebar(callback: (open: boolean) => void) {
  return useEditorStore.subscribe(
    (state) => state.isSidebarOpen,
    callback,
    { equalityFn: Object.is }
  );
}
