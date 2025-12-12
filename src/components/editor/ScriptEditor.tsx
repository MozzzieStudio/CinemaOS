/**
 * ScriptEditor — Premium Screenplay Editor
 * 
 * Format toolbar (Scene/Action/Character/etc) + Editor Content
 * Integrates with App.tsx shell (left sidebar + top menu)
 */

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { 
  $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, $createTextNode, 
  UNDO_COMMAND, REDO_COMMAND, CLEAR_EDITOR_COMMAND,
  CUT_COMMAND, COPY_COMMAND, PASTE_COMMAND 
} from 'lexical';
import {
  SceneHeadingNode, ActionNode, CharacterNode, DialogueNode,
  ParentheticalNode, TokenNode, TransitionNode, ShotNode, DualDialogueNode,
  $createSceneHeadingNode, $createActionNode, $createCharacterNode,
  $createDialogueNode, $createParentheticalNode, $createTransitionNode,
} from "./nodes/ScriptNodes";
import { PageBreakNode, INSERT_PAGE_BREAK_COMMAND } from './nodes/PageBreakNode';
import { ActBreakNode, INSERT_ACT_BREAK_COMMAND } from './nodes/ActBreakNode';
import { TOGGLE_DUAL_DIALOGUE_COMMAND } from "./nodes/DualDialogueNode";

import AutoSavePlugin from "./plugins/AutoSavePlugin";
import MentionsPlugin from "./plugins/MentionsPlugin";
import ScriptFormattingPlugin from "./plugins/ScriptFormattingPlugin";
import KeyboardShortcutsPlugin from "./plugins/KeyboardShortcutsPlugin";
import ScriptNotesPlugin, { ADD_NOTE_COMMAND } from "./plugins/ScriptNotesPlugin";
import TypewriterScrollPlugin from "./plugins/TypewriterScrollPlugin";
import SpellCheckPlugin from './plugins/SpellCheckPlugin';
import SceneNumbersPlugin from './plugins/SceneNumbersPlugin';
import MoresContinuedsPlugin from './plugins/MoresContinuedsPlugin';
import SmartTypePlugin, { useSmartType } from "./plugins/SmartTypePlugin";
import BookmarksPlugin, { BookmarksPanel, useBookmarks } from "./plugins/BookmarksPlugin";

import NavigatorPanel from "./NavigatorPanel";
import BeatBoard from "./BeatBoard";
import IndexCardsView from "./IndexCardsView";
import SceneAnalysisPanel from "./SceneAnalysisPanel";
import ExportImportPanel from "./ExportImportPanel";
import NotesPopover from "./NotesPopover";
import FindReplaceDialog from "./FindReplaceDialog";
import ZoomControls from "./ZoomControls";
import GoToDialog from "./GoToDialog";
import TitlePageEditor from "./TitlePageEditor";
import CharacterRenameDialog from "./CharacterRenameDialog";
import ScriptReports from "./ScriptReports";
import ThesaurusDialog from "./ThesaurusDialog";
import VersionHistoryPanel from "./VersionHistoryPanel";

// New Production-Ready Features
import RevisionPlugin, { RevisionPanel, useRevision } from "./plugins/RevisionPlugin";
import SceneLockPlugin, { SceneLockPanel, useSceneLock, TOGGLE_SCENE_LOCK_COMMAND, UNLOCK_ALL_SCENES_COMMAND, UNLOCK_SCENE_COMMAND } from './plugins/SceneLockPlugin';
import SpeakingModePlugin from './plugins/SpeakingModePlugin';
import CharacterHighlightPlugin, { OPEN_CHARACTER_SELECTOR_COMMAND } from './plugins/CharacterHighlightPlugin';
import BreakdownPlugin, { OPEN_BREAKDOWN_REPORT_COMMAND } from './plugins/BreakdownPlugin';
import ScriptCompareDialog from './ScriptCompareDialog';
import FocusModePlugin from "./plugins/FocusModePlugin";
import AlternativeDialoguePlugin, { ADD_ALT_DIALOGUE_COMMAND, CYCLE_ALT_DIALOGUE_COMMAND } from "./plugins/AlternativeDialoguePlugin";
import AlternativeDialogueDialog from "./AlternativeDialogueDialog";
import PreferencesDialog, { usePreferences } from "../PreferencesDialog";
import { calculatePagination, extractElementsFromRoot } from "../../lib/pagination";

