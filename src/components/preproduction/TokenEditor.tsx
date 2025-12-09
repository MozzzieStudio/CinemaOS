import { useState } from 'react';
import { Token, TokenType, getTokenIcon, TOKEN_PREFIXES, TemporalState, TokenRelationship } from '../../types/tokens';
import { toast } from 'sonner';
import { TrainingService } from '../../services/TrainingService';

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

type Tab = 'basics' | 'timeline' | 'relationships' | 'training';

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
  const [activeTab, setActiveTab] = useState<Tab>('basics');
  
  // Basic State
  const [name, setName] = useState(token?.name || '');
  const [description, setDescription] = useState(token?.description || '');
  const [metadata, setMetadata] = useState<Record<string, string>>(token?.metadata || {});
  const [visualRefs, setVisualRefs] = useState<string[]>(token?.visual_refs || []);
  
  // Advanced State
  const [temporalStates, setTemporalStates] = useState<TemporalState[]>(token?.temporal_states || []);
  const [relationships, setRelationships] = useState<TokenRelationship[]>(token?.relationships || []);
  const [loraStatus, setLoraStatus] = useState(token?.lora_training_status || 'none');

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
      lora_training_status: loraStatus,
      voice_id: token?.voice_id,
      metadata,
      temporal_states: temporalStates,
      relationships: relationships,
      created_at: token?.created_at || now,
      updated_at: now,
    };
    
    onSave(updatedToken);
  };

  const handleGenerateVisual = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const mockImage = `https://placehold.co/1024x576/1a1a1a/FFF?text=${encodeURIComponent(name || tokenType)}`;
      setVisualRefs(prev => [mockImage, ...prev]);
      setIsGenerating(false);
      onGenerateVisual?.();
    }, 2000);
  };

  const handleTrainLoRA = async () => {
    if (visualRefs.length < 4) return;
    setLoraStatus('pending');
    // We construct a temporary token object because we haven't saved state yet, 
    // but the service needs the visual refs.
    const tempToken: Token = { 
      ...token!, 
      name, 
      visual_refs: visualRefs, 
      project_id: projectId,
      token_type: tokenType,
      slug: `${TOKEN_PREFIXES[tokenType]}${name.toLowerCase()}`,
      description: description,
      metadata: metadata,
      created_at: '',
      updated_at: ''
    };
    
    const trainingId = await TrainingService.triggerLoRATraining(tempToken);
    if (trainingId) {
      setLoraStatus('training');
      toast.success("LoRA Training Initiated");
    } else {
      setLoraStatus('failed');
    }
  };

  // --- Sub-Components for Tabs ---

  const renderBasicsTab = () => {
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
      <div className="space-y-5">
        {/* Visual Preview */}
        {visualRefs.length > 0 ? (
          <div className="relative aspect-video bg-black/20 rounded-xl overflow-hidden group">
            <img src={visualRefs[0]} alt={name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button className="btn-secondary">Change</button>
              <button className="btn-secondary">Add More</button>
            </div>
            {visualRefs.length > 1 && (
              <div className="absolute bottom-3 right-3 flex gap-1">
                {visualRefs.slice(0, 4).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />
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
                <span className="text-sm text-[var(--color-text-muted)]">Generating...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110" style={{ borderColor: colors.border }}>
                   <span style={{ color: colors.text }}>✨</span>
                </div>
                <span className="text-sm font-medium" style={{ color: colors.text }}>Generate Visual</span>
              </>
            )}
          </button>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Name</label>
          <div className="flex items-center rounded-xl overflow-hidden border border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-2" style={{ '--tw-ring-color': colors.ring } as any}>
            <span className="px-4 py-3 font-mono text-sm font-semibold" style={{ background: colors.bg, color: colors.text }}>{TOKEN_PREFIXES[tokenType]}</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`Enter ${tokenType.toLowerCase()} name...`} className="flex-1 px-4 py-3 bg-[var(--color-bg-primary)] outline-none text-[var(--color-text-primary)]" autoFocus />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={`Describe this ${tokenType.toLowerCase()}...`} rows={3} className="input resize-none" />
        </div>

        {/* Metadata */}
        {metadataFields.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)]">
            {metadataFields.map(field => (
              <div key={field.key} className={field.key === 'backstory' || field.key === 'appearance' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{field.label}</label>
                <input type="text" value={metadata[field.key] || ''} onChange={e => setMetadata({ ...metadata, [field.key]: e.target.value })} placeholder={field.placeholder} className="input text-sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTimelineTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Temporal Changes</h3>
        <button className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors" onClick={() => {
            const newState: TemporalState = {
                id: crypto.randomUUID(),
                token_id: token?.id || '',
                scope_type: 'scene',
                scope_range: ['1'],
                changes: { description: '' }
            };
            setTemporalStates([...temporalStates, newState]);
        }}>+ Add State</button>
      </div>
      
      {temporalStates.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-lg">
          No temporal changes defined.<br/>Character remains consistent throughout.
        </div>
      )}

      <div className="space-y-3">
        {temporalStates.map((state, idx) => (
            <div key={state.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex gap-2 mb-2">
                    <select 
                        value={state.scope_type} 
                        onChange={(e) => {
                            const newStates = [...temporalStates];
                            newStates[idx].scope_type = e.target.value as any;
                            setTemporalStates(newStates);
                        }}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                        <option value="scene">Scene</option>
                        <option value="act">Act</option>
                    </select>
                    <input 
                        type="text" 
                        value={state.scope_range.join('-')} 
                        onChange={(e) => {
                             const newStates = [...temporalStates];
                             newStates[idx].scope_range = e.target.value.split('-');
                             setTemporalStates(newStates);
                        }}
                        placeholder="Range (e.g. 1-5)"
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white w-24"
                    />
                    <button className="ml-auto text-red-400 hover:text-red-300" onClick={() => setTemporalStates(temporalStates.filter((_, i) => i !== idx))}>×</button>
                </div>
                <textarea 
                    value={state.changes.description || ''}
                    onChange={(e) => {
                        const newStates = [...temporalStates];
                        newStates[idx].changes.description = e.target.value;
                        setTemporalStates(newStates);
                    }}
                    placeholder="Description override (e.g. 'Has a black eye')"
                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white/80 resize-none h-16"
                />
            </div>
        ))}
      </div>
    </div>
  );

  const renderRelationshipsTab = () => (
     <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Relationships</h3>
         <button className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors" onClick={() => {
            const newRel: TokenRelationship = {
                target_id: '',
                relationship_type: 'related_to',
                notes: ''
            };
            setRelationships([...relationships, newRel]);
        }}>+ Add Link</button>
      </div>

       {relationships.length === 0 && (
        <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/10 rounded-lg">
          No relationships defined.
        </div>
      )}
      
      <div className="space-y-3">
         {relationships.map((rel, idx) => (
            <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                 <div className="flex gap-2">
                    <select 
                        value={rel.relationship_type} 
                        onChange={(e) => {
                            const newRels = [...relationships];
                            newRels[idx].relationship_type = e.target.value as any;
                            setRelationships(newRels);
                        }}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                        <option value="related_to">Related To</option>
                        <option value="loves">Loves</option>
                        <option value="hates">Hates</option>
                        <option value="rivals">Rivals</option>
                        <option value="family">Family</option>
                    </select>
                     <input 
                        type="text" 
                        value={rel.target_id} 
                        onChange={(e) => {
                             const newRels = [...relationships];
                             newRels[idx].target_id = e.target.value;
                             setRelationships(newRels);
                        }}
                        placeholder="Target ID (mock)"
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white flex-1"
                    />
                     <button className="ml-auto text-red-400 hover:text-red-300" onClick={() => setRelationships(relationships.filter((_, i) => i !== idx))}>×</button>
                 </div>
                  <input 
                        type="text" 
                        value={rel.notes || ''} 
                        onChange={(e) => {
                             const newRels = [...relationships];
                             newRels[idx].notes = e.target.value;
                             setRelationships(newRels);
                        }}
                        placeholder="Notes (e.g. 'Secretly jealous')"
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white/80"
                    />
            </div>
         ))}
      </div>
     </div>
  );

  const renderTrainingTab = () => (
     <div className="space-y-6 pt-2">
        <div className="p-4 bg-gradient-to-br from-violet-900/20 to-indigo-900/20 rounded-xl border border-violet-500/20">
            <h3 className="text-violet-300 font-semibold mb-1">LoRA Model Training</h3>
            <p className="text-xs text-violet-200/60 mb-4">Train a custom AI model on this character's face for consistent generation.</p>
            
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-violet-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (visualRefs.length / 10) * 100)}%` }}
                    />
                </div>
                <span className="text-xs font-mono text-violet-300">{visualRefs.length}/10 Images</span>
            </div>
            
             <button
              onClick={handleTrainLoRA}
              disabled={visualRefs.length < 4 || loraStatus === 'training' || loraStatus === 'completed'}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loraStatus === 'training' ? 'Training in Progress...' : 
               loraStatus === 'completed' ? 'Training Completed' : 
               visualRefs.length < 4 ? 'Need 4+ Images to Train' : 
               'Start Training (Pro)'}
            </button>
            {loraStatus === 'training' && <p className="text-xs text-center mt-2 text-violet-400 animate-pulse">Estimated time: 10-15 minutes</p>}
        </div>

        <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/40 uppercase">Training Data</h4>
             <div className="grid grid-cols-4 gap-2">
                {visualRefs.map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-black/20 overflow-hidden border border-white/5 relative group">
                        <img src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                         <button className="absolute top-1 right-1 text-xs bg-black/60 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400">×</button>
                    </div>
                ))}
                <button className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all">
                    <span className="text-xl text-white/20">+</span>
                    <span className="text-[10px] text-white/30">Upload</span>
                </button>
             </div>
        </div>
     </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-scale flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between shrink-0" style={{ background: `linear-gradient(135deg, ${colors.bg}, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
              {getTokenIcon(tokenType)}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-[var(--color-text-primary)]">{isNew ? `New ${tokenType}` : `Edit ${tokenType}`}</h2>
              <p className="text-xs text-[var(--color-text-muted)]">{isNew ? 'Add to your Visual Bible' : 'Update token details'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] px-5 gap-6 shrink-0 bg-[var(--color-bg-tertiary)]">
            {(['basics', 'timeline', 'relationships', 'training'] as Tab[]).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                        activeTab === tab 
                        ? 'border-[var(--color-accent)] text-white' 
                        : 'border-transparent text-white/40 hover:text-white/70'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-[var(--color-bg-primary)]">
            {activeTab === 'basics' && renderBasicsTab()}
            {activeTab === 'timeline' && renderTimelineTab()}
            {activeTab === 'relationships' && renderRelationshipsTab()}
            {activeTab === 'training' && renderTrainingTab()}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-tertiary)] shrink-0">
          {onDelete ? (
            <button onClick={onDelete} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">Delete</button>
          ) : <div />}
          
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} className="btn-primary">
              {isNew ? 'Create Token' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

