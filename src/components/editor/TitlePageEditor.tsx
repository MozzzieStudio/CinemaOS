/**
 * TitlePageEditor — Edit script title page
 * 
 * Standard screenplay title page with all required fields
 */

import { useState, useEffect } from 'react';

interface TitlePageData {
  title: string;
  writtenBy: string;
  basedOn?: string;
  draftDate: string;
  draftColor?: string;
  contactName?: string;
  contactAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  copyright?: string;
  registeredWGA?: string;
}

interface TitlePageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  data: TitlePageData;
  onSave: (data: TitlePageData) => void;
}

const DRAFT_COLORS = [
  { name: 'White', value: 'white' },
  { name: 'Blue', value: 'blue' },
  { name: 'Pink', value: 'pink' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Green', value: 'green' },
  { name: 'Goldenrod', value: 'goldenrod' },
  { name: 'Buff', value: 'buff' },
  { name: 'Salmon', value: 'salmon' },
  { name: 'Cherry', value: 'cherry' },
  { name: 'Tan', value: 'tan' },
];

export default function TitlePageEditor({ isOpen, onClose, data, onSave }: TitlePageEditorProps) {
  const [formData, setFormData] = useState<TitlePageData>(data);
  const [activeTab, setActiveTab] = useState<'main' | 'contact' | 'legal'>('main');

  // Sync with prop data when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData(data);
    }
  }, [isOpen, data]);

  // Handle keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, formData]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const updateField = (field: keyof TitlePageData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Title Page</h2>
              <p className="text-xs text-white/50">Edit your screenplay title page</p>
            </div>
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

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'main', label: 'Main Info', icon: '🎬' },
            { id: 'contact', label: 'Contact', icon: '📧' },
            { id: 'legal', label: 'Legal', icon: '⚖️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/5'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'main' && (
            <>
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="UNTITLED SCREENPLAY"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-lg text-white text-center font-bold placeholder-white/20 outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Written By */}
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wide">Written By</label>
                <input
                  type="text"
                  value={formData.writtenBy}
                  onChange={(e) => updateField('writtenBy', e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white text-center placeholder-white/30 outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Based On */}
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wide">Based On (Optional)</label>
                <input
                  type="text"
                  value={formData.basedOn || ''}
                  onChange={(e) => updateField('basedOn', e.target.value)}
                  placeholder='Based on the novel "Book Title" by Author Name'
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Draft Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-white/50 uppercase tracking-wide">Draft Date</label>
                  <input
                    type="date"
                    value={formData.draftDate}
                    onChange={(e) => updateField('draftDate', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/50 uppercase tracking-wide">Draft Color</label>
                  <select
                    value={formData.draftColor || 'white'}
                    onChange={(e) => updateField('draftColor', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-violet-500/50"
                  >
                    {DRAFT_COLORS.map(color => (
                      <option key={color.value} value={color.value} className="bg-[#1a1a1a]">
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'contact' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wide">Contact Name</label>
                <input
                  type="text"
                  value={formData.contactName || ''}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  placeholder="Agent or Self"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wide">Address</label>
                <textarea
                  value={formData.contactAddress || ''}
                  onChange={(e) => updateField('contactAddress', e.target.value)}
                  placeholder="Street Address&#10;City, State ZIP"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-white/50 uppercase tracking-wide">Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone || ''}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/50 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'legal' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wide">Copyright Notice</label>
                <input
                  type="text"
                  value={formData.copyright || ''}
                  onChange={(e) => updateField('copyright', e.target.value)}
                  placeholder="© 2024 Your Name. All Rights Reserved."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase tracking-wide">WGA Registration Number</label>
                <input
                  type="text"
                  value={formData.registeredWGA || ''}
                  onChange={(e) => updateField('registeredWGA', e.target.value)}
                  placeholder="WGAw Registered #1234567"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-amber-400">💡</span>
                  <div className="text-sm text-amber-200/80">
                    <p className="font-medium mb-1">Pro Tip</p>
                    <p className="text-xs text-amber-200/60">
                      Register your screenplay with the WGA (Writers Guild of America) before submitting to agents or producers.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Preview */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-center font-mono text-xs text-white/30 space-y-1">
            <div className="text-white/60 font-bold uppercase tracking-wider">
              {formData.title || 'UNTITLED SCREENPLAY'}
            </div>
            <div>Written by</div>
            <div className="text-white/50">{formData.writtenBy || 'Author Name'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            Save Title Page
          </button>
        </div>
      </div>
    </div>
  );
}
