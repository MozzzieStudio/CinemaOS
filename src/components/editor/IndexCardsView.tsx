/**
 * IndexCardsView — Scene Cards like Final Draft
 * 
 * Features:
 * - Grid of scene cards
 * - Synopsis per scene
 * - Color tags
 * - Drag to reorder
 * - Scene duration estimate
 */

import { useState, useCallback } from 'react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, LexicalEditor } from "lexical";
import { $isSceneHeadingNode } from "./nodes/ScriptNodes";

interface SceneCard {
  key: string;
  heading: string;
  synopsis: string;
  color: string;
  pageNumber: number;
  duration: string;
}

const CARD_COLORS = [
  { id: 'white', name: 'White', value: '#ffffff' },
  { id: 'blue', name: 'Blue', value: '#3B82F6' },
  { id: 'pink', name: 'Pink', value: '#EC4899' },
  { id: 'yellow', name: 'Yellow', value: '#F59E0B' },
  { id: 'green', name: 'Green', value: '#10B981' },
  { id: 'purple', name: 'Purple', value: '#8B5CF6' },
];

function extractScenes(editor: LexicalEditor): SceneCard[] {
  const scenes: SceneCard[] = [];
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    
    let lineNumber = 0;
    
    for (const node of children) {
      lineNumber++;
      
      if ($isSceneHeadingNode(node)) {
        scenes.push({
          key: node.getKey(),
          heading: node.getTextContent(),
          synopsis: '', // Would come from metadata
          color: '#ffffff',
          pageNumber: Math.ceil(lineNumber / 55),
          duration: '0:00', // Would calculate from dialogue/action length
        });
      }
    }
  });
  
  return scenes;
}

interface IndexCardsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IndexCardsView({ isOpen, onClose }: IndexCardsViewProps) {
  const [editor] = useLexicalComposerContext();
  const [scenes, setScenes] = useState<SceneCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [editingSynopsis, setEditingSynopsis] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  // Load scenes when opened
  useState(() => {
    if (isOpen) {
      setScenes(extractScenes(editor));
    }
  });

  const handleDragStart = useCallback((e: React.DragEvent, key: string) => {
    setDraggedCard(key);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!draggedCard || draggedCard === targetKey) return;

    setScenes(prev => {
      const newScenes = [...prev];
      const draggedIndex = newScenes.findIndex(s => s.key === draggedCard);
      const targetIndex = newScenes.findIndex(s => s.key === targetKey);
      
      const [removed] = newScenes.splice(draggedIndex, 1);
      newScenes.splice(targetIndex, 0, removed);
      
      return newScenes;
    });
    
    setDraggedCard(null);
  }, [draggedCard]);

  const updateCard = useCallback((key: string, updates: Partial<SceneCard>) => {
    setScenes(prev => prev.map(s => s.key === key ? { ...s, ...updates } : s));
  }, []);

  const jumpToScene = useCallback((key: string) => {
    editor.update(() => {
      const root = $getRoot();
      for (const node of root.getChildren()) {
        if (node.getKey() === key) {
          node.selectStart();
          const element = editor.getElementByKey(key);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    });
    onClose();
  }, [editor, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="w-[95vw] h-[90vh] bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden flex flex-col border border-[var(--color-border)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🗂️</span>
            <div>
              <h2 className="text-xl font-bold">Index Cards</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {scenes.length} scenes • Drag to reorder
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="btn-secondary text-sm">
              🔄 Refresh from Script
            </button>
            <button onClick={onClose} className="btn-ghost p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-auto p-6">
          {scenes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
              <span className="text-6xl mb-4">🎬</span>
              <h3 className="text-lg font-medium mb-2">No Scenes Yet</h3>
              <p className="text-sm">Start writing with INT. or EXT. to create scenes</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {scenes.map((scene, index) => (
                <div
                  key={scene.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, scene.key)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, scene.key)}
                  onClick={() => setSelectedCard(scene.key)}
                  onDoubleClick={() => jumpToScene(scene.key)}
                  className={`relative bg-white rounded-lg shadow-lg cursor-pointer transition-all ${
                    draggedCard === scene.key ? 'opacity-50 scale-95' : 'hover:shadow-xl hover:scale-[1.02]'
                  } ${selectedCard === scene.key ? 'ring-2 ring-[var(--color-accent)]' : ''}`}
                  style={{ 
                    minHeight: '180px',
                    borderTop: `4px solid ${scene.color}`,
                  }}
                >
                  {/* Scene Number */}
                  <div className="absolute top-2 left-2 text-xs font-mono text-gray-400">
                    {index + 1}
                  </div>
                  
                  {/* Page Number */}
                  <div className="absolute top-2 right-2 text-xs font-mono text-gray-400">
                    pg. {scene.pageNumber}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 pt-8">
                    {/* Scene Heading */}
                    <h3 className="font-mono font-bold text-xs text-gray-700 uppercase mb-2 line-clamp-2">
                      {scene.heading}
                    </h3>
                    
                    {/* Synopsis */}
                    {editingSynopsis === scene.key ? (
                      <textarea
                        autoFocus
                        value={scene.synopsis}
                        onChange={(e) => updateCard(scene.key, { synopsis: e.target.value })}
                        onBlur={() => setEditingSynopsis(null)}
                        className="w-full h-20 text-xs text-gray-600 resize-none outline-none border-b border-gray-200 focus:border-blue-400"
                        placeholder="Add synopsis..."
                      />
                    ) : (
                      <p 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSynopsis(scene.key);
                        }}
                        className="text-xs text-gray-500 line-clamp-4 min-h-[60px] hover:bg-gray-50 rounded p-1 -m-1"
                      >
                        {scene.synopsis || 'Click to add synopsis...'}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                    {/* Color Picker */}
                    <div className="flex gap-1">
                      {CARD_COLORS.map(color => (
                        <button
                          key={color.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCard(scene.key, { color: color.value });
                          }}
                          className={`w-4 h-4 rounded-full border ${
                            scene.color === color.value ? 'ring-2 ring-offset-1 ring-blue-400' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    
                    {/* Duration */}
                    <span className="text-xs text-gray-400">{scene.duration}</span>
                  </div>
                </div>
              ))}
              
              {/* Add Scene Card (placeholder) */}
              <div className="min-h-[180px] border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:border-white/20 transition-colors cursor-not-allowed">
                <span className="text-sm">Scenes created in script</span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Card Actions */}
        {selectedCard && (
          <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-bg-primary)]">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                <span>Scene {scenes.findIndex(s => s.key === selectedCard) + 1} selected</span>
                <span className="text-[var(--color-border)]">|</span>
                <span>Double-click to jump to scene</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => jumpToScene(selectedCard)}
                  className="btn-primary text-sm"
                >
                  Go to Scene
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="btn-ghost text-sm"
                >
                  Deselect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
