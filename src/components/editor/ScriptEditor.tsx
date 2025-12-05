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
import { useState, useCallback, useEffect } from "react";
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

// New Production-Ready Features
import RevisionPlugin, { RevisionPanel, useRevision } from "./plugins/RevisionPlugin";
import FocusModePlugin from "./plugins/FocusModePlugin";
import PreferencesDialog, { usePreferences } from "../PreferencesDialog";
import { calculatePagination, extractElementsFromRoot } from "../../lib/pagination";
import { downloadPDF } from "../../lib/pdfExport";
// Note: invoke is imported for future native file I/O integration
// import { invoke } from "@tauri-apps/api/core";


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

/**
 * DynamicPlaceholder — Adjusts position based on active screenplay element type
 * 
 * Hollywood Standard Margins (from left content edge):
 * - Scene Heading / Action: 0" (flush left)
 * - Character: 2.2" (3.7" from page edge - 1.5" left margin)
 * - Dialogue: 1.0" (2.5" from page edge - 1.5" left margin)
 * - Parenthetical: 1.6" (3.1" from page edge - 1.5" left margin)
 * - Transition: Right-aligned
 */
function DynamicPlaceholder({ activeFormat }: { activeFormat: string }) {
  const isRightAligned = activeFormat === 'Trans';

  // Placeholder text based on element type
  const getPlaceholderText = (): { hint: string; example: string } => {
    switch (activeFormat) {
      case 'Scene':
        return { hint: 'Scene Heading', example: 'INT. LOCATION - DAY' };
      case 'Action':
        return { hint: 'Action', example: 'Describe what happens...' };
      case 'Character':
        return { hint: 'Character Name', example: 'CHARACTER NAME' };
      case 'Dialogue':
        return { hint: 'Dialogue', example: 'What the character says...' };
      case 'Paren':
        return { hint: 'Parenthetical', example: '(beat)' };
      case 'Trans':
        return { hint: 'Transition', example: 'CUT TO:' };
      default:
        return { hint: 'Start typing', example: 'Your screenplay begins here...' };
    }
  };

  const placeholder = getPlaceholderText();

  // The ContentEditable uses: lg:py-24 lg:pl-36 lg:pr-24
  // We need to position placeholder at the EXACT same location as cursor
  // Base padding matches ContentEditable: left=9rem (36*0.25), right=6rem (24*0.25), top=6rem (24*0.25)
  
  // Calculate the total left position: base padding + element-specific margin
  const getLeftPadding = (): string => {
    const baseLeft = '9rem'; // lg:pl-36 = 9rem
    switch (activeFormat) {
      case 'Character':
        return `calc(${baseLeft} + 2.2in)`; // Add character indent
      case 'Dialogue':
        return `calc(${baseLeft} + 1in)`;   // Add dialogue indent
      case 'Paren':
        return `calc(${baseLeft} + 1.6in)`; // Add parenthetical indent
      default: // Scene, Action, Trans (Trans handled separately)
        return baseLeft;
    }
  };

  // Transition is right-aligned
  if (isRightAligned) {
    return (
      <div 
        className="absolute hidden lg:block pointer-events-none font-mono text-[12pt]"
        style={{
          top: '6rem',      // lg:py-24 = 6rem
          left: '9rem',     // lg:pl-36 = 9rem 
          right: '6rem',    // lg:pr-24 = 6rem
          textAlign: 'right',
        }}
      >
        <div className="text-white/30 uppercase">
          {placeholder.example}
        </div>
        <div className="text-white/20 text-[10pt] mt-2">
          [{placeholder.hint}] — Ctrl+6
        </div>
      </div>
    );
  }

  // All other elements (left-aligned with varying indents)
  return (
    <div 
      className="absolute hidden lg:block pointer-events-none font-mono text-[12pt]"
      style={{
        top: '6rem',              // Match lg:py-24
        left: getLeftPadding(),   // Base padding + element-specific margin
        right: '6rem',            // Match lg:pr-24
      }}
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

// Format Button Component
function FormatButton({ 
  icon, label, shortcut, active, onClick 
}: { 
  icon: string; label: string; shortcut: string; active?: boolean; onClick: () => void 
}) {
  return (
    <button
      onClick={onClick}
      title={`${label} (${shortcut})`}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-gradient-to-r from-violet-600/25 to-purple-600/25 text-white ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10"
          : "text-white/50 hover:text-white hover:bg-white/[0.05]"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="hidden md:inline">{label}</span>
      
      {/* Keyboard hint */}
      <span className={`hidden lg:inline text-[10px] px-1 py-0.5 rounded ${
        active ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-white/25'
      }`}>
        {shortcut}
      </span>
    </button>
  );
}

// Main Editor Content
function EditorContent(props: any) {
  const [editor] = useLexicalComposerContext();
  
  const { 
    activeFormat, setActiveFormat, wordCount, pageCount, setWordCount, setPageCount,
    isNavigatorOpen, setIsNavigatorOpen, isBeatBoardOpen, setIsBeatBoardOpen,
    isIndexCardsOpen, setIsIndexCardsOpen, isAnalysisOpen, setIsAnalysisOpen,
    isExportOpen, setIsExportOpen,

    isTypewriterEnabled, isFocusModeActive: _isFocusModeActive, setIsFocusModeActive: _setIsFocusModeActive,
    sceneNumbersConfig, moresContinuedsConfig,
    onToggleSidebar
  } = props;

  // Local state
  const [isSpellCheckEnabled, setIsSpellCheckEnabled] = useState(true);
  const [notePopoverElementKey, setNotePopoverElementKey] = useState<string | null>(null);
  
  // Find & Replace State
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  
  // Zoom
  const [zoom, setZoom] = useState(100);
  
  // Dialogs
  const [isGoToOpen, setIsGoToOpen] = useState(false);
  const [isTitlePageOpen, setIsTitlePageOpen] = useState(false);
  const [isCharRenameOpen, setIsCharRenameOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isThesaurusOpen, setIsThesaurusOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  
  // Title page data
  const [titlePageData, setTitlePageData] = useState({
    title: 'UNTITLED SCREENPLAY',
    writtenBy: '',
    draftDate: new Date().toISOString().split('T')[0],
  });
  
  // Hooks for plugins
  const { bookmarks, setBookmarks } = useBookmarks();
  const smartTypeConfig = useSmartType();
  const revisionHook = useRevision();
  const { preferences, setPreferences } = usePreferences();
  
  // New dialog states
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isRevisionPanelOpen, setIsRevisionPanelOpen] = useState(false);
  const [sceneCount, setSceneCount] = useState(0);
  const [_currentFilePath, _setCurrentFilePath] = useState<string | null>(null);

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

  // ScriptNotes Event Listener
  useEffect(() => {
    const handleNotePopover = (e: CustomEvent) => {
      const { elementKey } = e.detail;
      setNotePopoverElementKey(elementKey);
    };

    window.addEventListener('open-note-popover', handleNotePopover as EventListener);
    return () => window.removeEventListener('open-note-popover', handleNotePopover as EventListener);
  }, []);

  // Keyboard Shortcuts via window listener for specific interactions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N - Notes
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        editor.dispatchCommand(ADD_NOTE_COMMAND, undefined);
      }
      // Ctrl+G - Go To
      else if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setIsGoToOpen(true);
      }
      // Ctrl+F - Find (also trigger from menu)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      }
      // Shift+F7 - Thesaurus
      else if (e.shiftKey && e.key === 'F7') {
        e.preventDefault();
        setIsThesaurusOpen(true);
      }
      // Ctrl+Shift+B - Bookmarks
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'b') {
        e.preventDefault();
        setIsBookmarksOpen(prev => !prev);
      }
      // Ctrl+Enter - Page Break
      else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
      }
      // Ctrl+D - Dual Dialogue
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        editor.dispatchCommand(TOGGLE_DUAL_DIALOGUE_COMMAND, undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const exportFDX = () => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      let fdxContent = `<?xml version="1.0" encoding="UTF-8"?><FinalDraft DocumentType="Script" Template="No" Version="4"><Content>`;
      
      root.getChildren().forEach((node: any) => {
        const type = node.getType();
        const text = node.getTextContent()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        let fdxType = "Action";
        if (type === 'scene-heading') fdxType = "Scene Heading";
        else if (type === 'character') fdxType = "Character";
        else if (type === 'dialogue') fdxType = "Dialogue";
        else if (type === 'parenthetical') fdxType = "Parenthetical";
        else if (type === 'transition') fdxType = "Transition";

        fdxContent += `<Paragraph Type="${fdxType}"><Text>${text}</Text></Paragraph>`;
      });

      fdxContent += `</Content></FinalDraft>`;
      
      const blob = new Blob([fdxContent], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'script.fdx';
      a.click();
    });
  };

  const importFDX = (xmlString: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const paragraphs = xmlDoc.getElementsByTagName("Paragraph");

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const type = p.getAttribute("Type");
        const text = p.textContent || "";
        
        let node;
        switch (type) {
          case "Scene Heading": node = $createSceneHeadingNode(); break;
          case "Character": node = $createCharacterNode(); break;
          case "Dialogue": node = $createDialogueNode(); break;
          case "Parenthetical": node = $createParentheticalNode(); break;
          case "Transition": node = $createTransitionNode(); break;
          default: node = $createActionNode();
        }
        
        node.append($createTextNode(text));
        root.append(node);
      }
    });
  };

  // Command Listener
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
        case 'EXPORT_FDX':
          exportFDX();
          break;
        case 'IMPORT_FDX':
          importFDX(payload);
          break;
        case 'LOAD_CONTENT':
           // Basic text load for now
           editor.update(() => {
             const root = $getRoot();
             root.clear();
             const p = $createActionNode();
             p.append($createTextNode(payload));
             root.append(p);
           });
           break;
        case 'FIND':
          setIsFindReplaceOpen(true);
          break;
        case 'CUT': editor.dispatchCommand(CUT_COMMAND, null as any); break;
        case 'COPY': editor.dispatchCommand(COPY_COMMAND, null as any); break;
        case 'PASTE': editor.dispatchCommand(PASTE_COMMAND, null as any); break;
        case 'SAVE': 
           console.log("Saving...");
           break;
           
        // === NEW / UPDATED COMMANDS ===
        case 'SAVE_AS':
           exportFDX(); // Using FDX export as 'Save As' for now
           toast.success("Exporting FDX...");
           break;
        case 'SPELLING':
           setIsSpellCheckEnabled(prev => !prev);
           toast.info(isSpellCheckEnabled ? 'Spell Check Disabled' : 'Spell Check Enabled');
           break;
        case 'GO_TO':
          setIsGoToOpen(true);
          break;
        case 'PAGE_BREAK':
          editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined);
          break;
        case 'TITLE_PAGE':
          setIsTitlePageOpen(true);
          break;
        case 'THESAURUS':
          setIsThesaurusOpen(true);
          break;
        case 'REPORTS':
          setIsReportsOpen(true);
          break;
        case 'CHARACTER_RENAME':
          setIsCharRenameOpen(true);
          break;
        case 'BOOKMARKS':
          setIsBookmarksOpen(prev => !prev);
          break;
          
        // === NEW PRODUCTION-READY COMMANDS ===
        case 'PREFERENCES':
          setIsPreferencesOpen(true);
          break;
        case 'REVISION_MODE':
          setIsRevisionPanelOpen(true);
          break;
        case 'EXPORT_PDF':
          console.log('[PDF Export] Starting export...');
          (async () => {
            try {
              const editorState = editor.getEditorState();
              let elements: { type: string; text: string }[] = [];
              
              editorState.read(() => {
                const root = $getRoot();
                elements = extractElementsFromRoot(root.getChildren());
                console.log('[PDF Export] Extracted elements:', elements);
              });
              
              if (elements.length === 0) {
                console.warn('[PDF Export] No elements found');
                toast.error('Nothing to export');
                return;
              }
              
              console.log('[PDF Export] Calling downloadPDF...');
              await downloadPDF(elements, 'screenplay.pdf', titlePageData);
              console.log('[PDF Export] Export complete');
              toast.success('PDF Exported Successfully');
            } catch (error) {
              console.error('[PDF Export] Error:', error);
              toast.error('PDF export failed');
            }
          })();
          break;
      }

    };

    window.addEventListener('editor-command', handleCommand as EventListener);
    return () => window.removeEventListener('editor-command', handleCommand as EventListener);
  }, [editor, applyFormat, isSpellCheckEnabled]);

  const formats = [
    { id: 'Scene', icon: '🎬', key: 'Ctrl+1', creator: $createSceneHeadingNode },
    { id: 'Action', icon: '📝', key: 'Ctrl+2', creator: $createActionNode },
    { id: 'Character', icon: '👤', key: 'Ctrl+3', creator: $createCharacterNode },
    { id: 'Dialogue', icon: '💬', key: 'Ctrl+4', creator: $createDialogueNode },
    { id: 'Paren', icon: '🎭', key: 'Ctrl+5', creator: $createParentheticalNode },
    { id: 'Trans', icon: '➡️', key: 'Ctrl+6', creator: $createTransitionNode },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* ═══════════ FORMAT TOOLBAR ═══════════ */}
      <div className="flex items-center h-10 sm:h-12 px-2 sm:px-4 bg-gradient-to-r from-[#121212] to-[#141414] border-b border-white/6 shrink-0 overflow-hidden">
        {/* Format Buttons - Scrollable on mobile */}
        <div className="flex-1 flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {formats.map((f) => (
            <FormatButton
              key={f.id}
              icon={f.icon}
              label={f.id}
              shortcut={f.key}
              active={activeFormat.toLowerCase() === f.id.toLowerCase()}
              onClick={() => applyFormat(f.id, f.creator)}
            />
          ))}

          {/* Separator */}
          <div className="w-px h-6 bg-white/10 mx-3" />

          {/* Essential History & Save Tools */}
          <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5">
            <button
              onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
              title="Undo (Ctrl+Z)"
              className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </button>
            <button
              onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
              title="Redo (Ctrl+Y)"
              className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 3.7"/></svg>
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('editor-command', { detail: { type: 'SAVE' } }))}
              title="Save (Ctrl+S)"
              className="w-8 h-8 flex items-center justify-center rounded-md text-white/40 hover:text-sky-400 hover:bg-sky-400/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>
          </div>
        </div>

        {/* Right Side Tools - Compact on mobile */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0 ml-2 sm:ml-4">
          {/* Quick Tools - Hidden on small screens */}
          <div className="hidden lg:flex items-center gap-1 bg-white/3 rounded-lg p-0.5">
            <button
              onClick={() => setIsNavigatorOpen(!isNavigatorOpen)}
              title="Navigator"
              className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all ${
                isNavigatorOpen ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white hover:bg-white/6'
              }`}
            >
              📑
            </button>
            <button
              onClick={() => setIsBeatBoardOpen(true)}
              title="Beat Board"
              className="px-2.5 py-1.5 rounded-md text-xs text-white/40 hover:text-white hover:bg-white/6 transition-all"
            >
              🎯
            </button>
            <button
              onClick={() => setIsIndexCardsOpen(true)}
              title="Index Cards"
              className="px-2.5 py-1.5 rounded-md text-xs text-white/40 hover:text-white hover:bg-white/6 transition-all"
            >
              🗂️
            </button>
            <button
              onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
              title="AI Analysis"
              className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all ${
                isAnalysisOpen ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white hover:bg-white/6'
              }`}
            >
              🤖
            </button>
            
            {/* AI Generator Tools */}
            <div className="w-px h-4 bg-white/10 mx-1" />
            
            <button
              onClick={() => onToggleSidebar?.()}
              title="AI Analysis"
              className="px-2.5 py-1.5 rounded-md text-xs text-white/40 hover:text-white hover:bg-white/6 transition-all flex items-center gap-1.5"
            >
              <span>🤖</span>
              <span className="hidden xl:inline">Analyze</span>
            </button>
          </div>

          {/* Export - Icon only on mobile */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/8 text-white/60 hover:text-white text-xs transition-all border border-white/6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Stats - Hidden on smaller screens */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-white/30 font-medium">
            <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
            <span className="text-white/15">•</span>
            <span>{wordCount} words</span>
          </div>
        </div>
      </div>

      {/* ═══════════ EDITOR AREA ═══════════ */}
      <div className="flex flex-1 min-h-0">
        {/* Navigator Panel */}
        <NavigatorPanel isOpen={isNavigatorOpen} onClose={() => setIsNavigatorOpen(false)} />

        {/* Main Editor - Responsive centering */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-2 sm:p-3 md:p-4 flex justify-center">
            {/* Paper - Fixed width centered on desktop */ }
            <div className="w-full max-w-[850px] lg:w-[816px] lg:max-w-none flex flex-col relative bg-[#161616] rounded-lg sm:rounded-xl shadow-2xl border border-white/10 lg:min-h-[1056px] shrink-0 my-4 lg:my-8">
              {/* Page number */}
              <div className="absolute top-3 sm:top-4 md:top-5 right-4 sm:right-5 md:right-6 text-[10px] sm:text-[11px] text-white/20 font-mono tracking-wide">
                {pageCount}.
              </div>

              <RichTextPlugin
                contentEditable={
                  <div className="flex-1 min-h-0">
                    <ContentEditable 
                      className="h-full py-8 px-4 outline-none text-[12pt] leading-[1] text-white/90 selection:bg-violet-500/30 lg:py-24 lg:pl-36 lg:pr-24 w-full box-border"
                      style={{ fontFamily: "'Courier Prime', 'Courier New', Courier, monospace" }}
                    />
                  </div>
                }
                placeholder={
                  <DynamicPlaceholder activeFormat={activeFormat} />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        <SceneAnalysisPanel isOpen={isAnalysisOpen} onClose={() => setIsAnalysisOpen(false)} />
      </div>

      {/* ═══════════ STATUS BAR ═══════════ */}
      <div className="flex items-center justify-between h-7 px-4 bg-[#0c0c0c] border-t border-white/5 text-[10px] shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-white/25">
            <span className="text-violet-400 font-medium">{activeFormat}</span>
          </span>
          <span className="text-white/30 hidden sm:inline">
            {sceneCount} scenes
          </span>
          <span className="text-white/15 hidden sm:inline">
            Tab to cycle • Ctrl+1-6 for format
          </span>
        </div>
        
        {/* Zoom Controls in Status Bar */}
        <div className="flex items-center gap-3">
          <ZoomControls zoom={zoom} onZoomChange={setZoom} />
          
          <div className="flex items-center gap-2 text-emerald-400/70">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-saved</span>
          </div>
        </div>
      </div>

      {/* Plugins */}
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
      <FocusModePlugin enabled={_isFocusModeActive} />

      {/* Modals */}
      <BeatBoard isOpen={isBeatBoardOpen} onClose={() => setIsBeatBoardOpen(false)} />
      <IndexCardsView isOpen={isIndexCardsOpen} onClose={() => setIsIndexCardsOpen(false)} />
      <ExportImportPanel isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      
      {/* ScriptNotes Popover */}
      <NotesPopover 
        elementKey={notePopoverElementKey} 
        onClose={() => setNotePopoverElementKey(null)} 
      />
      
      {/* Find & Replace */}
      <FindReplaceDialog 
        isOpen={isFindReplaceOpen} 
        onClose={() => setIsFindReplaceOpen(false)} 
      />
      
      {/* === NEW MODALS === */}
      {/* Go To Dialog */}
      <GoToDialog
        isOpen={isGoToOpen}
        onClose={() => setIsGoToOpen(false)}
        totalPages={pageCount}
        totalScenes={10}
        onGoToPage={(page) => console.log('Go to page:', page)}
        onGoToScene={(scene) => console.log('Go to scene:', scene)}
      />
      
      {/* Title Page Editor */}
      <TitlePageEditor
        isOpen={isTitlePageOpen}
        onClose={() => setIsTitlePageOpen(false)}
        data={titlePageData}
        onSave={setTitlePageData}
      />
      
      {/* Character Rename */}
      <CharacterRenameDialog
        isOpen={isCharRenameOpen}
        onClose={() => setIsCharRenameOpen(false)}
      />
      
      {/* Script Reports */}
      <ScriptReports
        isOpen={isReportsOpen}
        onClose={() => setIsReportsOpen(false)}
      />
      
      {/* Thesaurus */}
      <ThesaurusDialog
        isOpen={isThesaurusOpen}
        onClose={() => setIsThesaurusOpen(false)}
      />
      
      {/* Bookmarks Panel */}
      <BookmarksPanel
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        onBookmarksChange={setBookmarks}
        onNavigateToBookmark={(bookmark) => console.log('Navigate to:', bookmark)}
      />
      
      {/* === NEW PRODUCTION-READY DIALOGS === */}
      <PreferencesDialog
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        preferences={preferences}
        onSave={setPreferences}
      />
      
      <RevisionPanel
        isOpen={isRevisionPanelOpen}
        onClose={() => setIsRevisionPanelOpen(false)}
        config={revisionHook.config}
        onConfigChange={revisionHook.setConfig}
      />
      
      {/* === NEW PLUGINS === */}
      <SmartTypePlugin config={smartTypeConfig.config} />
      <BookmarksPlugin
        bookmarks={bookmarks}
        onBookmarksChange={setBookmarks}
        onNavigateToBookmark={(bookmark) => console.log('Navigate to:', bookmark)}
      />
      <SceneNumbersPlugin config={sceneNumbersConfig} />
      <MoresContinuedsPlugin config={moresContinuedsConfig} pageHeight={54} />
      {/* Page Break Plugin is registered inside useEffect */}
    </div>
  );
}

export default function ScriptEditor(props: any) {
  const { 
    isNavigatorOpen, setIsNavigatorOpen, isBeatBoardOpen, setIsBeatBoardOpen,
    isIndexCardsOpen, setIsIndexCardsOpen, isAnalysisOpen, setIsAnalysisOpen,
    isExportOpen, setIsExportOpen,
    isTypewriterEnabled, isFocusModeActive, setIsFocusModeActive,
    sceneNumbersConfig, moresContinuedsConfig,
    onToggleSidebar
  } = props;
  const [activeFormat, setActiveFormat] = useState("Action");
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const initialConfig = {
    namespace: "ScriptEditor",
    theme,
    onError,
    nodes: [
      SceneHeadingNode, ActionNode, CharacterNode, DialogueNode,
      ParentheticalNode, TokenNode, TransitionNode, ShotNode, DualDialogueNode,
      PageBreakNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorContent
        activeFormat={activeFormat} setActiveFormat={setActiveFormat}
        wordCount={wordCount} setWordCount={setWordCount}
        pageCount={pageCount} setPageCount={setPageCount}
        isNavigatorOpen={isNavigatorOpen} setIsNavigatorOpen={setIsNavigatorOpen}
        isBeatBoardOpen={isBeatBoardOpen} setIsBeatBoardOpen={setIsBeatBoardOpen}
        isIndexCardsOpen={isIndexCardsOpen} setIsIndexCardsOpen={setIsIndexCardsOpen}
        isAnalysisOpen={isAnalysisOpen} setIsAnalysisOpen={setIsAnalysisOpen}
        isExportOpen={isExportOpen} setIsExportOpen={setIsExportOpen}
        isTypewriterEnabled={isTypewriterEnabled}
        isFocusModeActive={isFocusModeActive}
        setIsFocusModeActive={setIsFocusModeActive}
        sceneNumbersConfig={sceneNumbersConfig}
        moresContinuedsConfig={moresContinuedsConfig}
        onToggleSidebar={onToggleSidebar}
      />
    </LexicalComposer>
  );
}
