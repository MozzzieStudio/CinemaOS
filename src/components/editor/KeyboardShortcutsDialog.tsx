/**
 * KeyboardShortcutsDialog — Reference for all keyboard shortcuts
 * 
 * Accessible via Help > Keyboard Shortcuts
 */

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: 'Elements', items: [
    { keys: 'Ctrl+1', action: 'Scene Heading' },
    { keys: 'Ctrl+2', action: 'Action' },
    { keys: 'Ctrl+3', action: 'Character' },
    { keys: 'Ctrl+4', action: 'Dialogue' },
    { keys: 'Ctrl+5', action: 'Parenthetical' },
    { keys: 'Ctrl+6', action: 'Transition' },
    { keys: 'Tab', action: 'Cycle element types' },
  ]},
  { category: 'Formatting', items: [
    { keys: 'Ctrl+B', action: 'Bold' },
    { keys: 'Ctrl+I', action: 'Italic' },
    { keys: 'Ctrl+U', action: 'Underline' },
  ]},
  { category: 'Editing', items: [
    { keys: 'Ctrl+Z', action: 'Undo' },
    { keys: 'Ctrl+Shift+Z', action: 'Redo' },
    { keys: 'Ctrl+F', action: 'Find' },
    { keys: 'Ctrl+H', action: 'Find & Replace' },
    { keys: 'Ctrl+G', action: 'Go To Page/Scene' },
  ]},
  { category: 'Insert', items: [
    { keys: 'Ctrl+Enter', action: 'Page Break' },
    { keys: 'Ctrl+D', action: 'Dual Dialogue' },
    { keys: 'Ctrl+N', action: 'Add Script Note' },
  ]},
  { category: 'Tools', items: [
    { keys: 'Shift+F7', action: 'Thesaurus' },
    { keys: 'Ctrl+Shift+B', action: 'Bookmarks' },
  ]},
  { category: 'View', items: [
    { keys: 'Ctrl++', action: 'Zoom In' },
    { keys: 'Ctrl+-', action: 'Zoom Out' },
    { keys: 'Ctrl+0', action: 'Reset Zoom' },
  ]},
];

export default function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
            <p className="text-xs text-white/40 mt-0.5">Quick reference for all available shortcuts</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div 
                      key={item.keys}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm text-white/70">{item.action}</span>
                      <kbd className="px-2 py-0.5 text-xs font-mono bg-white/10 text-white/60 rounded border border-white/10">
                        {item.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/2">
          <p className="text-xs text-white/30 text-center">
            Press <kbd className="px-1 py-0.5 mx-1 bg-white/5 rounded text-white/50 font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
