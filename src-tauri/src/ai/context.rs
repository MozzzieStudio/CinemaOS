//! Agent Context - Rich context for agent interactions
//!
//! Allows agents to "see" the current state of the software.

use serde::{Deserialize, Serialize};
use specta::Type;

// ═══════════════════════════════════════════════════════════════════════════════
// SCRIPT CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/// Context from the Script Editor (Lexical)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ScriptContext {
    /// The full script content as plain text
    pub full_text: String,
    /// Currently selected text (if any)
    pub selection: Option<String>,
    /// Line number where cursor is
    pub cursor_line: Option<u32>,
    /// Current scene heading (if in a scene)
    pub current_scene: Option<String>,
    /// Characters mentioned in current scene
    pub scene_characters: Vec<String>,
    /// Current element type (action, dialogue, etc.)
    pub current_element: Option<String>,
}

impl ScriptContext {
    pub fn empty() -> Self {
        Self {
            full_text: String::new(),
            selection: None,
            cursor_line: None,
            current_scene: None,
            scene_characters: Vec::new(),
            current_element: None,
        }
    }

    /// Get the text to send to the agent (selection or full)
    pub fn get_relevant_text(&self) -> &str {
        self.selection.as_deref().unwrap_or(&self.full_text)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/// Context from the Canvas (PixiJS)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CanvasContext {
    /// Currently selected node IDs
    pub selected_nodes: Vec<String>,
    /// Selected node types (image, video, character, etc.)
    pub selected_types: Vec<String>,
    /// Description of selected content
    pub selection_description: Option<String>,
    /// Current zoom level
    pub zoom: f32,
    /// Viewport center position
    pub viewport_center: (f32, f32),
}

impl CanvasContext {
    pub fn empty() -> Self {
        Self {
            selected_nodes: Vec::new(),
            selected_types: Vec::new(),
            selection_description: None,
            zoom: 1.0,
            viewport_center: (0.0, 0.0),
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/// Context from the NLE Timeline
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TimelineContext {
    /// Current playhead position in seconds
    pub playhead: f64,
    /// Selected clip IDs
    pub selected_clips: Vec<String>,
    /// Current track being edited
    pub active_track: Option<String>,
    /// Total duration of project
    pub total_duration: f64,
}

impl TimelineContext {
    pub fn empty() -> Self {
        Self {
            playhead: 0.0,
            selected_clips: Vec::new(),
            active_track: None,
            total_duration: 0.0,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT CONTEXT (Tokens)
// ═══════════════════════════════════════════════════════════════════════════════

/// Context from the Vault (characters, locations, props)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VaultTokenContext {
    /// Character tokens with descriptions
    pub characters: Vec<TokenSummary>,
    /// Location tokens
    pub locations: Vec<TokenSummary>,
    /// Prop tokens
    pub props: Vec<TokenSummary>,
    /// Project style guidelines
    pub style_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TokenSummary {
    pub id: String,
    pub name: String,
    pub description: String,
    pub has_reference_images: bool,
    pub has_lora: bool,
}

impl VaultTokenContext {
    pub fn empty() -> Self {
        Self {
            characters: Vec::new(),
            locations: Vec::new(),
            props: Vec::new(),
            style_notes: None,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/// Complete context for an agent request
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentContext {
    /// Script editor context
    pub script: Option<ScriptContext>,
    /// Canvas context
    pub canvas: Option<CanvasContext>,
    /// Timeline context
    pub timeline: Option<TimelineContext>,
    /// Vault tokens
    pub vault: Option<VaultTokenContext>,
    /// Current mode (writer/studio)
    pub mode: String,
    /// Project name
    pub project_name: Option<String>,
    /// User preferences (moved from mod.rs)
    pub preferences: Option<UserPreferences>,
}

/// User preferences for AI execution
#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
pub struct UserPreferences {
    /// Prefer local processing (privacy)
    pub prefer_local: bool,
    /// Max credits per request
    pub max_credits_per_request: f32,
    /// Preferred models
    pub preferred_models: Vec<String>,
}

impl AgentContext {
    pub fn empty() -> Self {
        Self {
            script: None,
            canvas: None,
            timeline: None,
            vault: None,
            mode: "writer".into(),
            project_name: None,
            preferences: None,
        }
    }

    /// Build a context string for the LLM
    pub fn to_prompt_context(&self) -> String {
        let mut parts = Vec::new();

        if let Some(script) = &self.script {
            parts.push(format!("## Current Script\n{}", script.get_relevant_text()));
            if let Some(scene) = &script.current_scene {
                parts.push(format!("Current scene: {}", scene));
            }
            if !script.scene_characters.is_empty() {
                parts.push(format!(
                    "Characters in scene: {}",
                    script.scene_characters.join(", ")
                ));
            }
        }

        if let Some(vault) = &self.vault {
            if !vault.characters.is_empty() {
                let chars: Vec<_> = vault
                    .characters
                    .iter()
                    .map(|c| format!("- {}: {}", c.name, c.description))
                    .collect();
                parts.push(format!("## Characters\n{}", chars.join("\n")));
            }
            if !vault.locations.is_empty() {
                let locs: Vec<_> = vault
                    .locations
                    .iter()
                    .map(|l| format!("- {}: {}", l.name, l.description))
                    .collect();
                parts.push(format!("## Locations\n{}", locs.join("\n")));
            }
        }

        if let Some(canvas) = &self.canvas {
            if let Some(desc) = &canvas.selection_description {
                parts.push(format!("## Selected on Canvas\n{}", desc));
            }
        }

        parts.join("\n\n")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_script_context() {
        let ctx = ScriptContext {
            full_text: "INT. OFFICE - DAY\n\nJohn enters.".into(),
            selection: Some("John enters.".into()),
            cursor_line: Some(3),
            current_scene: Some("INT. OFFICE - DAY".into()),
            scene_characters: vec!["JOHN".into()],
            current_element: Some("action".into()),
        };

        assert_eq!(ctx.get_relevant_text(), "John enters.");
    }

    #[test]
    fn test_context_to_prompt() {
        let ctx = AgentContext {
            script: Some(ScriptContext {
                full_text: "Test script".into(),
                selection: None,
                cursor_line: None,
                current_scene: Some("INT. CAFE".into()),
                scene_characters: vec!["ALICE".into(), "BOB".into()],
                current_element: None,
            }),
            canvas: None,
            timeline: None,
            vault: None,
            mode: "writer".into(),
            project_name: Some("My Film".into()),
            preferences: None,
        };

        let prompt = ctx.to_prompt_context();
        assert!(prompt.contains("Test script"));
        assert!(prompt.contains("ALICE, BOB"));
    }
}
