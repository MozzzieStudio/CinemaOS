/**
 * ScriptReports — Generate reports from script analysis
 * 
 * Cast List, Scene Report, Character Statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

interface Character {
  name: string;
  dialogueCount: number;
  sceneAppearances: number;
  firstAppearance: number;
  wordCount: number;
}

interface Scene {
  number: number;
  heading: string;
  intExt: 'INT' | 'EXT' | 'INT/EXT' | 'UNKNOWN';
  location: string;
  timeOfDay: string;
  pageNumber: number;
  characters: string[];
}

interface ScriptReportsProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = 'cast' | 'scenes' | 'characters' | 'locations';

export default function ScriptReports({ isOpen, onClose }: ScriptReportsProps) {
  const [editor] = useLexicalComposerContext();
  const [activeReport, setActiveReport] = useState<ReportType>('cast');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Analyze script content
  const analyzeScript = useCallback(() => {
    setIsLoading(true);
    
    const foundCharacters = new Map<string, Character>();
    const foundScenes: Scene[] = [];
    let currentSceneNumber = 0;
    let currentPageNumber = 1;

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const content = root.getTextContent();
      const lines = content.split('\n');
      
      let currentScene: Scene | null = null;
      
      lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        
        // Scene Heading detection
        if (trimmed.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i)) {
          currentSceneNumber++;
          
          // Parse scene heading
          const intExtMatch = trimmed.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i);
          const intExt = intExtMatch ? intExtMatch[1].replace('.', '').toUpperCase() : 'UNKNOWN';
          
          // Extract location and time
          const parts = trimmed.split(' - ');
          const location = parts[0].replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*/i, '').trim();
          const timeOfDay = parts[1] || 'UNKNOWN';
          
          currentScene = {
            number: currentSceneNumber,
            heading: trimmed,
            intExt: intExt as Scene['intExt'],
            location,
            timeOfDay,
            pageNumber: currentPageNumber,
            characters: [],
          };
          
          foundScenes.push(currentScene);
        }
        
        // Character detection (uppercase line, centered, before dialogue)
        if (trimmed.match(/^[A-Z][A-Z\s\.\-\(\)]+$/) && trimmed.length < 40) {
          // Clean character name (remove extensions)
          const cleanName = trimmed.replace(/\s*\([^)]+\)\s*/g, '').trim();
          
          if (cleanName.length > 0) {
            // Update character stats
            if (!foundCharacters.has(cleanName)) {
              foundCharacters.set(cleanName, {
                name: cleanName,
                dialogueCount: 0,
                sceneAppearances: 0,
                firstAppearance: currentSceneNumber,
                wordCount: 0,
              });
            }
            
            const char = foundCharacters.get(cleanName)!;
            char.dialogueCount++;
            
            // Add to current scene
            if (currentScene && !currentScene.characters.includes(cleanName)) {
              currentScene.characters.push(cleanName);
              char.sceneAppearances++;
            }
          }
        }
        
        // Estimate page breaks (every ~55 lines)
        if ((lineIndex + 1) % 55 === 0) {
          currentPageNumber++;
        }
      });
    });

    // Sort characters by dialogue count
    const sortedCharacters = Array.from(foundCharacters.values())
      .sort((a, b) => b.dialogueCount - a.dialogueCount);

    setCharacters(sortedCharacters);
    setScenes(foundScenes);
    setIsLoading(false);
  }, [editor]);

  // Analyze on open
  useEffect(() => {
    if (isOpen) {
      analyzeScript();
    }
  }, [isOpen, analyzeScript]);

  // Get unique locations
  const locations = [...new Set(scenes.map(s => s.location))].sort();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-4xl h-[80vh] bg-[#141414] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Script Reports</h2>
              <p className="text-xs text-white/50">
                {characters.length} characters • {scenes.length} scenes
              </p>
            </div>
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
          {[
            { id: 'cast', label: 'Cast List', icon: '👥' },
            { id: 'scenes', label: 'Scene Report', icon: '🎬' },
            { id: 'characters', label: 'Character Stats', icon: '📈' },
            { id: 'locations', label: 'Locations', icon: '📍' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeReport === tab.id
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
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/50">Analyzing script...</div>
            </div>
          ) : (
            <>
              {/* Cast List */}
              {activeReport === 'cast' && (
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wide mb-4">
                    {characters.length} Speaking Roles
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-white/50 border-b border-white/10">
                        <th className="pb-2">#</th>
                        <th className="pb-2">Character</th>
                        <th className="pb-2 text-right">Lines</th>
                        <th className="pb-2 text-right">Scenes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {characters.map((char, i) => (
                        <tr key={char.name} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 text-sm text-white/40">{i + 1}</td>
                          <td className="py-2 text-sm text-white font-medium">{char.name}</td>
                          <td className="py-2 text-sm text-right text-white/60">{char.dialogueCount}</td>
                          <td className="py-2 text-sm text-right text-white/60">{char.sceneAppearances}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Scene Report */}
              {activeReport === 'scenes' && (
                <div className="space-y-3">
                  {scenes.map(scene => (
                    <div 
                      key={scene.number}
                      className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-xs font-medium">
                          {scene.number}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          scene.intExt === 'INT' ? 'bg-blue-500/20 text-blue-400' :
                          scene.intExt === 'EXT' ? 'bg-green-500/20 text-green-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {scene.intExt}
                        </span>
                        <span className="text-xs text-white/40">Page {scene.pageNumber}</span>
                      </div>
                      <div className="text-sm text-white font-medium mb-1">{scene.location}</div>
                      <div className="text-xs text-white/50">{scene.timeOfDay}</div>
                      {scene.characters.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {scene.characters.map(char => (
                            <span key={char} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/60">
                              {char}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Character Stats */}
              {activeReport === 'characters' && (
                <div className="grid grid-cols-2 gap-4">
                  {characters.slice(0, 10).map((char, i) => (
                    <div 
                      key={char.name}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold text-white">{char.name}</span>
                        <span className="text-xs text-white/40">#{i + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-white/40 text-xs mb-1">Dialogue Lines</div>
                          <div className="text-white font-medium">{char.dialogueCount}</div>
                        </div>
                        <div>
                          <div className="text-white/40 text-xs mb-1">Scenes</div>
                          <div className="text-white font-medium">{char.sceneAppearances}</div>
                        </div>
                        <div>
                          <div className="text-white/40 text-xs mb-1">First Appearance</div>
                          <div className="text-white font-medium">Scene {char.firstAppearance}</div>
                        </div>
                        <div>
                          <div className="text-white/40 text-xs mb-1">Lines/Scene</div>
                          <div className="text-white font-medium">
                            {(char.dialogueCount / Math.max(1, char.sceneAppearances)).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Locations */}
              {activeReport === 'locations' && (
                <div className="space-y-2">
                  <div className="text-xs text-white/40 uppercase tracking-wide mb-4">
                    {locations.length} Unique Locations
                  </div>
                  {locations.map(location => {
                    const locationScenes = scenes.filter(s => s.location === location);
                    const intCount = locationScenes.filter(s => s.intExt === 'INT').length;
                    const extCount = locationScenes.filter(s => s.intExt === 'EXT').length;
                    
                    return (
                      <div 
                        key={location}
                        className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm text-white font-medium">{location}</div>
                          <div className="text-xs text-white/50">
                            {locationScenes.length} scene{locationScenes.length !== 1 ? 's' : ''}
                            {intCount > 0 && ` • ${intCount} INT`}
                            {extCount > 0 && ` • ${extCount} EXT`}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {locationScenes.slice(0, 5).map(s => (
                            <span 
                              key={s.number}
                              className="w-6 h-6 flex items-center justify-center bg-violet-500/20 text-violet-400 rounded text-[10px] font-medium"
                            >
                              {s.number}
                            </span>
                          ))}
                          {locationScenes.length > 5 && (
                            <span className="px-2 h-6 flex items-center text-[10px] text-white/40">
                              +{locationScenes.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <button
            onClick={analyzeScript}
            className="px-4 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              📋 Copy
            </button>
            <button
              className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
            >
              📥 Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