const theme = {
  paragraph: "script-paragraph",
  text: { bold: "font-bold", italic: "italic", underline: "underline" },
};

function onError(error: Error) {
  console.error(error);
}

// Stats Plugin - Now uses true pagination
function StatsPlugin({ onStatsChange }: { onStatsChange: (words: number, pages: number, scenes: number) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        // Use true pagination
        const elements = extractElementsFromRoot(root.getChildren());
        const stats = calculatePagination(elements);
        
        onStatsChange(words, stats.pageCount, stats.sceneCount);
      });
    });
  }, [editor, onStatsChange]);
  return null;
}

// Script Context Extraction Plugin
function ScriptContextPlugin({ onContextChange }: { onContextChange?: (ctx: any) => void }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (!onContextChange) return;
    
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const fullText = root.getTextContent();
        const selection = $getSelection();
        
        let selectionText: string | undefined;
        let cursorLine: number | undefined;
        
        if ($isRangeSelection(selection)) {
          selectionText = selection.getTextContent();
          const anchor = selection.anchor;
          const textBefore = fullText.substring(0, anchor.offset);
          cursorLine = (textBefore.match(/\n/g) || []).length + 1;
        }
        
        // Extract current scene
        const lines = fullText.split('\n');
        let currentScene: string | undefined;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.')) {
            currentScene = trimmed;
          }
        }
        
        // Extract characters
        const characters: string[] = [];
        const charPattern = /^([A-Z][A-Z\s]+)$/;
        for (const line of lines) {
          const trimmed = line.trim();
          if (charPattern.test(trimmed) && !trimmed.startsWith('INT.') && !trimmed.startsWith('EXT.')) {
            if (!characters.includes(trimmed)) characters.push(trimmed);
          }
        }
        
        onContextChange({
          full_text: fullText,
          selection: selectionText,
          cursor_line: cursorLine,
          current_scene: currentScene,
          scene_characters: characters,
        });
      });
    });
  }, [editor, onContextChange]);
  
  return null;
}

/**
 * DynamicPlaceholder — Adjusts position based on active screenplay element type
 */
function DynamicPlaceholder({ activeFormat }: { activeFormat: string }) {
  const isRightAligned = activeFormat === 'Trans';

  const getPlaceholderText = (): { hint: string; example: string } => {
    switch (activeFormat) {
      case 'Scene': return { hint: 'Scene Heading', example: 'INT. LOCATION - DAY' };
      case 'Action': return { hint: 'Action', example: 'Describe what happens...' };
      case 'Character': return { hint: 'Character Name', example: 'CHARACTER NAME' };
      case 'Dialogue': return { hint: 'Dialogue', example: 'What the character says...' };
      case 'Paren': return { hint: 'Parenthetical', example: '(beat)' };
      case 'Trans': return { hint: 'Transition', example: 'CUT TO:' };
      default: return { hint: 'Start typing', example: 'Your screenplay begins here...' };
    }
  };

  const placeholder = getPlaceholderText();
  const getLeftPadding = (): string => {
    const baseLeft = '9rem';
    switch (activeFormat) {
      case 'Character': return `calc(${baseLeft} + 2.2in)`;
      case 'Dialogue': return `calc(${baseLeft} + 1in)`;
      case 'Paren': return `calc(${baseLeft} + 1.6in)`;
      default: return baseLeft;
    }
  };

  if (isRightAligned) {
    return (
      <div 
        className="absolute hidden lg:block pointer-events-none font-mono text-[12pt]"
        style={{ top: '6rem', left: '9rem', right: '6rem', textAlign: 'right' }}
      >
        <div className="text-white/30 uppercase">{placeholder.example}</div>
        <div className="text-white/20 text-[10pt] mt-2">[{placeholder.hint}] — Ctrl+6</div>
      </div>
    );
  }

  return (
    <div 
      className="absolute hidden lg:block pointer-events-none font-mono text-[12pt]"
      style={{ top: '6rem', left: getLeftPadding(), right: '6rem' }}
    >
      <div className="text-white/30">
        <span className={activeFormat === 'Character' || activeFormat === 'Scene' ? 'uppercase' : ''}>
          {placeholder.example}
        </span>
      </div>
      <div className="text-white/20 text-[10pt] mt-2">
        [{placeholder.hint}] — Tab to cycle, Ctrl+1-6
      </div>
    </div>
  );
}

