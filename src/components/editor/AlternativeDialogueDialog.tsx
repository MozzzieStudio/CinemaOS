
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface AlternativeDialogueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodeKey: string | null;
  currentText: string;
}

export default function AlternativeDialogueDialog({ isOpen, onClose, nodeKey, currentText }: AlternativeDialogueDialogProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentText);  // Start with current text to edit easier
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeKey) return;
    
    // Dispatch event back to plugin
    window.dispatchEvent(new CustomEvent('submit-alt-dialogue', {
      detail: { nodeKey, text: value }
    }));
    
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-[500px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-scale">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#1f1f1f]">
          <h3 className="text-white font-medium flex items-center gap-2">
            <span className="text-violet-400">⚡</span> Add Alternative Dialogue
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-white/40 mb-2 uppercase tracking-wide">New Alternative</label>
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-32 bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-violet-500/50 focus:outline-none transition-colors font-mono resize-none"
              placeholder="Type alternative version..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-lg shadow-violet-500/20 transition-all">Save Alternative</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
