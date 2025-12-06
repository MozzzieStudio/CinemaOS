/**
 * TokenEditor — Premium Create/Edit Modal
 */

import { useState } from 'react';
import { Token, TokenType, getTokenIcon, TOKEN_PREFIXES } from '../../types/tokens';

interface TokenEditorProps {
  token: Token | null;
  tokenType: TokenType;
  projectId: string;
  onSave: (token: Token) => void;
  onDelete?: () => void;
  onClose: () => void;
  onGenerateVisual?: () => void;
}

const TOKEN_COLORS: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  Character: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', text: '#A78BFA', ring: 'rgba(139, 92, 246, 0.25)' },
  Location: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34D399', ring: 'rgba(16, 185, 129, 0.25)' },
  Prop: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#FBBF24', ring: 'rgba(245, 158, 11, 0.25)' },
  Set: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60A5FA', ring: 'rgba(59, 130, 246, 0.25)' },
  Scene: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60A5FA', ring: 'rgba(59, 130, 246, 0.25)' },
};


export default function TokenEditor({
  token,
  tokenType,
  projectId,
  onSave,
  onDelete,
  onClose,
  onGenerateVisual,
}: TokenEditorProps) {
  const isNew = !token;
  const colors = TOKEN_COLORS[tokenType];
  
  const [name, setName] = useState(token?.name || '');
  const [description, setDescription] = useState(token?.description || '');
  const [metadata, setMetadata] = useState<Record<string, string>>(token?.metadata || {});
  const [visualRefs, setVisualRefs] = useState<string[]>(token?.visual_refs || []);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    const slug = `${TOKEN_PREFIXES[tokenType]}${name.toLowerCase().replace(/\s+/g, '-')}`;
    const now = new Date().toISOString();
    
    const updatedToken: Token = {
      ...(token || {}),
      id: token?.id,
      project_id: projectId,
      token_type: tokenType,
      name,
      slug,
      description,
      visual_refs: visualRefs,
      lora_id: token?.lora_id,
      voice_id: token?.voice_id,
      metadata,
      created_at: token?.created_at || now,
      updated_at: now,
    };
    
    onSave(updatedToken);
  };

  const handleGenerateVisual = () => {
    setIsGenerating(true);
    // Mock AI Generation delay
    setTimeout(() => {
      const mockImage = `https://placehold.co/1024x576/1a1a1a/FFF?text=${encodeURIComponent(name || tokenType)}`;
      setVisualRefs(prev => [mockImage, ...prev]);
      setIsGenerating(false);
      onGenerateVisual?.(); // Optional callback
    }, 2000);
  };

  // Metadata fields based on token type
  const metadataFields: { key: string; label: string; placeholder: string }[] = 
    tokenType === 'Character' ? [
      { key: 'age', label: 'Age', placeholder: '30s' },
      { key: 'gender', label: 'Gender', placeholder: 'Female' },
      { key: 'appearance', label: 'Physical Appearance', placeholder: 'Blonde hair, blue eyes, tall...' },
      { key: 'personality', label: 'Personality', placeholder: 'Determined, witty, compassionate...' },
      { key: 'backstory', label: 'Backstory', placeholder: 'Former detective, seeking redemption...' },
    ] : tokenType === 'Location' ? [
      { key: 'setting', label: 'Setting', placeholder: 'Interior / Exterior' },
      { key: 'time_of_day', label: 'Time of Day', placeholder: 'Night' },
      { key: 'mood', label: 'Mood & Atmosphere', placeholder: 'Tense, eerie, romantic...' },
      { key: 'lighting', label: 'Lighting', placeholder: 'Dim neon signs, moonlight...' },
    ] : tokenType === 'Prop' ? [
      { key: 'material', label: 'Material', placeholder: 'Metal, wood, fabric...' },
      { key: 'size', label: 'Size', placeholder: 'Fits in hand, large...' },
      { key: 'significance', label: 'Story Significance', placeholder: 'MacGuffin, weapon, memento...' },
    ] : [];

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-scale"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-5 border-b border-[var(--color-border)] flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${colors.bg}, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            >
              {getTokenIcon(tokenType)}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-[var(--color-text-primary)]">
                {isNew ? `New ${tokenType}` : `Edit ${tokenType}`}
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isNew ? 'Add to your Visual Bible' : 'Update token details'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* Visual Preview */}
          {token?.visual_refs && token.visual_refs.length > 0 ? (
            <div className="relative aspect-video bg-black/20 rounded-xl overflow-hidden group">
              <img 
                src={token.visual_refs[0]} 
                alt={name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button className="btn-secondary">
                  Change
                </button>
                <button className="btn-secondary">
                  Add More
                </button>
              </div>
              {token.visual_refs.length > 1 && (
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {token.visual_refs.slice(0, 4).map((_, i) => (
                    <div 
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGenerateVisual}
              disabled={isGenerating || !name}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-border-hover)] flex flex-col items-center justify-center gap-3 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: colors.bg }}
            >
              {isGenerating ? (
                <>
                  <div className="spinner w-8 h-8" style={{ borderTopColor: colors.text }}></div>
                  <span className="text-sm text-[var(--color-text-muted)]">Generating with AI...</span>
                </>
              ) : (
                <>
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" style={{ color: colors.text }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    Generate Visual with AI
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {name ? `Based on "${name}"` : 'Enter a name first'}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Name
            </label>
            <div className="flex items-center rounded-xl overflow-hidden border border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-2" style={{ '--tw-ring-color': colors.ring } as any}>
              <span 
                className="px-4 py-3 font-mono text-sm font-semibold"
                style={{ background: colors.bg, color: colors.text }}
              >
                {TOKEN_PREFIXES[tokenType]}
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`Enter ${tokenType.toLowerCase()} name...`}
                className="flex-1 px-4 py-3 bg-[var(--color-bg-primary)] outline-none text-[var(--color-text-primary)]"
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Describe this ${tokenType.toLowerCase()} in detail for AI generation...`}
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Type-specific metadata */}
          {metadataFields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[var(--color-border)]"></div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                  {tokenType} Details
                </span>
                <div className="h-px flex-1 bg-[var(--color-border)]"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {metadataFields.map(field => (
                  <div key={field.key} className={field.key === 'backstory' || field.key === 'appearance' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={metadata[field.key] || ''}
                      onChange={e => setMetadata({ ...metadata, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="input text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LoRA Status */}
          {token?.lora_id && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-400">LoRA Trained</p>
                <p className="text-xs text-green-400/60">This {tokenType.toLowerCase()} will be consistent across all generations</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-tertiary)]">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </button>
          ) : <div />}
          
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="btn-primary"
            >
              {isNew ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Create {tokenType}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
