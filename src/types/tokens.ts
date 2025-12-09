/**
 * Token Types — TypeScript interfaces matching Rust models
 * 
 * Used for Vault entities: Characters, Locations, Props, Sets
 */

export type TokenType = 'Character' | 'Location' | 'Prop' | 'Set';

export const TOKEN_PREFIXES: Record<TokenType, string> = {
  Character: '@',
  Location: '/',
  Prop: '#',
  Set: '🎭',
};

// Temporal State: Properties that change over time (e.g. appearance, mood)
export interface TemporalState {
  id: string;
  token_id: string;
  scope_type: 'scene' | 'act' | 'global';
  scope_range: string[]; // ['1', '5'] for Scenes 1-5, or ['1'] for Act 1
  changes: {
    appearance?: string;
    mood?: string;
    description?: string;
    // Dynamic properties
    [key: string]: string | undefined;
  };
}

export interface Token {
  id?: string;
  project_id: string;
  token_type: TokenType;
  name: string;
  slug: string;
  description: string;
  visual_refs: string[];
  lora_id?: string;
  lora_training_status?: 'none' | 'pending' | 'training' | 'completed' | 'failed';
  voice_id?: string;
  metadata: Record<string, string>;
  
  // Advanced Context
  temporal_states?: TemporalState[];
  relationships?: TokenRelationship[];
  
  // Scenes this token appears in (optional for backwards compat)
  scene_appearances?: string[];
  created_at: string;
  updated_at: string;
}

export interface TokenRelationship {
  target_id: string;
  relationship_type: 'appears_with' | 'belongs_to' | 'contains' | 'related_to' | 'loves' | 'hates' | 'rivals' | 'family' | 'custom';
  custom_label?: string; // e.g. "Secretly Admires"
  strength?: number; // 0.0 to 1.0 intensity
  notes?: string;
}

export interface CharacterDetails {
  age?: string;
  gender?: string;
  appearance?: string;
  personality?: string;
  backstory?: string;
  relationships: string[];
}

export interface LocationDetails {
  setting?: string;
  time_of_day?: string;
  mood?: string;
  lighting?: string;
  props: string[];
}

export interface SetDetails {
  location?: string;
  setup?: string;
  equipment?: string[];
  lighting?: string;
  notes?: string;
}

export interface ExtractedEntity {
  name: string;
  description: string;
  mentions: number;
  first_appearance: string;
}

export interface ExtractedTokens {
  characters: ExtractedEntity[];
  locations: ExtractedEntity[];
  props: ExtractedEntity[];
}

export interface TokenContext {
  token_id: string;
  display_name: string;
  description: string;
  visual_prompt?: string;
  lora_trigger?: string;
}

// Helper functions
export function getTokenDisplayName(token: Token): string {
  return `${TOKEN_PREFIXES[token.token_type]}${token.name}`;
}

export function getTokenIcon(type: TokenType): string {
  switch (type) {
    case 'Character': return '👤';
    case 'Location': return '📍';
    case 'Prop': return '🎬';
    case 'Set': return '🎭';
  }
}

