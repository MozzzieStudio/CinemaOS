/**
 * MoresContinuedsPlugin — Auto-insert (MORE), (CONT'D), (CONTINUED)
 * 
 * Handles screenplay pagination conventions
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

interface MoresContinuedsConfig {
  enabled: boolean;
  showMore: boolean;
  showContd: boolean;
  showContinued: boolean;
  moreText: string;
  contdText: string;
  continuedText: string;
}

interface MoresContinuedsPluginProps {
  config: MoresContinuedsConfig;
  pageHeight: number; // In lines
}

interface PageBreakInfo {
  lineNumber: number;
  type: 'dialogue' | 'scene' | 'normal';
  characterName?: string;
}

export default function MoresContinuedsPlugin({ config, pageHeight = 54 }: MoresContinuedsPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [pageBreaks, setPageBreaks] = useState<PageBreakInfo[]>([]);

  // Calculate where page breaks would occur
  const calculatePageBreaks = useCallback(() => {
    if (!config.enabled) {
      setPageBreaks([]);
      return;
    }

    const breaks: PageBreakInfo[] = [];
    let currentLine = 0;
    let lastCharacterName: string | undefined;
    let inDialogue = false;

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const content = root.getTextContent();
      const lines = content.split('\n');

      lines.forEach((line, _index) => {
        currentLine++;
        const trimmed = line.trim();

        // Track character cues for CONT'D
        if (trimmed.match(/^[A-Z][A-Z\s\.\-]+$/)) {
          const cleanName = trimmed.replace(/\s*\([^)]+\)\s*/g, '').trim();
          if (cleanName.length > 0) {
            lastCharacterName = cleanName;
            inDialogue = true;
          }
        }

        // Check if we're at a page boundary
        if (currentLine % pageHeight === 0) {
          const type = inDialogue ? 'dialogue' : 
                      trimmed.match(/^(INT\.|EXT\.|I\/E\.)/) ? 'scene' : 'normal';
          
          breaks.push({
            lineNumber: currentLine,
            type,
            characterName: type === 'dialogue' ? lastCharacterName : undefined,
          });
        }

        // Reset dialogue tracking at scene headings
        if (trimmed.match(/^(INT\.|EXT\.|I\/E\.)/)) {
          inDialogue = false;
          lastCharacterName = undefined;
        }

        // Empty lines end dialogue blocks
        if (trimmed === '') {
          inDialogue = false;
        }
      });
    });

    setPageBreaks(breaks);
  }, [editor, config.enabled, pageHeight]);

  // Recalculate on content changes
  useEffect(() => {
    calculatePageBreaks();

    const unregister = editor.registerUpdateListener(() => {
      calculatePageBreaks();
    });

    return unregister;
  }, [editor, calculatePageBreaks]);

  // Render page break annotations
  if (!config.enabled || pageBreaks.length === 0) {
    return null;
  }

  return (
    <div className="mores-continueds-overlay pointer-events-none absolute inset-0">
      {pageBreaks.map((breakInfo, index) => (
        <PageBreakAnnotation
          key={index}
          breakInfo={breakInfo}
          config={config}
        />
      ))}
    </div>
  );
}

interface PageBreakAnnotationProps {
  breakInfo: PageBreakInfo;
  config: MoresContinuedsConfig;
}

function PageBreakAnnotation({ breakInfo, config }: PageBreakAnnotationProps) {
  if (breakInfo.type === 'dialogue' && config.showMore) {
    return (
      <div 
        className="page-break-annotation"
        style={{
          position: 'absolute',
          // Position would be calculated based on actual line height
          top: `${breakInfo.lineNumber * 18}px`,
          textAlign: 'center',
          width: '100%',
        }}
      >
        <span className="text-xs text-white/40 font-mono">
          {config.moreText}
        </span>
        {breakInfo.characterName && config.showContd && (
          <div className="mt-4 text-xs text-white/40 font-mono uppercase">
            {breakInfo.characterName} {config.contdText}
          </div>
        )}
      </div>
    );
  }

  if (breakInfo.type === 'scene' && config.showContinued) {
    return (
      <div 
        className="page-break-annotation"
        style={{
          position: 'absolute',
          top: `${breakInfo.lineNumber * 18}px`,
          width: '100%',
        }}
      >
        <span className="text-xs text-white/40 font-mono">
          {config.continuedText}
        </span>
      </div>
    );
  }

  return null;
}

// Hook for mores/continueds configuration
export function useMoresContinueds() {
  const [config, setConfig] = useState<MoresContinuedsConfig>({
    enabled: true,
    showMore: true,
    showContd: true,
    showContinued: true,
    moreText: '(MORE)',
    contdText: "(CONT'D)",
    continuedText: 'CONTINUED:',
  });

  const toggleEnabled = () => setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  const toggleMore = () => setConfig(prev => ({ ...prev, showMore: !prev.showMore }));
  const toggleContd = () => setConfig(prev => ({ ...prev, showContd: !prev.showContd }));
  const toggleContinued = () => setConfig(prev => ({ ...prev, showContinued: !prev.showContinued }));

  const setMoreText = (text: string) => setConfig(prev => ({ ...prev, moreText: text }));
  const setContdText = (text: string) => setConfig(prev => ({ ...prev, contdText: text }));
  const setContinuedText = (text: string) => setConfig(prev => ({ ...prev, continuedText: text }));

  return {
    config,
    setConfig,
    toggleEnabled,
    toggleMore,
    toggleContd,
    toggleContinued,
    setMoreText,
    setContdText,
    setContinuedText,
  };
}
