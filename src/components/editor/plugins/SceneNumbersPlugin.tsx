/**
 * SceneNumbersPlugin — Automatic scene numbering
 * 
 * Displays scene numbers on left/right of scene headings
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, LexicalNode } from 'lexical';

interface SceneNumber {
  key: string;
  number: string;
  isOmitted: boolean;
}

interface SceneNumbersConfig {
  enabled: boolean;
  position: 'left' | 'right' | 'both';
  format: 'numeric' | 'letter' | 'dotted';
  startNumber: number;
}

interface SceneNumbersPluginProps {
  config: SceneNumbersConfig;
  onScenesExtracted?: (scenes: SceneNumber[]) => void;
}

export default function SceneNumbersPlugin({ config, onScenesExtracted }: SceneNumbersPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [scenes, setScenes] = useState<SceneNumber[]>([]);

  // Extract scene headings and assign numbers
  const extractScenes = useCallback(() => {
    if (!config.enabled) {
      setScenes([]);
      return;
    }

    const extractedScenes: SceneNumber[] = [];
    let currentNumber = config.startNumber;

    editor.getEditorState().read(() => {
      const root = $getRoot();
      
      const processNode = (node: LexicalNode) => {
        // Check if this is a scene heading
        if ('getType' in node) {
          const type = (node as any).__type || (node as any).getType?.();
          if (type === 'scene-heading' || type === 'screenplay-scene-heading') {
            // Get node key
            const key = node.getKey();
            
            // Format number based on config
            let numberStr: string;
            if (config.format === 'letter') {
              numberStr = numberToLetter(currentNumber);
            } else if (config.format === 'dotted') {
              numberStr = `${currentNumber}.`;
            } else {
              numberStr = String(currentNumber);
            }
            
            extractedScenes.push({
              key,
              number: numberStr,
              isOmitted: false,
            });
            
            currentNumber++;
          }
        }

        // Process children
        if ('getChildren' in node && typeof node.getChildren === 'function') {
          const children = node.getChildren();
          children.forEach((child: LexicalNode) => processNode(child));
        }
      };

      processNode(root);
    });

    setScenes(extractedScenes);
    onScenesExtracted?.(extractedScenes);
  }, [editor, config, onScenesExtracted]);

  // Extract scenes on mount and when content changes
  useEffect(() => {
    extractScenes();

    const unregister = editor.registerUpdateListener(() => {
      extractScenes();
    });

    return unregister;
  }, [editor, extractScenes]);

  // Render scene numbers
  if (!config.enabled || scenes.length === 0) {
    return null;
  }

  return (
    <div className="scene-numbers-overlay pointer-events-none absolute inset-0">
      {scenes.map(scene => (
        <SceneNumberMarker
          key={scene.key}
          scene={scene}
          position={config.position}
          nodeKey={scene.key}
        />
      ))}
    </div>
  );
}

interface SceneNumberMarkerProps {
  scene: SceneNumber;
  position: 'left' | 'right' | 'both';
  nodeKey: string;
}

function SceneNumberMarker({ scene, position, nodeKey }: SceneNumberMarkerProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; right: number } | null>(null);

  useEffect(() => {
    // Find the DOM element for this node
    const element = document.querySelector(`[data-lexical-node-key="${nodeKey}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      const container = element.closest('.editor-container');
      const containerRect = container?.getBoundingClientRect() || { top: 0, left: 0, right: 0 };
      
      setCoords({
        top: rect.top - containerRect.top,
        left: containerRect.left - 60,
        right: containerRect.right + 10,
      });
    }
  }, [nodeKey]);

  if (!coords) return null;

  const numberStyle: React.CSSProperties = {
    position: 'absolute',
    top: coords.top,
    fontSize: '11px',
    fontFamily: "'Courier Prime', monospace",
    color: scene.isOmitted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
    textDecoration: scene.isOmitted ? 'line-through' : 'none',
  };

  return (
    <>
      {(position === 'left' || position === 'both') && (
        <span style={{ ...numberStyle, left: coords.left }}>
          {scene.number}
        </span>
      )}
      {(position === 'right' || position === 'both') && (
        <span style={{ ...numberStyle, right: coords.right }}>
          {scene.number}
        </span>
      )}
    </>
  );
}

// Convert number to letter (1=A, 2=B, etc.)
function numberToLetter(num: number): string {
  if (num <= 26) {
    return String.fromCharCode(64 + num);
  }
  // For numbers > 26, use AA, AB, etc.
  const first = Math.floor((num - 1) / 26);
  const second = ((num - 1) % 26) + 1;
  return String.fromCharCode(64 + first) + String.fromCharCode(64 + second);
}

// Hook for using scene numbers config
export function useSceneNumbers() {
  const [config, setConfig] = useState<SceneNumbersConfig>({
    enabled: false,
    position: 'both',
    format: 'numeric',
    startNumber: 1,
  });

  const toggleEnabled = () => setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  const setPosition = (position: SceneNumbersConfig['position']) => 
    setConfig(prev => ({ ...prev, position }));
  const setFormat = (format: SceneNumbersConfig['format']) => 
    setConfig(prev => ({ ...prev, format }));
  const setStartNumber = (startNumber: number) => 
    setConfig(prev => ({ ...prev, startNumber }));

  return {
    config,
    setConfig,
    toggleEnabled,
    setPosition,
    setFormat,
    setStartNumber,
  };
}
