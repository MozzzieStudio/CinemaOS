import { create } from 'zustand';

interface EditorState {
  // Navigation & Views
  isNavigatorOpen: boolean;
  isBeatBoardOpen: boolean;
  isIndexCardsOpen: boolean;
  isAnalysisOpen: boolean;
  isSidebarOpen: boolean;

  // Dialogs
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
  
  // New Features
  isRevisionPanelOpen: boolean;
  isWritingStatsOpen: boolean;
  isScriptCompareOpen: boolean;
  isSceneLockPanelOpen: boolean;
  isSpeakingModeOpen: boolean;
  isVersionHistoryOpen: boolean;
  isAltDialogueOpen: boolean;
  
  // Feature Flags / Toggles
  isFocusModeActive: boolean;
  isTypewriterEnabled: boolean;
  
  // Data for Dialogs
  altDialogueData: { nodeKey: string | null; currentText: string };
  notePopoverElementKey: string | null;

  // Actions
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
  
  setRevisionPanelOpen: (open: boolean) => void;
  setWritingStatsOpen: (open: boolean) => void;
  setScriptCompareOpen: (open: boolean) => void;
  setSceneLockPanelOpen: (open: boolean) => void;
  setSpeakingModeOpen: (open: boolean) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setAltDialogueOpen: (open: boolean) => void;
  
  setFocusModeActive: (active: boolean) => void;
  setTypewriterEnabled: (enabled: boolean) => void;
  
  setAltDialogueData: (data: { nodeKey: string | null; currentText: string }) => void;
  setNotePopoverElementKey: (key: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial State
  isNavigatorOpen: false,
  isBeatBoardOpen: false,
  isIndexCardsOpen: false,
  isAnalysisOpen: false,
  isSidebarOpen: false,

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

  isRevisionPanelOpen: false,
  isWritingStatsOpen: false,
  isScriptCompareOpen: false,
  isSceneLockPanelOpen: false,
  isSpeakingModeOpen: false,
  isVersionHistoryOpen: false,
  isAltDialogueOpen: false,

  isFocusModeActive: false,
  isTypewriterEnabled: false,

  altDialogueData: { nodeKey: null, currentText: '' },
  notePopoverElementKey: null,

  // Actions implementation
  toggleNavigator: () => set((state) => ({ isNavigatorOpen: !state.isNavigatorOpen })),
  setNavigatorOpen: (open) => set({ isNavigatorOpen: open }),
  
  toggleBeatBoard: () => set((state) => ({ isBeatBoardOpen: !state.isBeatBoardOpen })),
  setBeatBoardOpen: (open) => set({ isBeatBoardOpen: open }),
  
  toggleIndexCards: () => set((state) => ({ isIndexCardsOpen: !state.isIndexCardsOpen })),
  setIndexCardsOpen: (open) => set({ isIndexCardsOpen: open }),
  
  toggleAnalysis: () => set((state) => ({ isAnalysisOpen: !state.isAnalysisOpen })),
  setAnalysisOpen: (open) => set({ isAnalysisOpen: open }),
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  setExportOpen: (open) => set({ isExportOpen: open }),
  setKeyboardShortcutsOpen: (open) => set({ isKeyboardShortcutsOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setPreferencesOpen: (open) => set({ isPreferencesOpen: open }),
  setGoToOpen: (open) => set({ isGoToOpen: open }),
  setTitlePageOpen: (open) => set({ isTitlePageOpen: open }),
  setCharRenameOpen: (open) => set({ isCharRenameOpen: open }),
  setReportsOpen: (open) => set({ isReportsOpen: open }),
  setThesaurusOpen: (open) => set({ isThesaurusOpen: open }),
  setBookmarksOpen: (open) => set((state) => ({ isBookmarksOpen: typeof open === 'function' ? open(state.isBookmarksOpen) : open })),
  setFindReplaceOpen: (open) => set({ isFindReplaceOpen: open }),

  setRevisionPanelOpen: (open) => set({ isRevisionPanelOpen: open }),
  setWritingStatsOpen: (open) => set({ isWritingStatsOpen: open }),
  setScriptCompareOpen: (open) => set({ isScriptCompareOpen: open }),
  setSceneLockPanelOpen: (open) => set({ isSceneLockPanelOpen: open }),
  setSpeakingModeOpen: (open) => set({ isSpeakingModeOpen: open }),
  setVersionHistoryOpen: (open) => set({ isVersionHistoryOpen: open }),
  setAltDialogueOpen: (open) => set({ isAltDialogueOpen: open }),

  setFocusModeActive: (active) => set({ isFocusModeActive: active }),
  setTypewriterEnabled: (enabled) => set({ isTypewriterEnabled: enabled }),

  setAltDialogueData: (data) => set({ altDialogueData: data }),
  setNotePopoverElementKey: (key) => set({ notePopoverElementKey: key }),
}));
