/**
 * ExportImportPanel — Import/Export screenplay files
 * 
 * Supports:
 * - FDX (Final Draft) import/export
 * - PDF export
 * - Fountain import (future)
 */

import { useState, useRef } from 'react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { importFDX, downloadFDX, loadFDXFromFile } from '../../utils/fdxFormat';
import { exportPDF, printScreenplay } from '../../utils/pdfExport';

interface ExportImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportImportPanel({ isOpen, onClose }: ExportImportPanelProps) {
  const [editor] = useLexicalComposerContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [title, setTitle] = useState('Untitled Screenplay');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportFDX = async () => {
    setIsExporting(true);
    try {
      downloadFDX(editor, title);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      exportPDF(editor, title);
    } catch (error) {
      console.error('Export failed:', error);
    }
    setIsExporting(false);
  };

  const handlePrint = () => {
    printScreenplay(editor, title);
  };

  const handleImportFDX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await loadFDXFromFile(file);
      importFDX(editor, content);
      setTitle(file.name.replace('.fdx', ''));
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
    }
    setIsImporting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="w-[500px] bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📁</span>
            <h2 className="text-lg font-bold">Import / Export</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-2">
              SCREENPLAY TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-accent)] text-lg"
              placeholder="Enter title..."
            />
          </div>

          {/* Export Section */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-3">
              EXPORT
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* FDX Export */}
              <button
                onClick={handleExportFDX}
                disabled={isExporting}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📄</span>
                </div>
                <span className="font-medium">.fdx</span>
                <span className="text-xs text-[var(--color-text-muted)]">Final Draft</span>
              </button>

              {/* PDF Export */}
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📕</span>
                </div>
                <span className="font-medium">.pdf</span>
                <span className="text-xs text-[var(--color-text-muted)]">Print-ready</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-3">
              IMPORT
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".fdx"
              onChange={handleImportFDX}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-lg text-[var(--color-text-muted)] hover:text-white transition-all"
            >
              {isImporting ? (
                <>
                  <div className="spinner" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span>Import .fdx file</span>
                </>
              )}
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="w-full btn-secondary flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247" />
            </svg>
            Print Screenplay
          </button>

          {/* Formats Info */}
          <div className="text-xs text-[var(--color-text-muted)] space-y-1">
            <p><strong>.fdx</strong> — Final Draft 10+ compatible XML format</p>
            <p><strong>.pdf</strong> — Industry-standard US Letter format</p>
          </div>
        </div>
      </div>
    </div>
  );
}
