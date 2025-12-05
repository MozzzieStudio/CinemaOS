import { useState, useRef, useEffect, useMemo } from "react";
import "./index.css";
import ScriptEditor from "./components/editor/ScriptEditor";
import ChatSidebar from "./components/ai/ChatSidebar";
import InfiniteCanvas from "./components/studio/InfiniteCanvas";
import PreProductionLayout from "./components/preproduction/PreProductionLayout";
import RevisionPanel from "./components/editor/RevisionPanel";
import WritingStatsPanel from "./components/editor/WritingStatsPanel";
import KeyboardShortcutsDialog from "./components/editor/KeyboardShortcutsDialog";
import { useSceneNumbers } from "./components/editor/plugins/SceneNumbersPlugin";
import { useMoresContinueds } from "./components/editor/plugins/MoresContinuedsPlugin";
import { createMenus } from "./config/menus";
import { Toaster } from "./components/ui/sonner";
import { CommandPalette } from "./components/CommandPalette";

type ViewMode = "writer" | "preproduction" | "studio";

const VIEW_MODES = [
  { id: "writer" as ViewMode, icon: "✍️", label: "Writer" },
  { id: "preproduction" as ViewMode, icon: "📋", label: "PreProd" },
  { id: "studio" as ViewMode, icon: "🎬", label: "Studio" },
];

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("writer");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Lifted State for Panels
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [isBeatBoardOpen, setIsBeatBoardOpen] = useState(false);
  const [isIndexCardsOpen, setIsIndexCardsOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // New FD13 Features
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [isTypewriterEnabled, setIsTypewriterEnabled] = useState(false);
  const [isRevisionPanelOpen, setIsRevisionPanelOpen] = useState(false);
  const [isWritingStatsOpen, setIsWritingStatsOpen] = useState(false);

  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Editor State
  const sceneNumbersConfig = useSceneNumbers();
  const moresContinuedsConfig = useMoresContinueds();

  const projectId = "project:demo";

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dispatchCommand = (type: string, payload?: any) => {
    window.dispatchEvent(new CustomEvent('editor-command', { detail: { type, payload } }));
  };

  // Menu definitions
  // Menu definitions
  const menus = useMemo(() => createMenus(
    dispatchCommand,
    {
      isNavigatorOpen, setIsNavigatorOpen,
      isBeatBoardOpen, setIsBeatBoardOpen,
      isIndexCardsOpen, setIsIndexCardsOpen,
      isFocusModeActive, setIsFocusModeActive,
      isTypewriterEnabled, setIsTypewriterEnabled,
      isRevisionPanelOpen, setIsRevisionPanelOpen,
      isWritingStatsOpen, setIsWritingStatsOpen,
      isAnalysisOpen, setIsAnalysisOpen,
      isSidebarOpen, setIsSidebarOpen,
      isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen
    },
    {
       sceneNumbers: { enabled: sceneNumbersConfig.config.enabled, toggle: sceneNumbersConfig.toggleEnabled },
       moresContinueds: { enabled: moresContinuedsConfig.config.enabled, toggle: moresContinuedsConfig.toggleEnabled }
    }
  ), [
    isNavigatorOpen, isBeatBoardOpen, isIndexCardsOpen, 
    isFocusModeActive, isTypewriterEnabled, 
    isRevisionPanelOpen, isWritingStatsOpen, 
    isAnalysisOpen, isSidebarOpen, isKeyboardShortcutsOpen,
    sceneNumbersConfig.config.enabled, moresContinuedsConfig.config.enabled
  ]);

  const handleFileOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        dispatchCommand('LOAD_CONTENT', ev.target?.result);
      };
      reader.readAsText(file);
    }
    e.target.value = ''; // Reset
  };

  const handleImportFDX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        dispatchCommand('IMPORT_FDX', ev.target?.result);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleImportPDF = () => {
    alert("PDF Import is currently experimental. Please use FDX for best results.");
    // Placeholder for PDF import logic
  };

  const renderContent = () => {
    switch (viewMode) {
      case "writer":
        return (
          <ScriptEditor 
            // Pass down state
            isNavigatorOpen={isNavigatorOpen} setIsNavigatorOpen={setIsNavigatorOpen}
            isBeatBoardOpen={isBeatBoardOpen} setIsBeatBoardOpen={setIsBeatBoardOpen}
            isIndexCardsOpen={isIndexCardsOpen} setIsIndexCardsOpen={setIsIndexCardsOpen}
            isAnalysisOpen={isAnalysisOpen} setIsAnalysisOpen={setIsAnalysisOpen}
            isExportOpen={isExportOpen} setIsExportOpen={setIsExportOpen}
            // FD13 Features
            isTypewriterEnabled={isTypewriterEnabled}
            isFocusModeActive={isFocusModeActive}
            setIsFocusModeActive={setIsFocusModeActive}
            sceneNumbersConfig={sceneNumbersConfig.config}
            moresContinuedsConfig={moresContinuedsConfig.config}
            // AI Sidebar
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        );
      case "preproduction":
        return <PreProductionLayout projectId={projectId} />;
      case "studio":
        return <InfiniteCanvas />;
    }
  };

  return (
    <div className="h-screen flex bg-[#0a0a0a] text-white overflow-hidden">
      {/* Hidden Inputs for File Actions */}
      <input type="file" id="file-open" className="hidden" accept=".json,.txt" onChange={handleFileOpen} />
      <input type="file" id="file-import-fdx" className="hidden" accept=".fdx" onChange={handleImportFDX} />
      <input type="file" id="file-import-pdf" className="hidden" accept=".pdf" onChange={handleImportPDF} />

      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <aside className="w-16 bg-[#0f0f0f] border-r border-white/[0.06] flex flex-col items-center py-3 shrink-0">
        {/* Logo */}
        <div className="w-10 h-10 mb-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-500/20 cursor-pointer hover:scale-105 transition-transform">
          C
        </div>

        {/* Mode Tabs */}
        <nav className="flex-1 flex flex-col gap-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              title={mode.label}
              className={`group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                viewMode === mode.id
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-white/40 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <span className="text-lg">{mode.icon}</span>
              
              {/* Active indicator */}
              {viewMode === mode.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r" />
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-[#252525] rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
                {mode.label}
              </div>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-1">
          {/* User Avatar */}
          <div className="w-9 h-9 mx-auto mt-2 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-white/10 cursor-pointer hover:border-violet-500/50 transition-colors" />
        </div>
      </aside>

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP MENU BAR */}
        <header 
          ref={menuRef}
          className="h-9 bg-[#151515] border-b border-white/[0.06] flex items-center px-2 shrink-0"
          data-tauri-drag-region
        >
          {/* Menus */}
          <div className="flex items-center">
            {menus.map((menu) => (
              <div key={menu.id} className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                  onMouseEnter={() => activeMenu && setActiveMenu(menu.id)}
                  className={`px-3 py-1 text-[13px] rounded transition-colors ${
                    activeMenu === menu.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {menu.label}
                </button>

                {/* Dropdown */}
                {activeMenu === menu.id && (
                  <div className="absolute top-full left-0 mt-0.5 min-w-[220px] bg-[#1e1e1e]/98 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-1 z-50">
                    {menu.items.map((item: any, i) =>
                      item.divider ? (
                        <div key={i} className="h-px bg-white/[0.08] my-1 mx-2" />
                      ) : (
                        <button
                          key={i}
                          onClick={() => { item.action?.(); setActiveMenu(null); }}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-[13px] text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            {item.icon && <span className="text-sm">{item.icon}</span>}
                            {item.label}
                          </span>
                          {item.shortcut && (
                            <span className="text-white/30 text-[11px] ml-6">{item.shortcut}</span>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Center: Project Name */}
          <div className="flex-1 flex justify-center" data-tauri-drag-region>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] text-white/40">Untitled Screenplay</span>
            </div>
          </div>

          {/* Right: AI Crew Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="AI Crew"
              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isSidebarOpen
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
              <span className="hidden sm:inline">AI Crew</span>
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex opacity-100 flex-1 min-h-0 relative" onClick={() => setActiveMenu(null)}>
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {renderContent()}
          </div>

          {/* Right Side Panels - Overlay for Writer Mode */}
          {viewMode === "writer" && (
            <>
              <RevisionPanel isOpen={isRevisionPanelOpen} onClose={() => setIsRevisionPanelOpen(false)} />
              <WritingStatsPanel isOpen={isWritingStatsOpen} onClose={() => setIsWritingStatsOpen(false)} />
            </>
          )}

          {/* AI Sidebar - Responsive Overlay */}
          {isSidebarOpen && (
            <div className="absolute right-0 top-0 bottom-0 z-40 w-full sm:w-80 md:static md:w-80 md:shrink-0 border-l border-white/[0.06] bg-[#0a0a0a] animate-in slide-in-from-right duration-200 shadow-2xl md:shadow-none">
              <ChatSidebar />
            </div>
          )}
        </main>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        isOpen={isKeyboardShortcutsOpen} 
        onClose={() => setIsKeyboardShortcutsOpen(false)} 
      />
      
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        setIsOpen={setIsCommandPaletteOpen}
        dispatchCommand={dispatchCommand}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      
      <Toaster />
    </div>
  );
}

export default App;
