/**
 * TemplateGallery — Script template picker
 * 
 * Built-in templates for different screenplay formats
 */

import { useState } from 'react';

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'film' | 'tv' | 'theater' | 'other';
  icon: string;
  pageLayout: {
    margins: { top: number; bottom: number; left: number; right: number };
    fontSize: number;
    lineSpacing: number;
  };
  elements: {
    [key: string]: {
      marginLeft: number;
      marginRight: number;
      uppercase?: boolean;
      bold?: boolean;
    };
  };
  initialContent?: string;
}

const TEMPLATES: ScriptTemplate[] = [
  {
    id: 'feature-film',
    name: 'Feature Film',
    description: 'Standard Hollywood screenplay format (90-120 pages)',
    category: 'film',
    icon: '🎬',
    pageLayout: {
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      fontSize: 12,
      lineSpacing: 1,
    },
    elements: {
      'scene-heading': { marginLeft: 0, marginRight: 0, uppercase: true },
      'action': { marginLeft: 0, marginRight: 0 },
      'character': { marginLeft: 3.7, marginRight: 0, uppercase: true },
      'parenthetical': { marginLeft: 3.1, marginRight: 2.3 },
      'dialogue': { marginLeft: 2.5, marginRight: 2.5 },
      'transition': { marginLeft: 0, marginRight: 0, uppercase: true },
    },
    initialContent: 'FADE IN:\n\nINT. LOCATION - DAY\n\nAction description goes here.\n\nCHARACTER\nDialogue goes here.',
  },
  {
    id: 'tv-drama',
    name: 'TV Drama (1 Hour)',
    description: 'Television drama format with act breaks (55-65 pages)',
    category: 'tv',
    icon: '📺',
    pageLayout: {
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      fontSize: 12,
      lineSpacing: 1,
    },
    elements: {
      'scene-heading': { marginLeft: 0, marginRight: 0, uppercase: true },
      'action': { marginLeft: 0, marginRight: 0 },
      'character': { marginLeft: 3.7, marginRight: 0, uppercase: true },
      'parenthetical': { marginLeft: 3.1, marginRight: 2.3 },
      'dialogue': { marginLeft: 2.5, marginRight: 2.5 },
      'transition': { marginLeft: 0, marginRight: 0, uppercase: true },
    },
    initialContent: 'TEASER\n\nFADE IN:\n\nINT. LOCATION - DAY\n\nAction.\n\nCHARACTER\nDialogue.\n\nEND OF TEASER\n\nACT ONE',
  },
  {
    id: 'sitcom',
    name: 'Sitcom (Multi-Cam)',
    description: 'Traditional sitcom format with double-spacing (40-50 pages)',
    category: 'tv',
    icon: '😄',
    pageLayout: {
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      fontSize: 12,
      lineSpacing: 2,
    },
    elements: {
      'scene-heading': { marginLeft: 0, marginRight: 0, uppercase: true, bold: true },
      'action': { marginLeft: 0, marginRight: 0, uppercase: true },
      'character': { marginLeft: 0, marginRight: 0, uppercase: true },
      'parenthetical': { marginLeft: 0.5, marginRight: 0 },
      'dialogue': { marginLeft: 0, marginRight: 0 },
      'transition': { marginLeft: 0, marginRight: 0, uppercase: true },
    },
    initialContent: 'COLD OPEN\n\nSCENE A\n\nINT. LIVING ROOM - DAY (DAY 1)\n\n(ACTION IN UPPERCASE)\n\nCHARACTER\n(parenthetical)\nDialogue in mixed case.',
  },
  {
    id: 'single-cam',
    name: 'TV Comedy (Single-Cam)',
    description: 'Modern single-camera comedy format (22-32 pages)',
    category: 'tv',
    icon: '🎥',
    pageLayout: {
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      fontSize: 12,
      lineSpacing: 1,
    },
    elements: {
      'scene-heading': { marginLeft: 0, marginRight: 0, uppercase: true },
      'action': { marginLeft: 0, marginRight: 0 },
      'character': { marginLeft: 3.7, marginRight: 0, uppercase: true },
      'parenthetical': { marginLeft: 3.1, marginRight: 2.3 },
      'dialogue': { marginLeft: 2.5, marginRight: 2.5 },
      'transition': { marginLeft: 0, marginRight: 0, uppercase: true },
    },
  },
  {
    id: 'stage-play',
    name: 'Stage Play',
    description: 'Theater format with stage directions',
    category: 'theater',
    icon: '🎭',
    pageLayout: {
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      fontSize: 12,
      lineSpacing: 1,
    },
    elements: {
      'scene-heading': { marginLeft: 0, marginRight: 0, uppercase: true, bold: true },
      'action': { marginLeft: 0.5, marginRight: 0 },
      'character': { marginLeft: 0, marginRight: 0, uppercase: true, bold: true },
      'dialogue': { marginLeft: 0.5, marginRight: 0 },
    },
    initialContent: 'ACT ONE\n\nSCENE 1\n\nAT RISE: Description of the set.\n\nCHARACTER\nDialogue.',
  },
  {
    id: 'short-film',
    name: 'Short Film',
    description: 'Compact format for short films (5-40 pages)',
    category: 'film',
    icon: '🎞️',
    pageLayout: {
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      fontSize: 12,
      lineSpacing: 1,
    },
    elements: {
      'scene-heading': { marginLeft: 0, marginRight: 0, uppercase: true },
      'action': { marginLeft: 0, marginRight: 0 },
      'character': { marginLeft: 3.7, marginRight: 0, uppercase: true },
      'dialogue': { marginLeft: 2.5, marginRight: 2.5 },
    },
  },
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start from scratch with default settings',
    category: 'other',
    icon: '📝',
    pageLayout: {
      margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
      fontSize: 12,
      lineSpacing: 1,
    },
    elements: {},
  },
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ScriptTemplate) => void;
}

