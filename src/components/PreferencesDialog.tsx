/**
 * PreferencesDialog — User Settings for the Editor
 * 
 * Allows customization of fonts, auto-save, defaults, and more.
 */

import { useState, useEffect } from 'react';

export interface UserPreferences {
  // Font Settings
  fontFamily: 'Courier Prime' | 'Courier New' | 'Monaco' | 'Consolas';
  fontSize: number;
  
  // Auto-save
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // seconds
  
  // Default Element
  defaultElement: 'action' | 'scene-heading' | 'character';
  
  // Display
  showPageNumbers: boolean;
  showLineNumbers: boolean;
  showRuler: boolean;
  
  // Behavior
  smartQuotes: boolean;
  autoCapitalize: boolean; // Auto-capitalize scene headings and characters
  
  // Export
  pdfIncludeTitlePage: boolean;
  defaultExportFormat: 'fdx' | 'pdf' | 'fountain';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fontFamily: 'Courier Prime',
  fontSize: 12,
  autoSaveEnabled: true,
  autoSaveInterval: 30,
  defaultElement: 'action',
  showPageNumbers: true,
  showLineNumbers: false,
  showRuler: false,
  smartQuotes: true,
  autoCapitalize: true,
  pdfIncludeTitlePage: true,
  defaultExportFormat: 'pdf',
};

const STORAGE_KEY = 'cinemaos-preferences';

/**
 * Hook to manage user preferences
 */
export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferencesState({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when preferences change
  const setPreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferencesState(prev => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save preferences:', e);
      }
      return updated;
    });
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    setPreferences,
    resetToDefaults,
    isLoaded,
  };
}

interface PreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (prefs: Partial<UserPreferences>) => void;
}

export default function PreferencesDialog({ 
  isOpen, 
  onClose, 
  preferences,
  onSave 
}: PreferencesDialogProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [activeTab, setActiveTab] = useState<'general' | 'display' | 'export'>('general');

  // Sync local state with props
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'display', label: 'Display', icon: '🖥️' },
    { id: 'export', label: 'Export', icon: '📤' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-lg font-semibold text-white">Preferences</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Font Settings */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Font Family</label>
                <select
                  value={localPrefs.fontFamily}
                  onChange={(e) => setLocalPrefs(p => ({ ...p, fontFamily: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="Courier Prime">Courier Prime (Recommended)</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Monaco">Monaco</option>
                  <option value="Consolas">Consolas</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Font Size: {localPrefs.fontSize}pt</label>
                <input
                  type="range"
                  min="10"
                  max="16"
                  value={localPrefs.fontSize}
                  onChange={(e) => setLocalPrefs(p => ({ ...p, fontSize: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Auto-save */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Auto-save</span>
                <button
                  onClick={() => setLocalPrefs(p => ({ ...p, autoSaveEnabled: !p.autoSaveEnabled }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localPrefs.autoSaveEnabled ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    localPrefs.autoSaveEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Smart Quotes */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Smart Quotes</span>
                <button
                  onClick={() => setLocalPrefs(p => ({ ...p, smartQuotes: !p.smartQuotes }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localPrefs.smartQuotes ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    localPrefs.smartQuotes ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Auto Capitalize */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Auto-capitalize (Scene/Character)</span>
                <button
                  onClick={() => setLocalPrefs(p => ({ ...p, autoCapitalize: !p.autoCapitalize }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localPrefs.autoCapitalize ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    localPrefs.autoCapitalize ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              {/* Page Numbers */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Show Page Numbers</span>
                <button
                  onClick={() => setLocalPrefs(p => ({ ...p, showPageNumbers: !p.showPageNumbers }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localPrefs.showPageNumbers ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    localPrefs.showPageNumbers ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Line Numbers */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Show Line Numbers</span>
                <button
                  onClick={() => setLocalPrefs(p => ({ ...p, showLineNumbers: !p.showLineNumbers }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localPrefs.showLineNumbers ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    localPrefs.showLineNumbers ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Ruler */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Show Ruler</span>
                <button
                  onClick={() => setLocalPrefs(p => ({ ...p, showRuler: !p.showRuler }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localPrefs.showRuler ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    localPrefs.showRuler ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Default Export Format */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Default Export Format</label>
                <select
                  value={localPrefs.defaultExportFormat}
                  onChange={(e) => setLocalPrefs(p => ({ ...p, defaultExportFormat: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="pdf">PDF</option>
                  <option value="fdx">Final Draft (FDX)</option>
                  <option value="fountain">Fountain</option>
                </select>
              </div>

              {/* Include Title Page in PDF */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Include Title Page in PDF</span>
                <button
                  onClick={() => setLocalPrefs(p => ({ ...p, pdfIncludeTitlePage: !p.pdfIncludeTitlePage }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    localPrefs.pdfIncludeTitlePage ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                    localPrefs.pdfIncludeTitlePage ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
