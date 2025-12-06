/**
 * SpeakingModePlugin — Read script aloud with Web Speech API
 * 
 * Features:
 * - Play/pause/stop controls
 * - Highlights current line being spoken
 * - Different voices for characters (optional)
 * - Speed control
 * - Reads dialogue naturally with character names
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  createCommand,
  LexicalCommand,
  COMMAND_PRIORITY_LOW,
} from 'lexical';

// Commands
export const START_SPEAKING_COMMAND: LexicalCommand<void> = createCommand('START_SPEAKING');
export const STOP_SPEAKING_COMMAND: LexicalCommand<void> = createCommand('STOP_SPEAKING');
export const PAUSE_SPEAKING_COMMAND: LexicalCommand<void> = createCommand('PAUSE_SPEAKING');

interface ScriptLine {
  nodeKey: string;
  type: string;
  text: string;
  character?: string;
}

interface SpeakingModeConfig {
  speed: number; // 0.5 to 2.0
  volume: number; // 0 to 1
  voice: string | null;
  announceCharacters: boolean;
  announceSceneHeadings: boolean;
}

interface SpeakingModePluginProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SpeakingModePlugin({ isOpen = false, onClose }: SpeakingModePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLineKey, setCurrentLineKey] = useState<string | null>(null);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [config, setConfig] = useState<SpeakingModeConfig>({
    speed: 1.0,
    volume: 1.0,
    voice: null,
    announceCharacters: true,
    announceSceneHeadings: true,
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Get available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current?.getVoices() || [];
      // Prefer English voices
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
    };

    loadVoices();
    synthRef.current.addEventListener('voiceschanged', loadVoices);

    return () => {
      synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Extract lines from script
  const extractLines = useCallback(() => {
    const extractedLines: ScriptLine[] = [];
    let lastCharacter: string | undefined;

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const children = root.getChildren();

      children.forEach(child => {
        const type = (child as any).__type || child.getType();
        const text = child.getTextContent().trim();
        const nodeKey = child.getKey();

        if (!text) return;

        if (type === 'character') {
          lastCharacter = text.replace(/\s*\([^)]+\)\s*/g, '');
        } else if (type === 'dialogue') {
          extractedLines.push({
            nodeKey,
            type: 'dialogue',
            text,
            character: lastCharacter,
          });
        } else if (type === 'scene-heading') {
          extractedLines.push({
            nodeKey,
            type: 'scene-heading',
            text,
          });
          lastCharacter = undefined;
        } else if (type === 'action') {
          extractedLines.push({
            nodeKey,
            type: 'action',
            text,
          });
        } else if (type === 'parenthetical') {
          extractedLines.push({
            nodeKey,
            type: 'parenthetical',
            text,
            character: lastCharacter,
          });
        }
      });
    });

    setLines(extractedLines);
  }, [editor]);

  // Speak a line
  const speakLine = useCallback((line: ScriptLine, index: number) => {
    if (!synthRef.current) return;

    // Cancel any current speech
    synthRef.current.cancel();

    let textToSpeak = '';

    if (line.type === 'scene-heading' && config.announceSceneHeadings) {
      textToSpeak = `Scene: ${line.text}`;
    } else if (line.type === 'dialogue') {
      if (config.announceCharacters && line.character) {
        textToSpeak = `${line.character} says: ${line.text}`;
      } else {
        textToSpeak = line.text;
      }
    } else if (line.type === 'parenthetical') {
      textToSpeak = line.text;
    } else if (line.type === 'action') {
      textToSpeak = line.text;
    }

    if (!textToSpeak) {
      // Skip to next line
      if (index < lines.length - 1) {
        setCurrentIndex(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentLineKey(null);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = config.speed;
    utterance.volume = config.volume;

    // Set voice if specified
    if (config.voice) {
      const voice = availableVoices.find(v => v.name === config.voice);
      if (voice) utterance.voice = voice;
    }

    // Highlight current line
    setCurrentLineKey(line.nodeKey);

    // Handle speech end
    utterance.onend = () => {
      if (index < lines.length - 1) {
        setCurrentIndex(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentLineKey(null);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentLineKey(null);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [config, lines.length, availableVoices]);

  // Play next line when index changes
  useEffect(() => {
    if (isPlaying && !isPaused && lines[currentIndex]) {
      speakLine(lines[currentIndex], currentIndex);
    }
  }, [currentIndex, isPlaying, isPaused, lines, speakLine]);

  // Apply highlight to current line
  useEffect(() => {
    const styleId = 'speaking-mode-highlight';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    if (!currentLineKey) {
      styleEl.textContent = '';
      return;
    }

    styleEl.textContent = `
      .speaking-current {
        background: linear-gradient(90deg, rgba(34, 211, 238, 0.2), transparent) !important;
        border-left: 3px solid #22d3ee !important;
        animation: speaking-pulse 1s ease-in-out infinite;
      }
      @keyframes speaking-pulse {
        0%, 100% { background-color: rgba(34, 211, 238, 0.1); }
        50% { background-color: rgba(34, 211, 238, 0.2); }
      }
    `;

    // Apply class to current line
    editor.getEditorState().read(() => {
      const root = $getRoot();
      root.getChildren().forEach(child => {
        const element = editor.getElementByKey(child.getKey());
        if (element) {
          if (child.getKey() === currentLineKey) {
            element.classList.add('speaking-current');
          } else {
            element.classList.remove('speaking-current');
          }
        }
      });
    });

    return () => {
      styleEl.textContent = '';
    };
  }, [editor, currentLineKey]);

  // Control functions
  const startSpeaking = useCallback(() => {
    extractLines();
    setCurrentIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
  }, [extractLines]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentLineKey(null);
    setCurrentIndex(0);
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (isPaused) {
      synthRef.current?.resume();
      setIsPaused(false);
    } else {
      synthRef.current?.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  const skipNext = useCallback(() => {
    synthRef.current?.cancel();
    if (currentIndex < lines.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, lines.length]);

  const skipPrevious = useCallback(() => {
    synthRef.current?.cancel();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Register commands
  useEffect(() => {
    const commands = [
      editor.registerCommand(START_SPEAKING_COMMAND, () => {
        startSpeaking();
        return true;
      }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(STOP_SPEAKING_COMMAND, () => {
        stopSpeaking();
        return true;
      }, COMMAND_PRIORITY_LOW),
      editor.registerCommand(PAUSE_SPEAKING_COMMAND, () => {
        pauseSpeaking();
        return true;
      }, COMMAND_PRIORITY_LOW),
    ];

    return () => commands.forEach(unregister => unregister());
  }, [editor, startSpeaking, stopSpeaking, pauseSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <SpeakingModeDialog
      isPlaying={isPlaying}
      isPaused={isPaused}
      config={config}
      onConfigChange={setConfig}
      availableVoices={availableVoices}
      onPlay={startSpeaking}
      onPause={pauseSpeaking}
      onStop={stopSpeaking}
      onSkipNext={skipNext}
      onSkipPrevious={skipPrevious}
      onClose={() => {
        stopSpeaking();
        onClose?.();
      }}
      currentLine={lines[currentIndex]}
      progress={lines.length > 0 ? ((currentIndex + 1) / lines.length) * 100 : 0}
    />
  );
}

/**
 * Speaking Mode Dialog
 */
interface SpeakingModeDialogProps {
  isPlaying: boolean;
  isPaused: boolean;
  config: SpeakingModeConfig;
  onConfigChange: (config: SpeakingModeConfig) => void;
  availableVoices: SpeechSynthesisVoice[];
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onClose: () => void;
  currentLine?: ScriptLine;
  progress: number;
}

function SpeakingModeDialog({
  isPlaying,
  isPaused,
  config,
  onConfigChange,
  availableVoices,
  onPlay,
  onPause,
  onStop,
  onSkipNext,
  onSkipPrevious,
  onClose,
  currentLine,
  progress,
}: SpeakingModeDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔊</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Speaking Mode</h2>
              <p className="text-xs text-white/50">Read your script aloud</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        {/* Current Line */}
        {currentLine && (
          <div className="px-6 py-4 bg-cyan-500/10 border-b border-cyan-500/20">
            {currentLine.character && (
              <div className="text-xs text-cyan-400 font-medium mb-1">{currentLine.character}</div>
            )}
            <div className="text-sm text-white/90 line-clamp-2">{currentLine.text}</div>
          </div>
        )}

        {/* Progress */}
        <div className="h-1 bg-white/5">
          <div 
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={onSkipPrevious}
              disabled={!isPlaying}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            {!isPlaying ? (
              <button
                onClick={onPlay}
                className="p-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white transition-all shadow-lg shadow-cyan-500/30"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            ) : isPaused ? (
              <button
                onClick={onPause}
                className="p-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white transition-all shadow-lg shadow-cyan-500/30"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="p-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white transition-all shadow-lg shadow-cyan-500/30"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </button>
            )}
            
            <button
              onClick={onSkipNext}
              disabled={!isPlaying}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>

            <button
              onClick={onStop}
              disabled={!isPlaying}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z"/>
              </svg>
            </button>
          </div>

          {/* Speed Control */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span>Speed</span>
                <span>{config.speed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.speed}
                onChange={(e) => onConfigChange({ ...config, speed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Voice Selection */}
            {availableVoices.length > 0 && (
              <div>
                <label className="block text-xs text-white/50 mb-2">Voice</label>
                <select
                  value={config.voice || ''}
                  onChange={(e) => onConfigChange({ ...config, voice: e.target.value || null })}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-cyan-500"
                >
                  <option value="">Default</option>
                  {availableVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={config.announceCharacters}
                  onChange={(e) => onConfigChange({ ...config, announceCharacters: e.target.checked })}
                  className="accent-cyan-500"
                />
                Announce characters
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={config.announceSceneHeadings}
                  onChange={(e) => onConfigChange({ ...config, announceSceneHeadings: e.target.checked })}
                  className="accent-cyan-500"
                />
                Read scene headings
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for speaking mode
 */
export function useSpeakingMode() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
