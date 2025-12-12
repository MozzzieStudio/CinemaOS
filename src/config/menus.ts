import { toast } from "sonner";
import { useEditorStore } from "../stores/editorStore";

export interface MenuItem {
  label?: string;
  id?: string;
  icon?: any;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
}

export interface Menu {
  id: string;
  label: string;
  items: MenuItem[];
}

export const createMenus = (
    dispatchCommand: (type: string, payload?: any) => void,
    pluginConfig: {
        sceneNumbers: { enabled: boolean; toggle: () => void };
        moresContinueds: { enabled: boolean; toggle: () => void };
    }
): Menu[] => {
  const store = useEditorStore.getState();

  return [
    {
      id: 'file', label: 'File',
      items: [
        { label: 'New Script', shortcut: 'Ctrl+N', action: () => {
          if(confirm('Create new script? Unsaved changes will be lost.')) {
             dispatchCommand('NEW_SCRIPT');
          }
        }},
        { label: 'Open...', shortcut: 'Ctrl+O', action: () => document.getElementById('file-open')?.click() },
        { divider: true },
        { label: 'Save', shortcut: 'Ctrl+S', action: () => {
            dispatchCommand('SAVE');
            toast.success("Script Saved");
        }},
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => dispatchCommand('SAVE_AS') },
        { divider: true },
        { label: 'Import FDX...', action: () => dispatchCommand('EXPORT_FDX') }, 
        { label: 'Import PDF...', action: () => dispatchCommand('EXPORT_PDF') }, 
        { label: 'Import Fountain...', action: () => dispatchCommand('EXPORT_FDX') }, 
        { divider: true },
        { label: 'Export FDX...', action: () => dispatchCommand('EXPORT_FDX') },
        { label: 'Export PDF...', action: () => dispatchCommand('EXPORT_PDF') },
        { divider: true },
        { label: 'Print...', shortcut: 'Ctrl+P', action: () => window.print() },
      ]
    },
    {
      id: 'edit', label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: () => dispatchCommand('UNDO') },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: () => dispatchCommand('REDO') },
        { divider: true },
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => dispatchCommand('CUT') },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => dispatchCommand('COPY') },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => dispatchCommand('PASTE') },
        { divider: true },
        { label: 'Find & Replace...', shortcut: 'Ctrl+F', action: () => dispatchCommand('FIND') },
        { label: 'Go To...', shortcut: 'Ctrl+G', action: () => dispatchCommand('GO_TO') },
        { divider: true },
        { label: 'Insert Page Break', shortcut: 'Ctrl+Enter', action: () => dispatchCommand('PAGE_BREAK') },
      ]
    },
    {
      id: 'view', label: 'View',
      items: [
        { label: 'Navigator', shortcut: 'F2', action: () => store.toggleNavigator() },
        { label: 'Beat Board', action: () => store.setBeatBoardOpen(true) },
        { label: 'Index Cards', action: () => store.setIndexCardsOpen(true) },
        { divider: true },
        { label: 'Focus Mode', shortcut: 'F11', action: () => store.setFocusModeActive(!store.isFocusModeActive) },
        { label: store.isTypewriterEnabled ? '✓ Typewriter Mode' : 'Typewriter Mode', action: () => store.setTypewriterEnabled(!store.isTypewriterEnabled) },
        { divider: true },
        { label: 'Track Changes', action: () => store.setRevisionPanelOpen(!store.isRevisionPanelOpen) },
        { label: 'Writing Stats', action: () => store.setWritingStatsOpen(!store.isWritingStatsOpen) },
        { divider: true },
        { label: 'AI Analysis', action: () => store.toggleAnalysis() },
        { divider: true },
        { label: 'Full Screen', action: () => document.documentElement.requestFullscreen?.() },
      ]
    },
    {
      id: 'format', label: 'Format',
      items: [
        { label: 'Scene Heading', shortcut: 'Ctrl+1', action: () => dispatchCommand('FORMAT_ELEMENT', 'Scene') },
        { label: 'Action', shortcut: 'Ctrl+2', action: () => dispatchCommand('FORMAT_ELEMENT', 'Action') },
        { label: 'Character', shortcut: 'Ctrl+3', action: () => dispatchCommand('FORMAT_ELEMENT', 'Character') },
        { label: 'Dialogue', shortcut: 'Ctrl+4', action: () => dispatchCommand('FORMAT_ELEMENT', 'Dialogue') },
        { label: 'Parenthetical', shortcut: 'Ctrl+5', action: () => dispatchCommand('FORMAT_ELEMENT', 'Paren') },
        { label: 'Transition', shortcut: 'Ctrl+6', action: () => dispatchCommand('FORMAT_ELEMENT', 'Trans') },
        { divider: true },
        { label: 'Bold', shortcut: 'Ctrl+B', action: () => dispatchCommand('FORMAT_TEXT', 'bold') },
        { label: 'Italic', shortcut: 'Ctrl+I', action: () => dispatchCommand('FORMAT_TEXT', 'italic') },
        { label: 'Underline', shortcut: 'Ctrl+U', action: () => dispatchCommand('FORMAT_TEXT', 'underline') },
      ]
    },
    {
      id: 'insert', label: 'Insert',
      items: [
        { label: 'Title Page', action: () => dispatchCommand('TITLE_PAGE') },
        { label: 'Scene Number', icon: pluginConfig.sceneNumbers.enabled ? '✓' : '', action: () => pluginConfig.sceneNumbers.toggle() },
        { label: 'Bookmark', action: () => dispatchCommand('BOOKMARKS') },
        { label: 'Mores/Continueds', icon: pluginConfig.moresContinueds.enabled ? '✓' : '', action: () => pluginConfig.moresContinueds.toggle() },
        { divider: true },
        { label: 'Act Break...', icon: '🎭', action: () => dispatchCommand('INSERT_ACT_BREAK') },
        { label: 'Page Break', shortcut: 'Ctrl+Enter', action: () => dispatchCommand('PAGE_BREAK') },
      ]
    },
    {
      id: 'production', label: 'Production',
      items: [
        { label: 'Scene Numbers...', icon: pluginConfig.sceneNumbers.enabled ? '✓' : '', action: () => pluginConfig.sceneNumbers.toggle() },
        { label: 'Revision Mode...', action: () => store.setRevisionPanelOpen(true) },
        { divider: true },
        { label: 'Lock Scenes...', icon: '🔒', action: () => dispatchCommand('SCENE_LOCK_PANEL') },
        { label: 'Omit Scene', icon: '⊘', action: () => dispatchCommand('OMIT_SCENE') },
        { divider: true },
        { label: 'Version History...', icon: '📜', shortcut: 'Ctrl+H', action: () => dispatchCommand('VERSION_HISTORY') },
        { divider: true },
        { label: 'Reports', icon: '📊', action: () => dispatchCommand('REPORTS') },
        { label: 'Breakdown Reports...', icon: '🏷️', action: () => dispatchCommand('BREAKDOWN_REPORT') },
      ]
    },
    {
      id: 'tools', label: 'Tools',
      items: [
        { label: 'AI Assistant', icon: '✨', action: () => store.setSidebarOpen(true) },
        { label: 'Generate Scene...', action: () => store.setSidebarOpen(true) },
        { label: 'Improve Dialogue...', action: () => store.setSidebarOpen(true) },
        { divider: true },
        { label: 'Spelling...', shortcut: 'F7', action: () => dispatchCommand('SPELLING') },
        { label: 'Thesaurus...', shortcut: 'Shift+F7', action: () => dispatchCommand('THESAURUS') },
        { divider: true },
        { label: 'Script Reports...', action: () => dispatchCommand('REPORTS') },
        { label: 'Character Rename...', action: () => dispatchCommand('CHARACTER_RENAME') },
        { divider: true },
        { label: 'Bookmarks', shortcut: 'Ctrl+Shift+B', action: () => dispatchCommand('BOOKMARKS') },
        { divider: true },
        { label: 'Preferences...', action: () => store.setPreferencesOpen(true) },
        { divider: true },
        { label: 'Speaking Mode...', icon: '🗣️', action: () => dispatchCommand('SPEAKING_MODE') },
        { label: 'Character Highlighting...', icon: '🔦', action: () => dispatchCommand('CHARACTER_HIGHLIGHT') },
        { label: 'Compare Scripts...', icon: '⚖️', action: () => dispatchCommand('SCRIPT_COMPARE') },
      ]
    },
    {
      id: 'help', label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/', action: () => store.setKeyboardShortcutsOpen(true) },
        { label: 'Documentation', action: () => window.open('https://cinema-os.com/docs', '_blank') },
        { divider: true },
        { label: 'About Cinema OS', action: () => toast.success("Cinema OS v0.1.0", { description: "Agentic Script-To-Film Platform" }) },
      ]
    },
  ];
};
