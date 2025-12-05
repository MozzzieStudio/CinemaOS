import { useEffect } from "react";
import { Command } from "cmdk";
import { 
  Search, FileText, Save, 
  Type, Layout, MonitorPlay,
  RotateCcw, RotateCw, Scissors, Clipboard,
  SpellCheck, Book, MoveVertical, Globe
} from "lucide-react";


interface CommandPaletteProps {
  dispatchCommand: (type: string, payload?: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  viewMode: string;
  setViewMode: (mode: "writer" | "preproduction" | "studio") => void;
}

export function CommandPalette({ 
  dispatchCommand, 
  isOpen, 
  setIsOpen,
  viewMode,
  setViewMode 
}: CommandPaletteProps) {
  
  // Toggle with Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen]);

  // Execute and move
  const run = (fn: () => void) => {
    fn();
    setIsOpen(false);
  };

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      label="Global Command Menu"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-[#161616]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center border-b border-white/10 px-3">
        <Search className="w-5 h-5 text-white/40 mr-2" />
        <Command.Input 
          placeholder="Type a command or search..."
          className="flex-1 h-12 bg-transparent outline-none text-white placeholder:text-white/30 text-sm font-medium"
        />
        <div className="flex gap-1">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/40 font-mono">ESC</kbd>
        </div>
      </div>

      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 scroll-smooth">
        <Command.Empty className="py-6 text-center text-sm text-white/40">
          No results found.
        </Command.Empty>

        {viewMode === 'writer' && (
          <Command.Group heading="Writer Actions" className="px-2 py-1.5 text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-1">
            <CommandItem onSelect={() => run(() => dispatchCommand('SAVE'))} icon={<Save />} shortcut="Ctrl+S">
              Save Script
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('EXPORT_FDX'))} icon={<FileText />} shortcut="">
              Export as FDX
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('SAVE_AS'))} icon={<Save />} shortcut="Ctrl+Shift+S">
              Save As...
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('UNDO'))} icon={<RotateCcw />} shortcut="Ctrl+Z">
              Undo
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('REDO'))} icon={<RotateCw />} shortcut="Ctrl+Y">
              Redo
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('CUT'))} icon={<Scissors />} shortcut="Ctrl+X">
              Cut
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('COPY'))} icon={<Clipboard />} shortcut="Ctrl+C">
              Copy
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('PASTE'))} icon={<Clipboard />} shortcut="Ctrl+V">
              Paste
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('PAGE_BREAK'))} icon={<MoveVertical />} shortcut="Ctrl+Enter">
              Insert Page Break
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('FORMAT_ELEMENT', 'Scene'))} icon={<Type />} shortcut="Ctrl+1">
              Format: Scene Heading
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('FORMAT_ELEMENT', 'Action'))} icon={<Type />} shortcut="Ctrl+2">
              Format: Action
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('FORMAT_ELEMENT', 'Character'))} icon={<Type />} shortcut="Ctrl+3">
              Format: Character
            </CommandItem>
            <CommandItem onSelect={() => run(() => dispatchCommand('FORMAT_ELEMENT', 'Dialogue'))} icon={<Type />} shortcut="Ctrl+4">
              Format: Dialogue
            </CommandItem>
          </Command.Group>
        )}

        <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-1">
          <CommandItem onSelect={() => run(() => setViewMode('writer'))} icon={<FileText />} shortcut="">
            Switch to Writer
          </CommandItem>
          <CommandItem onSelect={() => run(() => setViewMode('preproduction'))} icon={<Layout />} shortcut="">
            Switch to Visual Bible
          </CommandItem>
          <CommandItem onSelect={() => run(() => setViewMode('studio'))} icon={<MonitorPlay />} shortcut="">
            Switch to Studio
          </CommandItem>
        </Command.Group>

        <Command.Group heading="Analysis & Tools" className="px-2 py-1.5 text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-1">
           <CommandItem onSelect={() => run(() => dispatchCommand('REPORTS'))} icon={<FileText />} shortcut="">
            Script Reports
          </CommandItem>
           <CommandItem onSelect={() => run(() => dispatchCommand('THESAURUS'))} icon={<Book />} shortcut="Shift+F7">
            Thesaurus
          </CommandItem>
           <CommandItem onSelect={() => run(() => dispatchCommand('SPELLING'))} icon={<SpellCheck />} shortcut="F7">
            Toggle Spell Check
          </CommandItem>
           <CommandItem onSelect={() => run(() => dispatchCommand('CHARACTER_RENAME'))} icon={<Type />} shortcut="">
            Character Rename
          </CommandItem>
           <CommandItem onSelect={() => run(() => dispatchCommand('BOOKMARKS'))} icon={<Globe />} shortcut="Ctrl+Shift+B">
            Bookmarks
          </CommandItem>
        </Command.Group>

      </Command.List>
    </Command.Dialog>
  );
}

function CommandItem({ children, onSelect, icon, shortcut }: any) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 aria-selected:bg-violet-500/20 aria-selected:text-white aria-selected:cursor-pointer transition-all mb-1 group"
    >
      <div className="w-5 h-5 flex items-center justify-center text-white/40 group-aria-selected:text-violet-300">
        {icon}
      </div>
      <span className="flex-1">{children}</span>
      {shortcut && <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-white/5 group-aria-selected:bg-white/10 rounded text-[10px] text-white/30 group-aria-selected:text-white/50 font-mono">{shortcut}</kbd>}
    </Command.Item>
  );
}