function FormatButton({ icon, label, shortcut, active, onClick }: { icon: string; label: string; shortcut: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${label} (${shortcut})`}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-linear-to-r from-violet-600/25 to-purple-600/25 text-white ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10"
          : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="hidden md:inline">{label}</span>
      <span className={`hidden lg:inline text-[10px] px-1 py-0.5 rounded ${active ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-white/25'}`}>{shortcut}</span>
    </button>
  );
}

function EditorContent({ sceneNumbersConfig, moresContinuedsConfig, onScriptContextChange }: ScriptEditorProps) {
  const [editor] = useLexicalComposerContext();
  
  const { 
    isNavigatorOpen, setNavigatorOpen,
    isBeatBoardOpen, setBeatBoardOpen,
    isIndexCardsOpen, setIndexCardsOpen,
    isAnalysisOpen, setAnalysisOpen,
    isExportOpen, setExportOpen,
    isTypewriterEnabled, isFocusModeActive,
    isReportsOpen, setReportsOpen,
    isThesaurusOpen, setThesaurusOpen,
    isCharRenameOpen, setCharRenameOpen, 
    isTitlePageOpen, setTitlePageOpen,
    isFindReplaceOpen, setFindReplaceOpen,
    isBookmarksOpen, setBookmarksOpen,
    isAltDialogueOpen, setAltDialogueOpen,
    altDialogueData, setAltDialogueData,
    notePopoverElementKey, setNotePopoverElementKey,
    // Add New Panels from Store
    isPreferencesOpen, setPreferencesOpen,
    isRevisionPanelOpen, setRevisionPanelOpen,
    isScriptCompareOpen, setScriptCompareOpen,
    isSceneLockPanelOpen, setSceneLockPanelOpen,
    isSpeakingModeOpen, setSpeakingModeOpen,
    isVersionHistoryOpen, setVersionHistoryOpen,
    isGoToOpen, setGoToOpen
  } = useEditorStore();

  // Local Editor State (for UI status bar)
  const [activeFormat, setActiveFormat] = useState("Action");
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isSpellCheckEnabled, setIsSpellCheckEnabled] = useState(true);
  const [zoom, setZoom] = useState(100);
  
  // Dialogs (Local)

  
  // Title page data (Local for now)
  const [titlePageData, setTitlePageData] = useState({
    title: 'UNTITLED SCREENPLAY',
    writtenBy: '',
    draftDate: new Date().toISOString().split('T')[0],
  });
  
  // Hooks
  const { bookmarks, setBookmarks } = useBookmarks();
  const smartTypeConfig = useSmartType();
  const revisionHook = useRevision();
  const sceneLock = useSceneLock();
  const { preferences, setPreferences } = usePreferences();
  
  const [sceneCount, setSceneCount] = useState(0);

  const applyFormat = useCallback((format: string, creator: () => any) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const topNode = selection.anchor.getNode().getTopLevelElement();
        if (topNode) {
          const text = topNode.getTextContent();
          const newNode = creator();
          topNode.replace(newNode);
          if (text.trim()) newNode.append($createTextNode(text));
          newNode.selectEnd();
        }
      }
    });
    setActiveFormat(format);
  }, [editor, setActiveFormat]);

  useEffect(() => {
    const handleNotePopover = (e: CustomEvent) => {
      const { elementKey } = e.detail;
      setNotePopoverElementKey(elementKey);
    };
    
    const handleAltDialoguePrompt = (e: CustomEvent) => {
      const { nodeKey, currentText } = e.detail;
      setAltDialogueData({ nodeKey, currentText });
      setAltDialogueOpen(true);
    };

    window.addEventListener('open-note-popover', handleNotePopover as EventListener);
    window.addEventListener('open-alt-dialogue-prompt', handleAltDialoguePrompt as EventListener);
    return () => {
      window.removeEventListener('open-note-popover', handleNotePopover as EventListener);
      window.removeEventListener('open-alt-dialogue-prompt', handleAltDialoguePrompt as EventListener);
    };
  }, [setAltDialogueData, setAltDialogueOpen, setNotePopoverElementKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); editor.dispatchCommand(ADD_NOTE_COMMAND, undefined); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); setGoToOpen(true); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) { e.preventDefault(); setFindReplaceOpen(true); }
      else if (e.shiftKey && e.key === 'F7') { e.preventDefault(); setThesaurusOpen(true); }
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') { e.preventDefault(); setBookmarksOpen(prev => !prev); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined); }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); editor.dispatchCommand(TOGGLE_DUAL_DIALOGUE_COMMAND, undefined); }
      // Alts Shortcuts
      else if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'n') { e.preventDefault(); editor.dispatchCommand(ADD_ALT_DIALOGUE_COMMAND, undefined); }
      else if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'm') { e.preventDefault(); editor.dispatchCommand(CYCLE_ALT_DIALOGUE_COMMAND, undefined); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, setBookmarksOpen, setFindReplaceOpen, setThesaurusOpen]);



  useEffect(() => {
    const handleCommand = (e: CustomEvent) => {
      const { type, payload } = e.detail;
      switch (type) {
        case 'UNDO': editor.dispatchCommand(UNDO_COMMAND, undefined); break;
        case 'REDO': editor.dispatchCommand(REDO_COMMAND, undefined); break;
        case 'FORMAT_TEXT': editor.dispatchCommand(FORMAT_TEXT_COMMAND, payload); break;
        case 'FORMAT_ELEMENT': 
          const format = formats.find(f => f.id === payload);
          if (format) applyFormat(format.id, format.creator);
          break;
        case 'NEW_SCRIPT':
          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
          editor.update(() => {
            const root = $getRoot();
            const p = $createSceneHeadingNode();
            p.append($createTextNode('INT. LOCATION - DAY'));
            root.append(p);
          });
          break;
        case 'EXPORT_FDX': setExportOpen(true); break;
        case 'EXPORT_PDF': setExportOpen(true); break;
        case 'IMPORT_FDX': /* usually handled via file input in ExportPanel, but if command comes from menu */ setExportOpen(true); break;
        case 'FIND': setFindReplaceOpen(true); break;
        case 'CUT': editor.dispatchCommand(CUT_COMMAND, null as any); break;
        case 'COPY': editor.dispatchCommand(COPY_COMMAND, null as any); break;
        case 'PASTE': editor.dispatchCommand(PASTE_COMMAND, null as any); break;
        case 'SAVE': toast.success("Script Saved (Simulated)"); break;
        case 'SAVE_AS': setExportOpen(true); break;
        case 'SPELLING': setIsSpellCheckEnabled(prev => !prev); toast.info(isSpellCheckEnabled ? 'Spell Check Disabled' : 'Spell Check Enabled'); break;
        case 'GO_TO': setGoToOpen(true); break;
        case 'PAGE_BREAK': editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined); break;
        case 'TITLE_PAGE': setTitlePageOpen(true); break;
        case 'THESAURUS': setThesaurusOpen(true); break;
        case 'REPORTS': setReportsOpen(true); break;
        case 'CHARACTER_RENAME': setCharRenameOpen(true); break;
        case 'BOOKMARKS': setBookmarksOpen(prev => !prev); break;
        case 'PREFERENCES': setPreferencesOpen(true); break;
        case 'REVISION_MODE': setRevisionPanelOpen(true); break;
        // New Features
        case 'SCRIPT_COMPARE': setScriptCompareOpen(true); break;
        case 'SCENE_LOCK_PANEL': setSceneLockPanelOpen(true); break;
        case 'SPEAKING_MODE': setSpeakingModeOpen(true); break;
        case 'CHARACTER_HIGHLIGHT': editor.dispatchCommand(OPEN_CHARACTER_SELECTOR_COMMAND, undefined); break;
        case 'BREAKDOWN_REPORT': editor.dispatchCommand(OPEN_BREAKDOWN_REPORT_COMMAND, undefined); break;
        case 'LOCK_SCENE': editor.dispatchCommand(TOGGLE_SCENE_LOCK_COMMAND, undefined); break;
        case 'VERSION_HISTORY': setVersionHistoryOpen(true); break;
        case 'INSERT_ACT_BREAK': editor.dispatchCommand(INSERT_ACT_BREAK_COMMAND, 1); break;
        case 'OMIT_SCENE': 
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = selection.anchor.getNode().getTopLevelElement();
              if (node && 'setOmitted' in node) {
                (node as any).setOmitted(!(node as any).isOmitted?.());
                toast.info((node as any).isOmitted?.() ? 'Scene omitted' : 'Scene restored');
              }
            }
          });
          break;
      }
    };
    window.addEventListener('editor-command', handleCommand as EventListener);
    return () => window.removeEventListener('editor-command', handleCommand as EventListener);
  }, [editor, applyFormat, isSpellCheckEnabled, setBookmarksOpen, setCharRenameOpen, setExportOpen, setFindReplaceOpen, setReportsOpen, setThesaurusOpen, setTitlePageOpen]);

  const formats = useMemo(() => [
    { id: 'Scene', icon: '🎬', key: 'Ctrl+1', creator: $createSceneHeadingNode },
    { id: 'Action', icon: '📝', key: 'Ctrl+2', creator: $createActionNode },
    { id: 'Character', icon: '👤', key: 'Ctrl+3', creator: $createCharacterNode },
    { id: 'Dialogue', icon: '💬', key: 'Ctrl+4', creator: $createDialogueNode },
    { id: 'Paren', icon: '🎭', key: 'Ctrl+5', creator: $createParentheticalNode },
    { id: 'Trans', icon: '➡️', key: 'Ctrl+6', creator: $createTransitionNode },
  ], []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* TOOLBAR */}
      <div className="flex items-center h-10 sm:h-12 px-2 sm:px-4 bg-linear-to-r from-[#121212] to-[#141414] border-b border-white/6 shrink-0 overflow-hidden">
        <div className="flex-1 flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {formats.map((f) => (
            <FormatButton
              key={f.id} icon={f.icon} label={f.id} shortcut={f.key}
              active={activeFormat.toLowerCase() === f.id.toLowerCase()}
              onClick={() => applyFormat(f.id, f.creator)}
            />
          ))}
          <div className="w-px h-6 bg-white/10 mx-3" />
          <div className="flex items-center gap-0.5 bg-white/3 rounded-lg p-0.5">
            <button onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} title="Undo" className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/8 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg></button>
            <button onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} title="Redo" className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/8 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 3.7"/></svg></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={() => window.dispatchEvent(new CustomEvent('editor-command', { detail: { type: 'SAVE' } }))} title="Save" className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-sky-400 hover:bg-sky-400/10 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 shrink-0 ml-2 sm:ml-4">
          <button onClick={() => setExportOpen(true)} className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/8 text-white/60 hover:text-white text-xs transition-all border border-white/6"><span className="hidden sm:inline">Export</span></button>
        </div>
      </div>

      {/* EDITOR AREA */}
      <div className="flex flex-1 min-h-0">
        <NavigatorPanel isOpen={isNavigatorOpen} onClose={() => setNavigatorOpen(false)} />
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-2 sm:p-3 md:p-4 flex justify-center">
            <div className="w-full max-w-[850px] lg:w-[816px] lg:max-w-none flex flex-col relative bg-[#161616] rounded-lg sm:rounded-xl shadow-2xl border border-white/10 lg:min-h-[1056px] shrink-0 my-4 lg:my-8">
              <div className="absolute top-3 sm:top-4 md:top-5 right-4 sm:right-5 md:right-6 text-[10px] sm:text-[11px] text-white/20 font-mono tracking-wide">{pageCount}.</div>
              <RichTextPlugin
                contentEditable={
                  <div className="flex-1 min-h-0">
                    <ContentEditable 
                      className="h-full py-8 px-4 outline-none text-[12pt] leading-none text-white/90 selection:bg-violet-500/30 lg:py-24 lg:pl-36 lg:pr-24 w-full box-border"
                      style={{ fontFamily: "'Courier Prime', 'Courier New', Courier, monospace" }}
                    />
                  </div>
                }
                placeholder={<DynamicPlaceholder activeFormat={activeFormat} />}
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </div>
        </div>
        <SceneAnalysisPanel isOpen={isAnalysisOpen} onClose={() => setAnalysisOpen(false)} />
      </div>

      {/* STATUS BAR */}
      <div className="flex items-center justify-between h-7 px-4 bg-[#0c0c0c] border-t border-white/5 text-[10px] shrink-0">
        <div className="flex items-center gap-4"><span className="text-white/25"><span className="text-violet-400 font-medium">{activeFormat}</span></span><span className="text-white/30 hidden sm:inline">{sceneCount} scenes • {wordCount} words</span></div>
        <div className="flex items-center gap-3"><ZoomControls zoom={zoom} onZoomChange={setZoom} /><div className="flex items-center gap-2 text-emerald-400/70"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span>Auto-saved</span></div></div>
      </div>

      {/* PLUGINS */}
      <HistoryPlugin />
      <AutoFocusPlugin />
      <AutoSavePlugin projectId="default" />
      <MentionsPlugin projectId="default" />
      <ScriptFormattingPlugin />
      <KeyboardShortcutsPlugin onFormatChange={setActiveFormat} />
      <ScriptNotesPlugin />
      <SpellCheckPlugin config={{ enabled: isSpellCheckEnabled, autoCorrect: false, ignoredWords: new Set() }} />
      <TypewriterScrollPlugin enabled={isTypewriterEnabled} />
      <StatsPlugin onStatsChange={(w, p, s) => { setWordCount(w); setPageCount(p); setSceneCount(s); }} />
      <RevisionPlugin config={revisionHook.config} onConfigChange={revisionHook.setConfig} />
      <FocusModePlugin enabled={isFocusModeActive} />
      <SceneLockPlugin onLockedScenesChange={sceneLock.setLockedScenes} />
      <SpeakingModePlugin isOpen={isSpeakingModeOpen} onClose={() => setSpeakingModeOpen(false)} />
      <CharacterHighlightPlugin />
      <BreakdownPlugin />
      <SmartTypePlugin config={smartTypeConfig.config} />
      <BookmarksPlugin bookmarks={bookmarks} onBookmarksChange={setBookmarks} onNavigateToBookmark={(_bookmark) => { /* Navigation handled by panel */ }} />
      <SceneNumbersPlugin config={sceneNumbersConfig} />
      <MoresContinuedsPlugin config={moresContinuedsConfig} pageHeight={54} />
      <ScriptContextPlugin onContextChange={onScriptContextChange} />
      <AlternativeDialoguePlugin />

      {/* MODALS */}
      <BeatBoard isOpen={isBeatBoardOpen} onClose={() => setBeatBoardOpen(false)} />
      <IndexCardsView isOpen={isIndexCardsOpen} onClose={() => setIndexCardsOpen(false)} />
      <ExportImportPanel isOpen={isExportOpen} onClose={() => setExportOpen(false)} titlePageData={titlePageData} />
      <NotesPopover elementKey={notePopoverElementKey} onClose={() => setNotePopoverElementKey(null)} />
      <FindReplaceDialog isOpen={isFindReplaceOpen} onClose={() => setFindReplaceOpen(false)} />
      <GoToDialog isOpen={isGoToOpen} onClose={() => setGoToOpen(false)} totalPages={pageCount} totalScenes={sceneCount} onGoToPage={() => {}} onGoToScene={() => {}} />
      <TitlePageEditor isOpen={isTitlePageOpen} onClose={() => setTitlePageOpen(false)} data={titlePageData} onSave={setTitlePageData} />
      <CharacterRenameDialog isOpen={isCharRenameOpen} onClose={() => setCharRenameOpen(false)} />
      <ScriptReports isOpen={isReportsOpen} onClose={() => setReportsOpen(false)} />
      <ThesaurusDialog isOpen={isThesaurusOpen} onClose={() => setThesaurusOpen(false)} />
      <BookmarksPanel isOpen={isBookmarksOpen} onClose={() => setBookmarksOpen(false)} bookmarks={bookmarks} onBookmarksChange={setBookmarks} onNavigateToBookmark={() => {}} />
      <PreferencesDialog isOpen={isPreferencesOpen} onClose={() => setPreferencesOpen(false)} preferences={preferences} onSave={setPreferences} />
      <RevisionPanel isOpen={isRevisionPanelOpen} onClose={() => setRevisionPanelOpen(false)} config={revisionHook.config} onConfigChange={revisionHook.setConfig} />
      <ScriptCompareDialog isOpen={isScriptCompareOpen} onClose={() => setScriptCompareOpen(false)} />
      <SceneLockPanel isOpen={isSceneLockPanelOpen} onClose={() => setSceneLockPanelOpen(false)} lockedScenes={Array.from(sceneLock.lockedScenes)} onUnlockScene={(key) => editor.dispatchCommand(UNLOCK_SCENE_COMMAND, key)} onUnlockAll={() => editor.dispatchCommand(UNLOCK_ALL_SCENES_COMMAND, undefined)} />
      {isVersionHistoryOpen && (
        <VersionHistoryPanel 
          projectId="default"
          currentContent={JSON.stringify(editor.getEditorState().toJSON())}
          onRestore={(content) => {
            try {
              const state = JSON.parse(content);
              const newEditorState = editor.parseEditorState(state);
              editor.setEditorState(newEditorState);
              toast.success('Version restored');
            } catch (e) {
              console.error('Failed to restore version:', e);
              toast.error('Failed to restore version');
            }
          }}
          onClose={() => setVersionHistoryOpen(false)}
        />
      )}
      <AlternativeDialogueDialog 
        isOpen={isAltDialogueOpen} 
        onClose={() => setAltDialogueOpen(false)} 
        nodeKey={altDialogueData.nodeKey}
        currentText={altDialogueData.currentText}
      />
    </div>
  );
}

import { useEditorStore } from "../../stores/editorStore";

// Props - drastically simplified
interface ScriptEditorProps {
  sceneNumbersConfig: any;
  moresContinuedsConfig: any;
  onScriptContextChange: (context: any) => void; // Assuming ScriptContext is 'any' for now based on usage
}

export default function ScriptEditor({
  sceneNumbersConfig,
  moresContinuedsConfig,
  onScriptContextChange
}: ScriptEditorProps) {

  const initialConfig = useMemo(() => ({
    namespace: "ScriptEditor",
    theme,
    onError,
    nodes: [
      SceneHeadingNode, ActionNode, CharacterNode, DialogueNode,
      ParentheticalNode, TokenNode, TransitionNode, ShotNode, DualDialogueNode,
      PageBreakNode, ActBreakNode
    ],
  }), []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        <EditorContent 
            sceneNumbersConfig={sceneNumbersConfig}
            moresContinuedsConfig={moresContinuedsConfig}
            onScriptContextChange={onScriptContextChange}
        />
      </div>
    </LexicalComposer>
  );
}
