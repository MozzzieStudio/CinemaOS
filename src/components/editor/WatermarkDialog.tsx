/**
 * WatermarkDialog — Configure watermark for PDF export
 * 
 * Features:
 * - Custom text (email, "CONFIDENTIAL", etc.)
 * - Opacity control
 * - Position (diagonal, footer, header)
 * - Preview
 */

import { useState } from 'react';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'diagonal' | 'footer' | 'header';
  fontSize: number;
}

interface WatermarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: WatermarkConfig;
  onSave: (config: WatermarkConfig) => void;
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: false,
  text: 'CONFIDENTIAL',
  opacity: 0.15,
  position: 'diagonal',
  fontSize: 48,
};

export default function WatermarkDialog({ isOpen, onClose, config, onSave }: WatermarkDialogProps) {
  const [localConfig, setLocalConfig] = useState<WatermarkConfig>(config);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💧</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Watermark Settings</h2>
              <p className="text-xs text-white/50">Add watermark to exported PDFs</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white/80">Enable Watermark</span>
            <button
              onClick={() => setLocalConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                localConfig.enabled ? 'bg-violet-600' : 'bg-white/10'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform ${
                localConfig.enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {localConfig.enabled && (
            <>
              {/* Text Input */}
              <div>
                <label className="block text-sm text-white/50 mb-2">Watermark Text</label>
                <input
                  type="text"
                  value={localConfig.text}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="CONFIDENTIAL"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-violet-500 text-white"
                />
                <div className="mt-2 flex gap-2">
                  {['CONFIDENTIAL', 'DRAFT', 'NOT FOR DISTRIBUTION'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setLocalConfig(prev => ({ ...prev, text: preset }))}
                      className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm text-white/50 mb-2">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'diagonal', label: 'Diagonal', icon: '↗️' },
                    { value: 'header', label: 'Header', icon: '⬆️' },
                    { value: 'footer', label: 'Footer', icon: '⬇️' },
                  ].map(pos => (
                    <button
                      key={pos.value}
                      onClick={() => setLocalConfig(prev => ({ ...prev, position: pos.value as 'diagonal' | 'footer' | 'header' }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                        localConfig.position === pos.value
                          ? 'bg-violet-500/20 border-violet-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg">{pos.icon}</span>
                      <span className="text-xs">{pos.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="flex items-center justify-between text-sm text-white/50 mb-2">
                  <span>Opacity</span>
                  <span>{Math.round(localConfig.opacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={localConfig.opacity}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                  className="w-full accent-violet-500"
                />
              </div>

              {/* Font Size */}
              <div>
                <label className="flex items-center justify-between text-sm text-white/50 mb-2">
                  <span>Font Size</span>
                  <span>{localConfig.fontSize}pt</span>
                </label>
                <input
                  type="range"
                  min="24"
                  max="72"
                  step="4"
                  value={localConfig.fontSize}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full accent-violet-500"
                />
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm text-white/50 mb-2">Preview</label>
                <div className="relative aspect-[8.5/11] bg-white rounded-lg overflow-hidden">
                  {/* Fake page content */}
                  <div className="absolute inset-0 p-4">
                    <div className="h-2 w-1/2 bg-gray-300 rounded mb-3" />
                    <div className="h-2 w-3/4 bg-gray-200 rounded mb-2" />
                    <div className="h-2 w-2/3 bg-gray-200 rounded mb-2" />
                    <div className="h-2 w-1/2 bg-gray-200 rounded mb-4" />
                    <div className="h-2 w-1/3 ml-12 bg-gray-300 rounded mb-2" />
                    <div className="h-2 w-1/2 ml-6 bg-gray-200 rounded mb-2" />
                  </div>
                  
                  {/* Watermark */}
                  <div 
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                      localConfig.position === 'header' ? 'items-start pt-4' :
                      localConfig.position === 'footer' ? 'items-end pb-4' : ''
                    }`}
                  >
                    <span
                      className="font-bold text-gray-500 whitespace-nowrap"
                      style={{
                        opacity: localConfig.opacity,
                        fontSize: `${localConfig.fontSize / 3}px`,
                        transform: localConfig.position === 'diagonal' ? 'rotate(-45deg)' : 'none',
                      }}
                    >
                      {localConfig.text || 'WATERMARK'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for watermark config
 */
export function useWatermarkConfig() {
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT_WATERMARK_CONFIG);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return {
    config,
    setConfig,
    isDialogOpen,
    openDialog: () => setIsDialogOpen(true),
    closeDialog: () => setIsDialogOpen(false),
  };
}
