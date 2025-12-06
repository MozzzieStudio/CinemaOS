/**
 * TokenCard — Premium Token Display
 */

import { useState } from 'react';
import { Token, getTokenIcon, TOKEN_PREFIXES } from '../../types/tokens';

interface TokenCardProps {
  token: Token;
  viewMode: 'list' | 'grid';
  onClick: () => void;
  onGenerateVisual: () => void;
}

const TOKEN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Character: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#A78BFA' },
  Location: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34D399' },
  Prop: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#FBBF24' },
  Set: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60A5FA' },
  Scene: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60A5FA' },
};


export default function TokenCard({ token, viewMode, onClick, onGenerateVisual }: TokenCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const hasVisual = token.visual_refs.length > 0;
  const colors = TOKEN_COLORS[token.token_type];

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    await onGenerateVisual();
    setIsGenerating(false);
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="group flex items-center gap-4 p-4 bg-[#141414] border border-white/10 rounded-xl hover:border-white/20 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
      >
        {/* Thumbnail */}
        <div 
          className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
          style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
        >
          {hasVisual ? (
            <img src={token.visual_refs[0]} alt={token.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">{getTokenIcon(token.token_type)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ background: colors.bg, color: colors.text }}
            >
              {TOKEN_PREFIXES[token.token_type]}
            </span>
            <h3 className="font-semibold text-white truncate">{token.name}</h3>
          </div>
          <p className="text-sm text-white/40 truncate mt-1">{token.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {token.lora_id && (
            <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              LoRA
            </span>
          )}
          {!hasVisual && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              {isGenerating ? (
                <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              )}
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#141414] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image/Placeholder */}
      <div className="aspect-square flex items-center justify-center overflow-hidden relative">
        {hasVisual ? (
          <>
            <img src={token.visual_refs[0]} alt={token.name} className="w-full h-full object-cover" />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </>
        ) : (
          <div 
            className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: `linear-gradient(135deg, ${colors.bg}, transparent)` }}
          >
            <span className="text-5xl opacity-60">{getTokenIcon(token.token_type)}</span>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
              style={{ 
                background: colors.bg, 
                border: `1px solid ${colors.border}`,
                color: colors.text 
              }}
            >
              <span className="flex items-center gap-1.5">
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Generate Visual
                  </>
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: colors.bg, color: colors.text }}
          >
            {TOKEN_PREFIXES[token.token_type]}
          </span>
          <h3 className="font-semibold text-sm text-white truncate">{token.name}</h3>
        </div>
        <p className="text-xs text-white/40 truncate">{token.description}</p>
      </div>

      {/* Badges */}
      <div className="absolute top-2 right-2 flex gap-1">
        {token.lora_id && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/80 text-white shadow-lg">
            LoRA
          </span>
        )}
        {token.visual_refs.length > 1 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
            +{token.visual_refs.length - 1}
          </span>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
        <button className="px-5 py-2.5 bg-white text-black rounded-lg font-semibold text-sm transform scale-95 group-hover:scale-100 transition-transform shadow-xl">
          Edit {token.token_type}
        </button>
      </div>
    </div>
  );
}
