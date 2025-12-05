/**
 * Enhanced NavigatorPanel with multi-tab layout
 * 
 * Tabs: Scenes | Characters | Notes | Stats
 * Final Draft 13 parity: Navigator 2.0 features
 */

import { useState, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $isElementNode } from "lexical";
import { $isSceneHeadingNode, $isCharacterNode } from "./nodes/ScriptNodes";
import { getAllNotes, deleteNote, type ScriptNote } from "./plugins/ScriptNotesPlugin";

interface SceneItem {
  key: string;
  heading: string;
  pageNumber: number;
  characters: string[];
  lineStart: number;
  duration: number; // estimated seconds
}

interface NavigatorPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'scenes' | 'characters' | 'notes' | 'stats';

function extractScenes(editor: any): SceneItem[] {
  const scenes: SceneItem[] = [];
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    
    let currentScene: SceneItem | null = null;
    let lineNumber = 0;
    const charactersInScene = new Set<string>();
    let sceneLineCount = 0;
    
    for (const node of children) {
      lineNumber++;
      
      if ($isSceneHeadingNode(node)) {
        // Save previous scene
        if (currentScene) {
          currentScene.characters = Array.from(charactersInScene);
          currentScene.duration = Math.round(sceneLineCount * 2.5); // ~2.5 sec per line avg
          scenes.push(currentScene);
          charactersInScene.clear();
          sceneLineCount = 0;
        }
        
        // Start new scene
        currentScene = {
          key: node.getKey(),
          heading: node.getTextContent(),
          pageNumber: Math.ceil(lineNumber / 55),
          characters: [],
          lineStart: lineNumber,
          duration: 0,
        };
      } else if (currentScene) {
        sceneLineCount++;
        if ($isCharacterNode(node)) {
          const name = node.getTextContent().trim().toUpperCase();
          if (name) charactersInScene.add(name);
        }
      }
    }
    
    // Don't forget last scene
    if (currentScene) {
      currentScene.characters = Array.from(charactersInScene);
      currentScene.duration = Math.round(sceneLineCount * 2.5);
      scenes.push(currentScene);
    }
  });
  
  return scenes;
}

