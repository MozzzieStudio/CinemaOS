/**
 * BeatBoard — Visual Story Structure Tool
 * 
 * Like Final Draft's Beat Board:
 * - Color-coded beat cards by Act
 * - Drag and drop to reorder
 * - Link beats to scenes
 * - Synopsis and notes per beat
 */

import { useState, useCallback } from 'react';

// Story structure acts with colors
const ACTS = [
  { id: 'act1', name: 'Act I - Setup', color: '#8B5CF6' },      // Purple
  { id: 'act2a', name: 'Act IIA - Confrontation', color: '#3B82F6' }, // Blue
  { id: 'act2b', name: 'Act IIB - Complication', color: '#F59E0B' },  // Amber
  { id: 'act3', name: 'Act III - Resolution', color: '#10B981' },    // Green
];

interface Beat {
  id: string;
  title: string;
  synopsis: string;
  actId: string;
  sceneKey?: string;
  order: number;
}

interface BeatBoardProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkToScene?: (beatId: string) => void;
}

export default function BeatBoard({ isOpen, onClose, onLinkToScene }: BeatBoardProps) {
  const [beats, setBeats] = useState<Beat[]>([
    { id: '1', title: 'Opening Image', synopsis: 'The world before change', actId: 'act1', order: 0 },
    { id: '2', title: 'Theme Stated', synopsis: 'What is this story about?', actId: 'act1', order: 1 },
    { id: '3', title: 'Set-Up', synopsis: 'Introduce hero and their world', actId: 'act1', order: 2 },
    { id: '4', title: 'Catalyst', synopsis: 'The inciting incident', actId: 'act1', order: 3 },
    { id: '5', title: 'Debate', synopsis: 'Should the hero go?', actId: 'act1', order: 4 },
    { id: '6', title: 'Break into Two', synopsis: 'Hero enters the new world', actId: 'act2a', order: 5 },
    { id: '7', title: 'B Story', synopsis: 'The love story / subplot', actId: 'act2a', order: 6 },
    { id: '8', title: 'Fun and Games', synopsis: 'The promise of the premise', actId: 'act2a', order: 7 },
    { id: '9', title: 'Midpoint', synopsis: 'False victory or defeat', actId: 'act2a', order: 8 },
    { id: '10', title: 'Bad Guys Close In', synopsis: 'External/internal pressure', actId: 'act2b', order: 9 },
    { id: '11', title: 'All Is Lost', synopsis: 'The dark moment', actId: 'act2b', order: 10 },
    { id: '12', title: 'Dark Night of Soul', synopsis: 'Hero hits bottom', actId: 'act2b', order: 11 },
    { id: '13', title: 'Break into Three', synopsis: 'Solution found', actId: 'act3', order: 12 },
    { id: '14', title: 'Finale', synopsis: 'Hero conquers the problem', actId: 'act3', order: 13 },
    { id: '15', title: 'Final Image', synopsis: 'The world after change', actId: 'act3', order: 14 },
  ]);
  
  const [editingBeat, setEditingBeat] = useState<Beat | null>(null);
  const [draggedBeat, setDraggedBeat] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const getActColor = (actId: string) => ACTS.find(a => a.id === actId)?.color || '#666';
  
  const handleDragStart = useCallback((e: React.DragEvent, beatId: string) => {
    setDraggedBeat(beatId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetBeatId: string) => {
    e.preventDefault();
    if (!draggedBeat || draggedBeat === targetBeatId) return;

    setBeats(prev => {
      const newBeats = [...prev];
      const draggedIndex = newBeats.findIndex(b => b.id === draggedBeat);
      const targetIndex = newBeats.findIndex(b => b.id === targetBeatId);
      
      const [removed] = newBeats.splice(draggedIndex, 1);
      newBeats.splice(targetIndex, 0, removed);
      
      // Update orders
      return newBeats.map((b, i) => ({ ...b, order: i }));
    });
    
    setDraggedBeat(null);
  }, [draggedBeat]);

  const addBeat = useCallback((actId: string) => {
    const newBeat: Beat = {
      id: Date.now().toString(),
      title: 'New Beat',
      synopsis: '',
      actId,
      order: beats.length,
    };
    setBeats(prev => [...prev, newBeat]);
    setEditingBeat(newBeat);
  }, [beats.length]);

  const updateBeat = useCallback((id: string, updates: Partial<Beat>) => {
    setBeats(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBeat = useCallback((id: string) => {
    setBeats(prev => prev.filter(b => b.id !== id));
    setEditingBeat(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="w-[95vw] h-[90vh] bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden flex flex-col border border-[var(--color-border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🎯</span>
            <div>
              <h2 className="text-xl font-bold">Beat Board</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Visual story structure (Save the Cat! beats)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'timeline' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-muted)]'}`}
              >
                Timeline
              </button>
            </div>
            
            <button onClick={onClose} className="btn-ghost p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'grid' ? (
            // Grid View - Acts as columns
            <div className="grid grid-cols-4 gap-4 h-full">
              {ACTS.map(act => (
                <div key={act.id} className="flex flex-col">
                  {/* Act Header */}
                  <div 
                    className="px-3 py-2 rounded-t-lg font-semibold text-sm mb-2"
                    style={{ backgroundColor: `${act.color}20`, borderLeft: `3px solid ${act.color}` }}
                  >
                    {act.name}
                    <span className="ml-2 text-xs opacity-60">
                      ({beats.filter(b => b.actId === act.id).length})
                    </span>
                  </div>
                  
                  {/* Beat Cards */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {beats
                      .filter(b => b.actId === act.id)
                      .sort((a, b) => a.order - b.order)
                      .map(beat => (
                        <div
                          key={beat.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, beat.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, beat.id)}
                          onClick={() => setEditingBeat(beat)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            draggedBeat === beat.id ? 'opacity-50 scale-95' : ''
                          } ${editingBeat?.id === beat.id ? 'ring-2 ring-[var(--color-accent)]' : ''}`}
                          style={{ 
                            backgroundColor: `${act.color}10`,
                            borderLeft: `3px solid ${act.color}`,
                          }}
                        >
                          <h4 className="font-medium text-sm mb-1">{beat.title}</h4>
                          <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                            {beat.synopsis || 'Click to add synopsis...'}
                          </p>
                          {beat.sceneKey && (
                            <div className="mt-2 text-xs text-[var(--color-accent)] flex items-center gap-1">
                              <span>🎬</span> Linked to scene
                            </div>
                          )}
                        </div>
                      ))}
                    
                    {/* Add Beat Button */}
                    <button
                      onClick={() => addBeat(act.id)}
                      className="w-full p-2 border-2 border-dashed border-white/10 rounded-lg text-[var(--color-text-muted)] hover:border-white/20 hover:text-white transition-colors text-sm"
                    >
                      + Add Beat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Timeline View
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 rounded-full" />
              
              {/* Beats on Timeline */}
              <div className="flex justify-between pt-12">
                {beats.sort((a, b) => a.order - b.order).map((beat, index) => (
                  <div
                    key={beat.id}
                    className="relative flex flex-col items-center"
                    style={{ width: `${100 / beats.length}%` }}
                  >
                    {/* Connector */}
                    <div 
                      className="absolute top-0 w-3 h-3 rounded-full -mt-6"
                      style={{ backgroundColor: getActColor(beat.actId) }}
                    />
                    
                    {/* Card */}
                    <div
                      onClick={() => setEditingBeat(beat)}
                      className={`w-full max-w-[120px] p-2 rounded-lg cursor-pointer text-center transition-all hover:scale-105 ${
                        index % 2 === 0 ? 'mt-8' : '-mt-32'
                      }`}
                      style={{ 
                        backgroundColor: `${getActColor(beat.actId)}20`,
                        borderTop: `2px solid ${getActColor(beat.actId)}`,
                      }}
                    >
                      <h4 className="font-medium text-xs">{beat.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Panel */}
        {editingBeat && (
          <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-bg-primary)]">
            <div className="max-w-3xl mx-auto flex gap-4">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={editingBeat.title}
                  onChange={(e) => updateBeat(editingBeat.id, { title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-[var(--color-border)] rounded-lg font-medium outline-none focus:border-[var(--color-accent)]"
                  placeholder="Beat title..."
                />
                <textarea
                  value={editingBeat.synopsis}
                  onChange={(e) => updateBeat(editingBeat.id, { synopsis: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-[var(--color-border)] rounded-lg text-sm resize-none outline-none focus:border-[var(--color-accent)]"
                  rows={2}
                  placeholder="Synopsis..."
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <select
                  value={editingBeat.actId}
                  onChange={(e) => updateBeat(editingBeat.id, { actId: e.target.value })}
                  className="px-3 py-2 bg-white/5 border border-[var(--color-border)] rounded-lg text-sm outline-none"
                >
                  {ACTS.map(act => (
                    <option key={act.id} value={act.id}>{act.name}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => onLinkToScene?.(editingBeat.id)}
                  className="btn-secondary text-sm"
                >
                  🎬 Link to Scene
                </button>
                
                <button
                  onClick={() => deleteBeat(editingBeat.id)}
                  className="btn-ghost text-red-400 text-sm"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
