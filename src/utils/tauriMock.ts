/**
 * Tauri Mock Utility
 * 
 * Provides mock implementations of Tauri commands when running in browser-only mode.
 * This allows testing the UI without the Tauri desktop wrapper.
 */

import type { Token, ExtractedTokens, ExtractedEntity } from '../types/tokens';

// Check if we're running in Tauri
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Mock token storage (in-memory for browser mode)
let mockTokens: Token[] = [];
let mockTokenId = 1;

// Mock implementations
const mockCommands: Record<string, (...args: any[]) => Promise<any>> = {
  get_tokens: async (_args: { projectId: string }) => {
    return mockTokens;
  },
  
  create_token: async (args: { projectId: string; tokenType: string; name: string; description: string }) => {
    const now = new Date().toISOString();
    const token: Token = {
      id: `token:mock_${mockTokenId++}`,
      project_id: args.projectId,
      token_type: args.tokenType as any,
      name: args.name,
      slug: `${args.tokenType.toLowerCase()}:${args.name.toLowerCase().replace(/\s+/g, '-')}`,
      description: args.description,
      visual_refs: [],
      metadata: {},
      relationships: [],
      scene_appearances: [],
      created_at: now,
      updated_at: now,
    };
    mockTokens.push(token);
    // Dispatch event for MentionsPlugin to refresh
    window.dispatchEvent(new CustomEvent('vault-tokens-updated'));
    return token;
  },
  
  update_token: async (args: { token: Token }) => {
    const idx = mockTokens.findIndex(t => t.id === args.token.id);
    if (idx >= 0) {
      mockTokens[idx] = { ...args.token, updated_at: new Date().toISOString() };
      return mockTokens[idx];
    }
    throw new Error('Token not found');
  },
  
  delete_token: async (args: { tokenId: string }) => {
    mockTokens = mockTokens.filter(t => t.id !== args.tokenId);
    return null;
  },
  
  add_token_visual: async (args: { tokenId: string; visualUrl: string }) => {
    const token = mockTokens.find(t => t.id === args.tokenId);
    if (token) {
      token.visual_refs = [args.visualUrl, ...token.visual_refs];
      token.updated_at = new Date().toISOString();
      return token;
    }
    throw new Error('Token not found');
  },
  
  load_script: async (args: { projectId: string }) => {
    // Try to load real script from localStorage (what the editor saves)
    const storageKey = `cinema-os-script-${args.projectId}`;
    const savedScript = localStorage.getItem(storageKey);
    
    if (savedScript) {
      return { content: savedScript };
    }
    
    // Also try default storage key
    const defaultScript = localStorage.getItem('cinema-os-script');
    if (defaultScript) {
      return { content: defaultScript };
    }
    
    // Return null if no script exists - the UI should warn the user
    return null;
  },
  
  extract_tokens_from_script: async (args: { projectId: string; scriptContent: string }): Promise<ExtractedTokens> => {
    // Actually extract from the provided script content - no fake data!
    const { scriptContent } = args;
    
    if (!scriptContent || scriptContent.trim().length === 0) {
      return { characters: [], locations: [], props: [] };
    }
    
    const characters: ExtractedEntity[] = [];
    const locations: ExtractedEntity[] = [];
    
    // Split into lines and analyze
    const lines = scriptContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Character detection: ALL CAPS, 2-25 chars, not a location
      if (
        trimmed.length > 2 &&
        trimmed.length < 25 &&
        trimmed === trimmed.toUpperCase() &&
        /^[A-Z\s]+$/.test(trimmed) &&
        !trimmed.startsWith('INT') &&
        !trimmed.startsWith('EXT') &&
        !trimmed.startsWith('CUT') &&
        !trimmed.startsWith('FADE')
      ) {
        if (!characters.some(c => c.name === trimmed)) {
          characters.push({
            name: trimmed,
            description: `Character: ${trimmed}`,
            mentions: 1,
            first_appearance: 'Script',
          });
        }
      }
      
      // Location detection: INT./EXT. patterns
      if (trimmed.startsWith('INT.') || trimmed.startsWith('EXT.')) {
        const locationMatch = trimmed
          .replace(/^(INT\.|EXT\.)\s*/, '')
          .split(/\s*-\s*/)[0]
          .trim();
        
        if (locationMatch && !locations.some(l => l.name === locationMatch)) {
          locations.push({
            name: locationMatch,
            description: `Location: ${locationMatch}`,
            mentions: 1,
            first_appearance: trimmed,
          });
        }
      }
    }
    
    return { characters, locations, props: [] };
  },
  
  save_extracted_tokens: async (args: { projectId: string; extracted: ExtractedTokens }) => {
    const saved: Token[] = [];
    const now = new Date().toISOString();
    
    // Save characters
    for (const entity of args.extracted.characters) {
      const exists = mockTokens.some(t => t.name === entity.name && t.token_type === 'Character');
      if (!exists) {
        const token: Token = {
          id: `token:mock_${mockTokenId++}`,
          project_id: args.projectId,
          token_type: 'Character',
          name: entity.name,
          slug: `character:${entity.name.toLowerCase()}`,
          description: entity.description,
          visual_refs: [],
          metadata: {},
          relationships: [],
          scene_appearances: [],
          created_at: now,
          updated_at: now,
        };
        mockTokens.push(token);
        saved.push(token);
      }
    }
    
    // Save locations
    for (const entity of args.extracted.locations) {
      const exists = mockTokens.some(t => t.name === entity.name && t.token_type === 'Location');
      if (!exists) {
        const token: Token = {
          id: `token:mock_${mockTokenId++}`,
          project_id: args.projectId,
          token_type: 'Location',
          name: entity.name,
          slug: `location:${entity.name.toLowerCase()}`,
          description: entity.description,
          visual_refs: [],
          metadata: {},
          relationships: [],
          scene_appearances: [],
          created_at: now,
          updated_at: now,
        };
        mockTokens.push(token);
        saved.push(token);
      }
    }
    
    return saved;
  },
};

/**
 * Safe invoke that falls back to mocks when not in Tauri
 */
export async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    // Use real Tauri invoke
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(command, args);
  } else {
    // Use mock
    const mockFn = mockCommands[command];
    if (mockFn) {
      console.log(`[Mock] ${command}`, args);
      return mockFn(args) as Promise<T>;
    }
    console.warn(`[Mock] No mock for command: ${command}`);
    throw new Error(`Mock not implemented: ${command}`);
  }
}

/**
 * Check if running in Tauri environment
 */
export { isTauri };