export default function NavigatorPanel({ isOpen, onClose }: NavigatorPanelProps) {
  const [editor] = useLexicalComposerContext();
  const [scenes, setScenes] = useState<SceneItem[]>([]);
  const [notes, setNotes] = useState<ScriptNote[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('scenes');

  // Update scenes on editor change
  useEffect(() => {
    if (!isOpen) return;
    
    const updateScenes = () => {
      setScenes(extractScenes(editor));
    };
    
    updateScenes();
    
    return editor.registerUpdateListener(() => {
      updateScenes();
    });
  }, [editor, isOpen]);

  // Update notes
  useEffect(() => {
    if (!isOpen) return;
    
    const updateNotes = () => {
      setNotes(getAllNotes());
    };
    
    updateNotes();
    
    const handleNotesUpdate = () => updateNotes();
    window.addEventListener('notes-updated', handleNotesUpdate);
    return () => window.removeEventListener('notes-updated', handleNotesUpdate);
  }, [isOpen]);

  // Jump to scene
  const jumpToScene = useCallback((key: string) => {
    editor.update(() => {
      const root = $getRoot();
      const children = root.getChildren();
      
      for (const node of children) {
        if (node.getKey() === key && $isElementNode(node)) {
          node.selectStart();
          setSelectedKey(key);
          
          const element = editor.getElementByKey(key);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    });
  }, [editor]);

  // Character stats
  const characterStats = scenes.reduce((acc, scene) => {
    scene.characters.forEach(char => {
      if (!acc[char]) acc[char] = { scenes: 0, totalDuration: 0 };
      acc[char].scenes++;
      acc[char].totalDuration += scene.duration;
    });
    return acc;
  }, {} as Record<string, {scenes: number; totalDuration: number}>);

  const sortedCharacters = Object.entries(characterStats)
    .sort((a, b) => b[1].totalDuration - a[1].totalDuration);

  // Filter
  const filteredScenes = filter
    ? scenes.filter(s => 
        s.heading.toLowerCase().includes(filter.toLowerCase()) ||
        s.characters.some(c => c.toLowerCase().includes(filter.toLowerCase()))
      )
    : scenes;

  const filteredNotes = filter
    ? notes.filter(n => n.content.toLowerCase().includes(filter.toLowerCase()))
    : notes;

  if (!isOpen) return null;

  return (
    <div className="w-72 h-full border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <h3 className="font-semibold text-sm">Navigator 2.0</h3>
        </div>
        <button 
          onClick={onClose}
          className="btn-ghost p-1"
          aria-label="Close navigator"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        {[
          { id: 'scenes' as TabType, label: 'Scenes', icon: '🎬' },
          { id: 'characters' as TabType, label: 'Characters', icon: '🎭' },
          { id: 'notes' as TabType, label: 'Notes', icon: '📝' },
          { id: 'stats' as TabType, label: 'Stats', icon: '📊' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-2 border-b border-[var(--color-border)]">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md text-xs outline-none focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Scenes Tab */}
        {activeTab === 'scenes' && (
          filteredScenes.length === 0 ? (
            <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
              {scenes.length === 0 ? (
                <>
                  <span className="text-2xl block mb-2">📝</span>
                  No scenes yet
                  <br />
                  <span className="text-xs">Start with INT. or EXT.</span>
                </>
              ) : (
                'No matching scenes'
              )}
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {filteredScenes.map((scene, index) => (
                <li key={scene.key}>
                  <button
                    onClick={() => jumpToScene(scene.key)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedKey === scene.key
                        ? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-[var(--color-accent)]">
                        Scene {index + 1}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        pg. {scene.pageNumber}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate mb-1">
                      {scene.heading}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      {scene.characters.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {scene.characters.slice(0, 2).map(char => (
                            <span 
                              key={char}
                              className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded"
                            >
                              {char}
                            </span>
                          ))}
                          {scene.characters.length > 2 && (
                            <span className="text-xs text-[var(--color-text-muted)]">
                              +{scene.characters.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-[var(--color-text-muted)] ml-auto">
                        ~{Math.floor(scene.duration / 60)}:{String(scene.duration % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          sortedCharacters.length === 0 ? (
            <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
              <span className="text-2xl block mb-2">🎭</span>
              No characters found
            </div>
          ) : (
            <ul className="p-2 space-y-2">
              {sortedCharacters.map(([char, stats]) => (
                <li key={char} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-[var(--color-text-primary)]">{char}</h4>
                    <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded">
                      {stats.scenes} scenes
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mb-2">
                    Screen time: ~{Math.floor(stats.totalDuration / 60)} min
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                      style={{ width: `${(stats.totalDuration / (scenes.reduce((sum, s) => sum + s.duration, 0) || 1)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
              <span className="text-2xl block mb-2">📝</span>
              {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
              <div className="text-xs mt-2">Press Ctrl+N to add note</div>
            </div>
          ) : (
            <ul className="p-2 space-y-2">
              {filteredNotes.map(note => (
                <li key={note.id} className={`p-3 rounded-lg border ${
                  note.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  note.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                  note.color === 'green' ? 'bg-green-500/10 border-green-500/30' :
                  note.color === 'pink' ? 'bg-pink-500/10 border-pink-500/30' :
                  'bg-orange-500/10 border-orange-500/30'
                }`}>
                  <div className="flex items-start justify-between mb-1.5">
                    {note.emoji && <span className="text-base mr-2">{note.emoji}</span>}
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="ml-auto text-white/30 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] mb-2">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>{note.author}</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="p-3 space-y-4">
            <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <h4 className="text-xs font-medium text-white/50 mb-2">Script Overview</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-2xl font-bold text-violet-400">{scenes.length}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Scenes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-400">{Object.keys(characterStats).length}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Characters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-400">{notes.length}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Notes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-400">
                    {Math.floor(scenes.reduce((sum, s) => sum + s.duration, 0) / 60)}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">Est. Minutes</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <h4 className="text-xs font-medium text-white/50 mb-2">Top Characters</h4>
              <div className="space-y-2">
                {sortedCharacters.slice(0, 5).map(([char, stats]) => (
                  <div key={char} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-primary)] truncate flex-1">{char}</span>
                    <span className="text-xs text-[var(--color-text-muted)] ml-2">
                      {Math.floor(stats.totalDuration / 60)}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
        {activeTab === 'scenes' && (
          <div className="flex justify-between">
            <span>{scenes.length} scenes</span>
            <span>~{scenes.length > 0 ? scenes[scenes.length - 1].pageNumber : 0} pages</span>
          </div>
        )}
        {activeTab === 'characters' && (
          <div className="flex justify-between">
            <span>{sortedCharacters.length} characters</span>
            <span>~{Math.floor(scenes.reduce((sum, s) => sum + s.duration, 0) / 60)} min</span>
          </div>
        )}
        {activeTab === 'notes' && (
          <div>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="text-center">
            Updated in real-time
          </div>
        )}
      </div>
    </div>
  );
}
