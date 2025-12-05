/**
 * TrackChangesPlugin — Revision tracking for production workflows
 * 
 * Final Draft 13 parity: Color-coded revisions (Blue → Pink → Yellow → Green)
 * Note: This is a foundational implementation. Full Lexical decorator integration deferred.
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect } from 'react';

export interface RevisionChange {
  id: string;
  elementKey: string;
  type: 'insert' | 'delete' | 'modify';
  oldText?: string;
  newText: string;
  color: 'blue' | 'pink' | 'yellow' | 'green';
  timestamp: string;
  author: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Global revisions store (in production, this would be SurrealDB)
let revisionsStore: RevisionChange[] = [];

export function getAllRevisions(): RevisionChange[] {
  return [...revisionsStore];
}

export function addRevision(revision: Omit<RevisionChange, 'id' | 'timestamp'>): RevisionChange {
  const newRevision: RevisionChange = {
    ...revision,
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  revisionsStore.push(newRevision);
  window.dispatchEvent(new CustomEvent('revisions-updated'));
  return newRevision;
}

export function acceptRevision(revisionId: string): void {
  const rev = revisionsStore.find(r => r.id === revisionId);
  if (rev) {
    rev.status = 'accepted';
    window.dispatchEvent(new CustomEvent('revisions-updated'));
  }
}

export function rejectRevision(revisionId: string): void {
  const rev = revisionsStore.find(r => r.id === revisionId);
  if (rev) {
    rev.status = 'rejected';
    window.dispatchEvent(new CustomEvent('revisions-updated'));
  }
}

export default function TrackChangesPlugin(): null {
  useLexicalComposerContext(); // Required for plugin context
  const [, setIsEnabled] = useState(false);

  useEffect(() => {
    // Listen for enable/disable track changes
    const handleToggle = (e: CustomEvent) => {
      setIsEnabled(e.detail.enabled);
    };
    
    window.addEventListener('toggle-track-changes', handleToggle as EventListener);
    return () => window.removeEventListener('toggle-track-changes', handleToggle as EventListener);
  }, []);

  // TODO: Full implementation would use Lexical decorators to mark changes in real-time
  // For now, this is a foundation for the RevisionPanel UI

  return null;
}
