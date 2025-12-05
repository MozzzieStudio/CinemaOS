/**
 * WriterMenuBar — Professional Menu Bar like Final Draft 13
 * 
 * Menus: File, Edit, View, Format, Production, Tools, Help
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import {
  $createSceneHeadingNode,
  $createActionNode,
  $createCharacterNode,
  $createDialogueNode,
  $createParentheticalNode,
  $createTransitionNode,
} from './nodes/ScriptNodes';

interface MenuItemProps {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  submenu?: MenuItemProps[];
}

interface MenuProps {
  label: string;
  items: MenuItemProps[];
}

interface WriterMenuBarProps {
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onOpenNavigator?: () => void;
  onOpenBeatBoard?: () => void;
  onOpenIndexCards?: () => void;
  onOpenAnalysis?: () => void;
  projectName?: string;
}

export default function WriterMenuBar({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onExport,
  onPrint,
  onOpenNavigator,
  onOpenBeatBoard,
  onOpenIndexCards,
  onOpenAnalysis,
  projectName = "Untitled"
}: WriterMenuBarProps) {
  const [editor] = useLexicalComposerContext();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format commands
  const applyFormat = useCallback((nodeCreator: () => any) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length > 0) {
          const anchorNode = selection.anchor.getNode();
          const topLevelNode = anchorNode.getTopLevelElement();
          if (topLevelNode) {
            const newNode = nodeCreator();
            const text = topLevelNode.getTextContent();
            topLevelNode.replace(newNode);
            if (text) {
              newNode.selectEnd();
            }
          }
        }
      }
    });
    setActiveMenu(null);
  }, [editor]);

  const menus: MenuProps[] = [
    {
      label: 'File',
      items: [
        { label: 'New Script', shortcut: 'Ctrl+N', onClick: onNewProject },
        { label: 'Open...', shortcut: 'Ctrl+O', onClick: onOpenProject },
        { divider: true, label: '' },
        { label: 'Save', shortcut: 'Ctrl+S', onClick: onSaveProject },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
        { divider: true, label: '' },
        { label: 'Import FDX...', onClick: onExport },
        { label: 'Export', submenu: [
          { label: 'Final Draft (.fdx)', onClick: onExport },
          { label: 'PDF', onClick: onPrint },
          { label: 'Fountain (.fountain)' },
          { label: 'Plain Text (.txt)' },
        ]},
        { divider: true, label: '' },
        { label: 'Page Setup...' },
        { label: 'Print...', shortcut: 'Ctrl+P', onClick: onPrint },
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', onClick: () => editor.dispatchCommand(UNDO_COMMAND, undefined) },
        { label: 'Redo', shortcut: 'Ctrl+Y', onClick: () => editor.dispatchCommand(REDO_COMMAND, undefined) },
        { divider: true, label: '' },
        { label: 'Cut', shortcut: 'Ctrl+X' },
        { label: 'Copy', shortcut: 'Ctrl+C' },
        { label: 'Paste', shortcut: 'Ctrl+V' },
        { label: 'Paste and Match Style', shortcut: 'Ctrl+Shift+V' },
        { divider: true, label: '' },
        { label: 'Select All', shortcut: 'Ctrl+A' },
        { divider: true, label: '' },
        { label: 'Find & Replace...', shortcut: 'Ctrl+F' },
        { label: 'Go to Scene...', shortcut: 'Ctrl+G' },
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Navigator', shortcut: 'Ctrl+Shift+N', onClick: onOpenNavigator },
        { label: 'Beat Board', onClick: onOpenBeatBoard },
        { label: 'Index Cards', onClick: onOpenIndexCards },
        { label: 'AI Analysis', onClick: onOpenAnalysis },
        { divider: true, label: '' },
        { label: 'Page View', shortcut: 'Ctrl+Shift+P' },
        { label: 'Script View' },
        { divider: true, label: '' },
        { label: 'Zoom In', shortcut: 'Ctrl+=' },
        { label: 'Zoom Out', shortcut: 'Ctrl+-' },
        { label: 'Zoom to Fit' },
        { divider: true, label: '' },
        { label: 'Full Screen', shortcut: 'F11' },
        { label: 'Focus Mode', shortcut: 'Ctrl+Shift+F' },
      ]
    },
    {
      label: 'Insert',
      items: [
        { label: 'Title Page' },
        { label: 'Scene Number' },
        { label: 'Bookmark' },
        { label: 'Mores/Continueds' },
      ]
    },
    {
      label: 'Format',
      items: [
        { label: 'Scene Heading', shortcut: 'Ctrl+1', onClick: () => applyFormat($createSceneHeadingNode) },
        { label: 'Action', shortcut: 'Ctrl+2', onClick: () => applyFormat($createActionNode) },
        { label: 'Character', shortcut: 'Ctrl+3', onClick: () => applyFormat($createCharacterNode) },
        { label: 'Dialogue', shortcut: 'Ctrl+4', onClick: () => applyFormat($createDialogueNode) },
        { label: 'Parenthetical', shortcut: 'Ctrl+5', onClick: () => applyFormat($createParentheticalNode) },
        { label: 'Transition', shortcut: 'Ctrl+6', onClick: () => applyFormat($createTransitionNode) },
        { divider: true, label: '' },
        { label: 'Dual Dialogue', shortcut: 'Ctrl+D' },
        { divider: true, label: '' },
        { label: 'Bold', shortcut: 'Ctrl+B' },
        { label: 'Italic', shortcut: 'Ctrl+I' },
        { label: 'Underline', shortcut: 'Ctrl+U' },
        { divider: true, label: '' },
        { label: 'Uppercase', shortcut: 'Ctrl+Shift+U' },
      ]
    },
    {
      label: 'Production',
      items: [
        { label: 'Scene Numbers...', },
        { label: 'Revision Mode...' },
        { divider: true, label: '' },
        { label: 'Reports', submenu: [
          { label: 'Scene Report' },
          { label: 'Character Report' },
          { label: 'Location Report' },
          { label: 'Cast List' },
        ]},
        { label: 'Breakdown Tags...' },
        { divider: true, label: '' },
        { label: 'Compare Scripts...' },
        { label: 'Merge Scripts...' },
      ]
    },
    {
      label: 'Tools',
      items: [
        { label: 'Spelling...', shortcut: 'F7' },
        { label: 'Thesaurus...', shortcut: 'Shift+F7' },
        { divider: true, label: '' },
        { label: 'AI Assistant', submenu: [
          { label: 'Generate Scene...' },
          { label: 'Improve Dialogue...' },
          { label: 'Character Voice Analysis' },
          { label: 'Pacing Suggestions' },
        ]},
        { divider: true, label: '' },
        { label: 'Name Database...' },
        { label: 'Script Notes...' },
        { divider: true, label: '' },
        { label: 'Preferences...', shortcut: 'Ctrl+,' },
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/' },
        { label: 'User Guide' },
        { label: 'Video Tutorials' },
        { divider: true, label: '' },
        { label: 'Sample Scripts', submenu: [
          { label: 'Feature Film Template' },
          { label: 'TV Pilot Template' },
          { label: 'Short Film Template' },
        ]},
        { divider: true, label: '' },
        { label: 'Check for Updates...' },
        { label: 'About Cinema OS' },
      ]
    },
  ];

  const renderMenuItem = (item: MenuItemProps, index: number) => {
    if (item.divider) {
      return <div key={index} className="h-px bg-white/10 my-1" />;
    }

    return (
      <button
        key={index}
        onClick={item.onClick}
        disabled={item.disabled}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-sm rounded transition-colors ${
          item.disabled 
            ? 'text-white/30 cursor-not-allowed' 
            : 'text-white/90 hover:bg-white/10'
        }`}
      >
        <span>{item.label}</span>
        {item.shortcut && (
          <span className="text-xs text-white/40 ml-4">{item.shortcut}</span>
        )}
        {item.submenu && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 ml-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <div ref={menuBarRef} className="flex items-center bg-[#1a1a1a] border-b border-white/10">
      {/* Window Controls (macOS style) */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 cursor-pointer" />
      </div>

      {/* Menu Items */}
      <div className="flex items-center">
        {menus.map((menu) => (
          <div key={menu.label} className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
              onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
              className={`px-3 py-2 text-sm transition-colors ${
                activeMenu === menu.label
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {menu.label}
            </button>

            {/* Dropdown */}
            {activeMenu === menu.label && (
              <div className="absolute top-full left-0 mt-px min-w-[220px] bg-[#252525] border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-fade-in">
                {menu.items.map((item, i) => renderMenuItem(item, i))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Project Name (Center) */}
      <div className="flex-1 flex justify-center">
        <span className="text-sm text-white/50">{projectName}</span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 px-3">
        <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
