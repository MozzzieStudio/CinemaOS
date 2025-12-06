/**
 * Agent Types - TypeScript types for agent integration
 * Matches Rust backend types via Tauri invoke
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT TYPES (what agents can "see")
// ═══════════════════════════════════════════════════════════════════════════════

/** Context from the Script Editor */
export interface ScriptContext {
  /** Full script content as plain text */
  full_text: string;
  /** Currently selected text */
  selection?: string;
  /** Cursor line number (1-indexed) */
  cursor_line?: number;
  /** Current scene heading */
  current_scene?: string;
  /** Characters in current scene */
  scene_characters: string[];
  /** Current element type (action, dialogue, etc.) */
  current_element?: string;
}

/** Context from the Canvas */
export interface CanvasContext {
  /** Selected node IDs */
  selected_nodes: string[];
  /** Selected node types */
  selected_types: string[];
  /** Description of selection */
  selection_description?: string;
  /** Current zoom level */
  zoom: number;
  /** Viewport center */
  viewport_center: [number, number];
}

/** Context from the Timeline */
export interface TimelineContext {
  /** Playhead position in seconds */
  playhead: number;
  /** Selected clip IDs */
  selected_clips: string[];
  /** Active track */
  active_track?: string;
  /** Total duration */
  total_duration: number;
}

/** Token summary from vault */
export interface TokenSummary {
  id: string;
  name: string;
  description: string;
  has_reference_images: boolean;
  has_lora: boolean;
}

/** Vault context (tokens) */
export interface VaultTokenContext {
  characters: TokenSummary[];
  locations: TokenSummary[];
  props: TokenSummary[];
  style_notes?: string;
}

/** Complete context for agent request */
export interface AgentContext {
  script?: ScriptContext;
  canvas?: CanvasContext;
  timeline?: TimelineContext;
  vault?: VaultTokenContext;
  mode: 'writer' | 'studio';
  project_name?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION TYPES (what agents can "do")
// ═══════════════════════════════════════════════════════════════════════════════

export type AudioActionType = 'Voice' | 'Music' | 'SoundEffect' | 'Ambient';
export type ScriptUpdateMode = 'Replace' | 'Insert' | 'ReplaceSelection' | 'Patch';
export type CanvasNodeType = 'Image' | 'Video' | 'Character' | 'Location' | 'Prop' | 'Note' | 'Reference';

export type AgentAction =
  | { type: 'GenerateImage'; prompt: string; model: string; width: number; height: number; token_ids: string[] }
  | { type: 'GenerateVideo'; prompt: string; model: string; duration_seconds: number; reference_image?: string; token_ids: string[] }
  | { type: 'GenerateAudio'; prompt: string; audio_type: AudioActionType; model: string; duration_seconds?: number }
  | { type: 'UpdateScript'; mode: ScriptUpdateMode; content: string; line_start?: number; line_end?: number }
  | { type: 'AddToCanvas'; node_type: CanvasNodeType; content: string; position?: [number, number]; token_id?: string }
  | { type: 'UpdateVault'; token_type: string; token_name: string; description: string; reference_image?: string }
  | { type: 'Delegate'; target_agent: string; message: string }
  | { type: 'ShowMessage'; title: string; content: string; suggestions: string[] }
  | { type: 'ExecuteWorkflow'; workflow_json: string };

// ═══════════════════════════════════════════════════════════════════════════════
// API TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FullAgentRequest {
  agent_role: AgentRole;
  message: string;
  context?: AgentContext;
  history: ChatMessage[];
  provider?: string;
  model?: string;
  auto_execute: boolean;
}

export interface ActionResult {
  success: boolean;
  action_type: string;
  execution_id?: string;
  data?: string; // JSON string, parse as needed
  error?: string;
  credits_used?: number;
}

export interface FullAgentResponse {
  message: string;
  agent_role: string;
  model_used: string;
  actions: AgentAction[];
  action_results: ActionResult[];
  tokens_used?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT ROLES
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentRole =
  | 'showrunner'
  | 'scriptwriter'
  | 'cinematographer'
  | 'casting_director'
  | 'art_director'
  | 'voice_actors'
  | 'music_sfx_director'
  | 'photography_director'
  | 'camera_director'
  | 'editor'
  | 'colorist';

export const AGENT_ROLES: Record<AgentRole, { name: string; description: string; icon: string }> = {
  showrunner: {
    name: 'The Showrunner',
    description: 'Guardian of consistency and creative vision',
    icon: '🎬',
  },
  scriptwriter: {
    name: 'Scriptwriter',
    description: 'Screenplay, dialogue, and plot',
    icon: '✍️',
  },
  cinematographer: {
    name: 'Cinematographer',
    description: 'Lenses, lighting, camera angles',
    icon: '🎥',
  },
  casting_director: {
    name: 'Casting Director',
    description: 'Character consistency and FaceID',
    icon: '👤',
  },
  art_director: {
    name: 'Art Director',
    description: 'Locations, sets, props',
    icon: '🎨',
  },
  voice_actors: {
    name: 'Voice Actors',
    description: 'TTS and dialogue performance',
    icon: '🎙️',
  },
  music_sfx_director: {
    name: 'Music & SFX',
    description: 'Score, foley, sound design',
    icon: '🎵',
  },
  photography_director: {
    name: 'Photography Director',
    description: 'Image generation',
    icon: '📷',
  },
  camera_director: {
    name: 'Camera Director',
    description: 'Video generation',
    icon: '🎞️',
  },
  editor: {
    name: 'Editor',
    description: 'Montage, pacing, assembly',
    icon: '✂️',
  },
  colorist: {
    name: 'Colorist',
    description: 'Color grading and LUTs',
    icon: '🌈',
  },
};