export default function TemplateGallery({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'film' | 'tv' | 'theater' | 'other'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);

  if (!isOpen) return null;

  const filteredTemplates = selectedCategory === 'all' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === selectedCategory);

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-4xl h-[80vh] bg-[#141414] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Choose a Template</h2>
            <p className="text-sm text-white/50">Select a format for your screenplay</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar - Categories */}
          <div className="w-48 border-r border-white/10 p-4 space-y-1">
            {[
              { id: 'all', label: 'All Templates', icon: '📚' },
              { id: 'film', label: 'Film', icon: '🎬' },
              { id: 'tv', label: 'Television', icon: '📺' },
              { id: 'theater', label: 'Theater', icon: '🎭' },
              { id: 'other', label: 'Other', icon: '📝' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`group p-4 rounded-xl border transition-all text-left ${
                    selectedTemplate?.id === template.id
                      ? 'bg-violet-500/20 border-violet-500/50 ring-2 ring-violet-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-3xl mb-3">{template.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-xs text-white/50 line-clamp-2">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Panel */}
          {selectedTemplate && (
            <div className="w-64 border-l border-white/10 p-4 bg-white/[0.02]">
              <h3 className="font-semibold text-white mb-3">Preview</h3>
              
              <div className="bg-[#1a1a1a] rounded-lg p-3 border border-white/10">
                <div className="text-3xl text-center mb-2">{selectedTemplate.icon}</div>
                <div className="text-sm font-medium text-white text-center mb-1">
                  {selectedTemplate.name}
                </div>
                <div className="text-[10px] text-white/40 text-center">
                  {selectedTemplate.category.toUpperCase()}
                </div>
              </div>

              {/* Page Layout Info */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>Margins:</span>
                  <span className="text-white/70">
                    {selectedTemplate.pageLayout.margins.left}"/{selectedTemplate.pageLayout.margins.right}"
                  </span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Font Size:</span>
                  <span className="text-white/70">{selectedTemplate.pageLayout.fontSize}pt</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Line Spacing:</span>
                  <span className="text-white/70">{selectedTemplate.pageLayout.lineSpacing}x</span>
                </div>
              </div>

              {/* Sample */}
              {selectedTemplate.initialContent && (
                <div className="mt-4">
                  <div className="text-xs text-white/40 mb-2">Sample:</div>
                  <div className="bg-[#0d0d0d] p-2 rounded text-[9px] font-mono text-white/60 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {selectedTemplate.initialContent}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedTemplate}
            className="px-5 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}
