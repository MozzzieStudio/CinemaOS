
import { useState } from 'react';
import { Token } from '../../types/tokens';
import { getTokenDisplayName } from '../../types/tokens';

interface SceneOverridesPanelProps {
    tokens: Token[];
    scenes: number[]; // e.g., [1, 2, 3, 4, 5...]
    onUpdateOverride: (tokenId: string, sceneNum: number, override: string) => void;
}

export default function SceneOverridesPanel({ tokens, scenes, onUpdateOverride }: SceneOverridesPanelProps) {
    // Filter only Characters for now
    const characters = tokens.filter(t => t.token_type === 'Character');
    
    const [selectedCell, setSelectedCell] = useState<{tId: string, sNum: number} | null>(null);

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-primary)] text-white overflow-hidden">
            <div className="p-4 border-b border-white/10 shrink-0">
                <h2 className="text-lg font-bold">Scene Overrides Matrix</h2>
                <p className="text-xs text-white/50">Define temporal changes (costume, mood) per scene.</p>
            </div>
            
            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse text-xs">
                    <thead className="sticky top-0 bg-[var(--color-bg-secondary)] z-10 shadow-lg">
                        <tr>
                            <th className="p-3 text-left w-48 border-b border-r border-white/10 text-white/60">Character</th>
                            {scenes.map(s => (
                                <th key={s} className="p-3 min-w-[150px] border-b border-r border-white/10 text-white/60 font-mono">
                                    SCENE {s}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {characters.map(char => (
                            <tr key={char.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 border-b border-r border-white/10 font-medium sticky left-0 bg-[var(--color-bg-primary)] z-10">
                                    {getTokenDisplayName(char)}
                                </td>
                                {scenes.map(s => {
                                    // Find if there's an active override
                                    // Logic: look in char.temporal_states for scope_type='scene' && scope_range includes s
                                    const override = char.temporal_states?.find(
                                        ts => ts.scope_type === 'scene' && ts.scope_range.map(Number).includes(s)
                                    );
                                    
                                    const isSelected = selectedCell?.tId === char.id && selectedCell?.sNum === s;

                                    return (
                                        <td 
                                            key={`${char.id}-${s}`} 
                                            className={`p-1 border-b border-r border-white/10 align-top cursor-pointer relative ${
                                                override ? 'bg-violet-500/10' : ''
                                            } ${isSelected ? 'ring-1 ring-violet-500 bg-violet-500/20' : ''}`}
                                            onClick={() => setSelectedCell({ tId: char.id!, sNum: s })}
                                        >
                                            {isSelected ? (
                                                <textarea 
                                                    autoFocus
                                                    className="w-full h-20 bg-transparent resize-none outline-none p-1 text-[var(--color-text-primary)]"
                                                    defaultValue={override?.changes.description || ''}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (override?.changes.description || '')) {
                                                            onUpdateOverride(char.id!, s, e.target.value);
                                                        }
                                                        setSelectedCell(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-20 p-2 overflow-hidden text-white/70">
                                                     {override ? (
                                                        <span className="text-violet-200">{override.changes.description}</span>
                                                     ) : (
                                                        <span className="text-white/10 italic hover:text-white/20">Inherit</span>
                                                     )}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
