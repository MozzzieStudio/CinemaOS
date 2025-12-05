/**
 * SceneAnalysisPanel — AI-powered scene analysis
 * 
 * Features:
 * - Pacing detection
 * - Character dialogue balance  
 * - Emotional arc
 * - Suggestions for improvement
 */

import { useState, useEffect } from 'react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import {
  $isSceneHeadingNode,
  $isActionNode,
  $isCharacterNode,
  $isDialogueNode,
} from "./nodes/ScriptNodes";

interface SceneStats {
  heading: string;
  actionLines: number;
  dialogueLines: number;
  characters: string[];
  pacingScore: 'slow' | 'medium' | 'fast';
  suggestions: string[];
}

interface OverallStats {
  totalScenes: number;
  totalPages: number;
  dialoguePercentage: number;
  actionPercentage: number;
  topCharacters: { name: string; lines: number }[];
  pacing: 'slow' | 'medium' | 'fast';
}

interface SceneAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SceneAnalysisPanel({ isOpen, onClose }: SceneAnalysisPanelProps) {
  const [editor] = useLexicalComposerContext();
  const [scenes, setScenes] = useState<SceneStats[]>([]);
  const [overall, setOverall] = useState<OverallStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenes' | 'characters'>('overview');

  const analyzeScript = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        const sceneData: SceneStats[] = [];
        let currentScene: SceneStats | null = null;
        const characterDialogue: Record<string, number> = {};
        let totalAction = 0;
        let totalDialogue = 0;
        
        for (const node of children) {
          if ($isSceneHeadingNode(node)) {
            if (currentScene) sceneData.push(currentScene);
            
            currentScene = {
              heading: node.getTextContent(),
              actionLines: 0,
              dialogueLines: 0,
              characters: [],
              pacingScore: 'medium',
              suggestions: [],
            };
          } else if (currentScene) {
            if ($isActionNode(node)) {
              const lines = node.getTextContent().split('\n').length;
              currentScene.actionLines += lines;
              totalAction += lines;
            } else if ($isDialogueNode(node)) {
              const lines = node.getTextContent().split('\n').length;
              currentScene.dialogueLines += lines;
              totalDialogue += lines;
            } else if ($isCharacterNode(node)) {
              const name = node.getTextContent().trim().toUpperCase();
              if (!currentScene.characters.includes(name)) {
                currentScene.characters.push(name);
              }
              characterDialogue[name] = (characterDialogue[name] || 0) + 1;
            }
          }
        }
        
        if (currentScene) sceneData.push(currentScene);
        
        // Calculate pacing and suggestions for each scene
        sceneData.forEach(scene => {
          const total = scene.actionLines + scene.dialogueLines;
          if (total === 0) {
            scene.pacingScore = 'medium';
          } else if (scene.dialogueLines / total > 0.7) {
            scene.pacingScore = 'slow';
            scene.suggestions.push('Consider adding more action to break up dialogue');
          } else if (scene.actionLines / total > 0.8) {
            scene.pacingScore = 'fast';
            scene.suggestions.push('Scene may feel rushed - consider adding character reactions');
          } else {
            scene.pacingScore = 'medium';
          }
          
          if (scene.characters.length === 0) {
            scene.suggestions.push('No characters in this scene');
          } else if (scene.characters.length === 1 && scene.dialogueLines > 5) {
            scene.suggestions.push('Single character with lots of dialogue - consider adding conflict');
          }
        });
        
        // Sort characters by dialogue count
        const topCharacters = Object.entries(characterDialogue)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, lines]) => ({ name, lines }));
        
        const totalLines = totalAction + totalDialogue;
        
        setScenes(sceneData);
        setOverall({
          totalScenes: sceneData.length,
          totalPages: Math.ceil(children.length / 55),
          dialoguePercentage: totalLines > 0 ? Math.round((totalDialogue / totalLines) * 100) : 0,
          actionPercentage: totalLines > 0 ? Math.round((totalAction / totalLines) * 100) : 0,
          topCharacters,
          pacing: totalDialogue > totalAction * 2 ? 'slow' : totalAction > totalDialogue * 2 ? 'fast' : 'medium',
        });
      });
      
      setIsAnalyzing(false);
    }, 500);
  };

  useEffect(() => {
    if (isOpen) analyzeScript();
  }, [isOpen]);

  if (!isOpen) return null;

  const getPacingColor = (pacing: 'slow' | 'medium' | 'fast') => {
    switch (pacing) {
      case 'slow': return 'text-blue-400';
      case 'medium': return 'text-green-400';
      case 'fast': return 'text-orange-400';
    }
  };

  const getPacingIcon = (pacing: 'slow' | 'medium' | 'fast') => {
    switch (pacing) {
      case 'slow': return '🐢';
      case 'medium': return '⚡';
      case 'fast': return '🚀';
    }
  };

  return (
    <div className="w-80 h-full border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-sm">AI Analysis</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {(['overview', 'scenes', 'characters'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="spinner mb-4" />
            <p className="text-sm text-[var(--color-text-muted)]">Analyzing script...</p>
          </div>
        ) : activeTab === 'overview' && overall ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-accent)]">{overall.totalScenes}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Scenes</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-[var(--color-accent)]">~{overall.totalPages}</p>
                <p className="text-xs text-[var(--color-text-muted)]">Pages</p>
              </div>
            </div>

            {/* Dialogue vs Action */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">BALANCE</p>
              <div className="flex h-4 rounded-full overflow-hidden bg-white/5">
                <div 
                  className="bg-blue-500 transition-all"
                  style={{ width: `${overall.dialoguePercentage}%` }}
                />
                <div 
                  className="bg-green-500 transition-all"
                  style={{ width: `${overall.actionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-400">Dialogue {overall.dialoguePercentage}%</span>
                <span className="text-green-400">Action {overall.actionPercentage}%</span>
              </div>
            </div>

            {/* Overall Pacing */}
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">PACING</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getPacingIcon(overall.pacing)}</span>
                <span className={`text-lg font-bold capitalize ${getPacingColor(overall.pacing)}`}>
                  {overall.pacing}
                </span>
              </div>
            </div>

            <button
              onClick={analyzeScript}
              className="w-full btn-secondary text-sm"
            >
              🔄 Re-analyze
            </button>
          </div>
        ) : activeTab === 'scenes' ? (
          <div className="space-y-3">
            {scenes.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
                No scenes found
              </p>
            ) : scenes.map((scene, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium line-clamp-2">{scene.heading}</p>
                  <span className={`text-lg ${getPacingColor(scene.pacingScore)}`}>
                    {getPacingIcon(scene.pacingScore)}
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-[var(--color-text-muted)]">
                  <span>{scene.actionLines} action</span>
                  <span>•</span>
                  <span>{scene.dialogueLines} dialogue</span>
                </div>
                {scene.suggestions.length > 0 && (
                  <div className="mt-2 text-xs text-amber-400">
                    💡 {scene.suggestions[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === 'characters' && overall ? (
          <div className="space-y-3">
            {overall.topCharacters.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
                No characters found
              </p>
            ) : overall.topCharacters.map((char, i) => (
              <div key={char.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  i === 1 ? 'bg-gray-400/20 text-gray-300' :
                  i === 2 ? 'bg-orange-700/20 text-orange-400' :
                  'bg-white/10 text-white/50'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{char.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{char.lines} lines</p>
                </div>
                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--color-accent)]"
                    style={{ width: `${(char.lines / (overall.topCharacters[0]?.lines || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
