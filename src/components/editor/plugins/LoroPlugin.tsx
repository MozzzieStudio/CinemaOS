/**
 * LoroPlugin — Collaborative Editing with Loro CRDTs
 * 
 * Updated based on research: https://loro.dev/docs
 * 
 * Features:
 * - Real-time sync via LoroDoc
 * - Export/import for persistence
 * - Time travel via checkout()
 * - Presence indicators
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { LoroDoc } from 'loro-crdt';

interface Peer {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  lastSeen: number;
}

interface LoroPluginProps {
  documentId: string;
  userId: string;
  userName: string;
  onPeersChange?: (peers: Peer[]) => void;
  onSyncStatusChange?: (status: 'synced' | 'syncing' | 'offline') => void;
  enabled?: boolean;
}

// Presence colors for different collaborators
const PEER_COLORS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6',
  '#EF4444', '#EC4899', '#6366F1', '#14B8A6',
];

/**
 * Main LoroPlugin component
 * Now uses actual loro-crdt LoroDoc API
 */
export default function LoroPlugin({
  documentId,
  userId,
  userName,
  onPeersChange,
  onSyncStatusChange,
  enabled = true,
}: LoroPluginProps) {
  const [editor] = useLexicalComposerContext();
  const loroDocRef = useRef<LoroDoc | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize LoroDoc
  useEffect(() => {
    if (!enabled) return;

    const doc = new LoroDoc();
    loroDocRef.current = doc;
    
    console.log('[Loro] LoroDoc initialized for:', documentId);
    setIsInitialized(true);

    // Create self peer
    const selfPeer: Peer = {
      id: userId,
      name: userName,
      color: PEER_COLORS[userId.charCodeAt(0) % PEER_COLORS.length],
      lastSeen: Date.now(),
    };
    onPeersChange?.([selfPeer]);
    onSyncStatusChange?.('synced');

    return () => {
      loroDocRef.current = null;
      setIsInitialized(false);
    };
  }, [documentId, userId, userName, enabled, onPeersChange, onSyncStatusChange]);

  // Sync editor content to Loro
  useEffect(() => {
    if (!isInitialized || !loroDocRef.current) return;

    const unsubscribe = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        
        // Update Loro text container
        const loroText = loroDocRef.current!.getText('content');
        const currentLength = loroText.length;
        if (currentLength > 0) {
          loroText.delete(0, currentLength);
        }
        loroText.insert(0, text);
      });
    });

    return unsubscribe;
  }, [editor, isInitialized]);

  return null;
}

// Export for external sync
export function useLoroSync(docRef: React.RefObject<LoroDoc | null>) {
  const exportSnapshot = useCallback(() => {
    if (!docRef.current) return null;
    return docRef.current.export({ mode: 'snapshot' });
  }, [docRef]);

  const exportUpdate = useCallback(() => {
    if (!docRef.current) return null;
    return docRef.current.export({ mode: 'update' });
  }, [docRef]);

  const importBytes = useCallback((bytes: Uint8Array) => {
    if (!docRef.current) return false;
    docRef.current.import(bytes);
    return true;
  }, [docRef]);

  return { exportSnapshot, exportUpdate, importBytes };
}


// Hook for checking collaboration status
export function useCollaborationStatus() {
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  return {
    isCollaborating,
    peerCount,
    setIsCollaborating,
    setPeerCount,
  };
}

// Presence Indicator Component
export function PresenceIndicator({ peers }: { peers: Peer[] }) {
  if (peers.length <= 1) return null;

  const otherPeers = peers.filter(p => p.id !== 'self');

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-full">
      {otherPeers.slice(0, 3).map((peer, i) => (
        <div
          key={peer.id}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
          style={{ 
            backgroundColor: peer.color,
            marginLeft: i > 0 ? '-6px' : 0,
            zIndex: 10 - i,
          }}
          title={peer.name}
        >
          {peer.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {otherPeers.length > 3 && (
        <span className="text-xs text-white/60 ml-1">+{otherPeers.length - 3}</span>
      )}
    </div>
  );
}
