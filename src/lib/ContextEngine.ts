
import { Token, TokenRelationship } from "../types/tokens";

/**
 * ContextEngine
 * 
 * Resolves the dynamic state of Tokens based on current narrative position (Scene/Act).
 * "The Vibe Graph" engine.
 */

export class ContextEngine {
  
  /**
   * Resolve a Token's properties for a specific Scene Number.
   * Merges base description with any active Temporal State overrides.
   */
  static resolveTokenState(token: Token, currentScene: number): { description: string, appearance: string, mood: string } {
    let description = token.description;
    let appearance = token.metadata.appearance || "";
    let mood = token.metadata.mood || "";

    if (!token.temporal_states || token.temporal_states.length === 0) {
      return { description, appearance, mood };
    }

    // Sort states by specificity (Scene > Act > Global) -> actually we just want to find matches
    // For now, let's assume strict Scene Ranges. 
    // TODO: Act logic requires understanding which Scenes are in which Act. 
    // We will stick to Scene-based ranges for MVP [start, end].
    
    const activeStates = token.temporal_states.filter(state => {
      if (state.scope_type !== 'scene') return false;
      const [start, end] = state.scope_range.map(Number);
      if (isNaN(start)) return false;
      const finalEnd = isNaN(end) ? start : end; // If only one number, it's a single scene
      return currentScene >= start && currentScene <= finalEnd;
    });

    // Apply changes (Last match wins if overlapping, ideally UI prevents overlap or we sort by start scene)
    activeStates.forEach(state => {
      if (state.changes.description) description = state.changes.description;
      if (state.changes.appearance) appearance = state.changes.appearance;
      if (state.changes.mood) mood = state.changes.mood;
    });

    return { description, appearance, mood };
  }

  /**
   * Get active relationships for a token, filtered by relevance/strength.
   */
  static getRelationships(token: Token, minStrength: number = 0): TokenRelationship[] {
    if (!token.relationships) return [];
    return token.relationships.filter(r => (r.strength || 0) >= minStrength);
  }

  /**
   * Generate a "System Prompt" context chunk for this token in this scene.
   * Used by the Director Agent.
   */
  static generateContextPrompt(token: Token, currentScene: number): string {
    const state = this.resolveTokenState(token, currentScene);
    
    let prompt = `CHARACTER: ${token.name}\n`;
    prompt += `CURRENT STATUS (Scene ${currentScene}):\n`;
    prompt += `- Appearance: ${state.appearance || "Standard"}\n`;
    prompt += `- Mood: ${state.mood || "Neutral"}\n`;
    
    if (state.description !== token.description) {
       prompt += `- Context: ${state.description}\n`;
    }

    return prompt;
  }
}
