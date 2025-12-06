/**
 * ExportImportPanel — Import/Export screenplay files
 * 
 * Supports:
 * - FDX (Final Draft) import/export
 * - PDF export with Watermark & Revision Colors
 * - Fountain import/export
 */

import React, { useState, useRef } from 'react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { importFDX, downloadFDX, loadFDXFromFile } from '../../utils/fdxFormat';
import { downloadPDF, RevisionConfig, REVISION_COLORS } from '../../lib/pdfExport';
import { printScreenplay } from '../../utils/pdfExport';
import { downloadFountain, loadFountainFile, fountainToScript, scriptToFountain } from '../../utils/fountainFormat';
import WatermarkDialog, { WatermarkConfig, DEFAULT_WATERMARK_CONFIG } from './WatermarkDialog';
import { extractElementsFromRoot } from '../../lib/pagination';
import { $getRoot, $createTextNode } from 'lexical';
import {
  $createSceneHeadingNode, $createActionNode, $createCharacterNode,
  $createDialogueNode, $createParentheticalNode, $createTransitionNode,
} from "./nodes/ScriptNodes";
import { toast } from 'sonner';

interface ExportImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  titlePageData?: any;
}

export default function ExportImportPanel({ isOpen, onClose, titlePageData }: ExportImportPanelProps) {
  const [editor] = useLexicalComposerContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [title, setTitle] = useState('Untitled Screenplay');
  
  const fdxInputRef = useRef<HTMLInputElement>(null);
  const fountainInputRef = useRef<HTMLInputElement>(null);

  // Export Configuration
  const [showWatermarkDialog, setShowWatermarkDialog] = useState(false);
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [selectedRevisionColor, setSelectedRevisionColor] = useState('WHITE');
  const [showRevisionAsterisks, setShowRevisionAsterisks] = useState(true);

  const handleExportFDX = async () => {
    setIsExporting(true);
    try {
      downloadFDX(editor, title);
      toast.success('Exported FDX successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export FDX');
    }
    setIsExporting(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      editor.getEditorState().read(async () => {
        const root = $getRoot();
        const elements = extractElementsFromRoot(root.getChildren());
        
        const revisionConfig: RevisionConfig = {
          enabled: selectedRevisionColor !== 'WHITE',
          colorName: selectedRevisionColor,
          colorHex: REVISION_COLORS[selectedRevisionColor]?.hex || '#ffffff',
          date: selectedRevisionColor !== 'WHITE' ? new Date().toLocaleDateString() : undefined,
          showAsterisks: showRevisionAsterisks
        };

        // Use custom watermark if enabled, otherwise undefined
        const activeWatermark = watermarkConfig.enabled ? watermarkConfig : undefined;

        await downloadPDF(elements, `${title}.pdf`, titlePageData, {
          watermark: activeWatermark,
          revision: revisionConfig
        });
        toast.success('Exported PDF successfully');
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export PDF');
    }
    setIsExporting(false);
  };

  const handleExportFountain = async () => {
    setIsExporting(true);
    try {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const elements = extractElementsFromRoot(root.getChildren());
        const fountainElements = scriptToFountain(elements);
        downloadFountain(fountainElements, title, titlePageData);
        toast.success('Exported Fountain successfully');
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export Fountain');
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
      toast.success('Imported FDX successfully');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import FDX');
    }
    setIsImporting(false);
    if (fdxInputRef.current) fdxInputRef.current.value = '';
  };

  const handleImportFountain = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const doc = await loadFountainFile(file);
      const elements = fountainToScript(doc);
      
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        elements.forEach(el => {
            let node;
            const text = el.text || '';
            switch (el.type) {
                case 'Scene': node = $createSceneHeadingNode(); break;
                case 'Action': node = $createActionNode(); break;
                case 'Character': node = $createCharacterNode(); break;
                case 'Dialogue': node = $createDialogueNode(); break;
                case 'Paren': node = $createParentheticalNode(); break;
                case 'Trans': node = $createTransitionNode(); break;
                default: node = $createActionNode(); break;
            }
            if (text) node.append($createTextNode(text));
            root.append(node);
        });
      });
      setTitle(file.name.replace(/\.(fountain|spmd|txt)$/, ''));
      onClose();
      toast.success('Imported Fountain successfully');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import Fountain');
    }
    setIsImporting(false);
    if (fountainInputRef.current) fountainInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
        <div className="w-[600px] bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <h2 className="text-lg font-bold text-white">Import / Export</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                SCREENPLAY TITLE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-cyan-500 text-lg text-white"
                placeholder="Enter title..."
              />
            </div>

            {/* Export Section */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-3 uppercase">
                Export Options
              </label>
              
              {/* PDF Settings */}
              <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-medium text-white">PDF Settings</span>
                   <button 
                     onClick={() => setShowWatermarkDialog(true)}
                     className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                   >
                     {watermarkConfig.enabled ? 'Edit Watermark' : 'Add Watermark'}
                   </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-white/50 mb-1.5">Page Color</label>
                    <select
                      value={selectedRevisionColor}
                      onChange={(e) => setSelectedRevisionColor(e.target.value)}
                      className="w-full px-2 py-1.5 bg-black/20 border border-white/10 rounded text-sm text-white focus:border-cyan-500 outline-none"
                    >
                      <option value="WHITE">None (White)</option>
                      {Object.keys(REVISION_COLORS).filter(c => c !== 'WHITE').map(color => (
                        <option key={color} value={color}>{color.charAt(0) + color.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-white/50 mb-1.5">Revisions</label>
                    <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showRevisionAsterisks}
                        onChange={e => setShowRevisionAsterisks(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 checked:bg-cyan-500 accent-cyan-500" 
                      />
                      Show Asterisks (*)
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* FDX Export */}
                <button
                  onClick={handleExportFDX}
                  disabled={isExporting}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">📄</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-medium text-white text-sm">.fdx</span>
                    <span className="text-[10px] text-white/40">Final Draft</span>
                  </div>
                </button>

                {/* PDF Export */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-red-500/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">📕</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-medium text-white text-sm">.pdf</span>
                    <span className="text-[10px] text-white/40">Print Ready</span>
                  </div>
                </button>
                
                {/* Fountain Export */}
                <button
                  onClick={handleExportFountain}
                  disabled={isExporting}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl">⛲</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-medium text-white text-sm">.fountain</span>
                    <span className="text-[10px] text-white/40">Open Standard</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-3 uppercase">
                Import
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  ref={fdxInputRef}
                  type="file"
                  accept=".fdx"
                  onChange={handleImportFDX}
                  className="hidden"
                />
                <button
                  onClick={() => fdxInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center justify-center gap-2 p-3 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all text-sm"
                >
                  <span className="text-blue-400">📄</span>
                  Import .fdx
                </button>

                <input
                  ref={fountainInputRef}
                  type="file"
                  accept=".fountain,.spmd,.txt"
                  onChange={handleImportFountain}
                  className="hidden"
                />
                <button
                  onClick={() => fountainInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center justify-center gap-2 p-3 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all text-sm"
                >
                  <span className="text-emerald-400">⛲</span>
                  Import .fountain
                </button>
              </div>
            </div>
            
            {/* Print Button */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handlePrint}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247" />
                </svg>
                Print via Browser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark Dialog */}
      <WatermarkDialog 
        isOpen={showWatermarkDialog}
        onClose={() => setShowWatermarkDialog(false)}
        config={watermarkConfig}
        onSave={setWatermarkConfig}
      />
    </>
  );
}
