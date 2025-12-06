/**
 * VersionHistoryPanel — View and restore script versions
 * 
 * Features:
 * - List of saved versions with timestamps
 * - Preview diff between versions
 * - Restore previous version
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface ScriptVersion {
  id: string;
  timestamp: string;
  wordCount: number;
  sceneCount: number;
  label?: string;
  content: string;
}

interface VersionHistoryPanelProps {
  projectId: string;
  currentContent: string;
  onRestore: (content: string) => void;
  onClose: () => void;
}

// In-memory version storage (would be SurrealDB in production)
const versionStore: Map<string, ScriptVersion[]> = new Map();

export function saveVersion(projectId: string, content: string, label?: string): ScriptVersion {
  const versions = versionStore.get(projectId) || [];
  
  // Count words and scenes
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const sceneCount = (content.match(/scene-heading/g) || []).length;
  
  const version: ScriptVersion = {
    id: `v-${Date.now()}`,
    timestamp: new Date().toISOString(),
    wordCount,
    sceneCount,
    label,
    content,
  };
  
  versions.unshift(version);
  
  // Keep max 50 versions
  if (versions.length > 50) {
    versions.pop();
  }
  
  versionStore.set(projectId, versions);
  return version;
}

export function getVersions(projectId: string): ScriptVersion[] {
  return versionStore.get(projectId) || [];
}

export default function VersionHistoryPanel({
  projectId,
  currentContent,
  onRestore,
  onClose,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ScriptVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setVersions(getVersions(projectId));
    setIsLoading(false);
  }, [projectId]);

  const handleRestore = useCallback((version: ScriptVersion) => {
    if (confirm(`Restore to version from ${new Date(version.timestamp).toLocaleString()}?`)) {
      onRestore(version.content);
      toast.success('Version restored');
      onClose();
    }
  }, [onRestore, onClose]);

  const handleSaveVersion = useCallback(() => {
    const label = prompt('Version label (optional):');
    const version = saveVersion(projectId, currentContent, label || undefined);
    setVersions(prev => [version, ...prev]);
    toast.success('Version saved');
  }, [projectId, currentContent]);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#141414] border border-white/10 rounded-xl w-[600px] max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📜</span>
            <div>
              <h2 className="font-semibold text-white">Version History</h2>
              <p className="text-xs text-white/40">{versions.length} versions saved</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveVersion}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Save Version
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Version List */}
        <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/40 mb-4">No versions saved yet</p>
              <button
                onClick={handleSaveVersion}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
              >
                Save First Version
              </button>
            </div>
          ) : (
            versions.map((version, index) => (
              <div
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedVersion?.id === version.id
                    ? 'bg-violet-500/10 border-violet-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {version.label || `Version ${versions.length - index}`}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/40">{formatTime(version.timestamp)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>{version.wordCount} words</span>
                  <span>{version.sceneCount} scenes</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Version Actions */}
        {selectedVersion && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#0f0f0f]">
            <div className="text-sm text-white/60">
              Selected: {new Date(selectedVersion.timestamp).toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedVersion(null)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(selectedVersion)}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Restore This Version
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
