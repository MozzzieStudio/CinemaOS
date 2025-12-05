/**
 * RevisionPanel — UI for accepting/rejecting tracked changes
 * 
 * Final Draft 13 parity: Revision management sidebar
 */

import { useState, useEffect } from 'react';
import { getAllRevisions, acceptRevision, rejectRevision, type RevisionChange } from './plugins/TrackChangesPlugin';

interface RevisionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RevisionPanel({ isOpen, onClose }: RevisionPanelProps) {
  const [revisions, setRevisions] = useState<RevisionChange[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    if (!isOpen) return;

    const updateRevisions = () => {
      setRevisions(getAllRevisions());
    };

    updateRevisions();

    const handleUpdate = () => updateRevisions();
    window.addEventListener('revisions-updated', handleUpdate);
    return () => window.removeEventListener('revisions-updated', handleUpdate);
  }, [isOpen]);

  const filteredRevisions = filter === 'all' 
    ? revisions 
    : revisions.filter(r => r.status === filter);

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full border-l border-white/10 bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold text-sm text-white">Track Changes</h3>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter */}
      <div className="p-2 border-b border-white/10">
        <div className="flex gap-1">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                filter === f
                  ? 'bg-violet-500 text-white'
                  : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Revisions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRevisions.length === 0 ? (
          <div className="p-4 text-center text-white/30 text-sm">
            <span className="text-2xl block mb-2">📝</span>
            {filter === 'pending' ? 'No pending changes' : `No ${filter} changes`}
          </div>
        ) : (
          filteredRevisions.map(rev => (
            <div
              key={rev.id}
              className={`p-3 rounded-lg border ${
                rev.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                rev.color === 'pink' ? 'bg-pink-500/10 border-pink-500/30' :
                rev.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-green-500/10 border-green-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    rev.type === 'insert' ? 'bg-green-500/20 text-green-400' :
                    rev.type === 'delete' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {rev.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    rev.color === 'blue' ? 'bg-blue-500/30 text-blue-300' :
                    rev.color === 'pink' ? 'bg-pink-500/30 text-pink-300' :
                    rev.color === 'yellow' ? 'bg-yellow-500/30 text-yellow-300' :
                    'bg-green-500/30 text-green-300'
                  }`}>
                   {rev.color}
                  </span>
                </div>
              </div>

              {rev.oldText && (
                <div className="mb-1">
                  <div className="text-xs text-white/40 mb-0.5">Old:</div>
                  <div className="text-sm text-red-400 line-through">{rev.oldText}</div>
                </div>
              )}

              <div className="mb-2">
                {rev.oldText && <div className="text-xs text-white/40 mb-0.5">New:</div>}
                <div className="text-sm text-white">{rev.newText}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                <span>{rev.author}</span>
                <span>{new Date(rev.timestamp).toLocaleDateString()}</span>
              </div>

              {rev.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRevision(rev.id)}
                    className="flex-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectRevision(rev.id)}
                    className="flex-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}

              {rev.status !== 'pending' && (
                <div className={`text-center text-xs font-medium ${
                  rev.status === 'accepted' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {rev.status.toUpperCase()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 text-xs text-white/40">
        {filteredRevisions.length} {filteredRevisions.length === 1 ? 'change' : 'changes'}
      </div>
    </div>
  );
}
