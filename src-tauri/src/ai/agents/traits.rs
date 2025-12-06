//! Agent Traits and Core Types
//!
//! Defines the core Agent trait that all Virtual Crew members implement.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

/// The 11 agent roles in the Virtual Crew
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
pub enum AgentRole {
    /// Guardian of the Vault. Ensures consistency & tone across the project.
    Showrunner,
    /// Screenplay, dialogue, plot development.
    Scriptwriter,
    /// Lenses, lighting, camera angles, shot composition.
    Cinematographer,
    /// Character consistency, FaceID, casting decisions.
    CastingDirector,
    /// Locations, set design, props, world-building.
    ArtDirector,
    /// TTS, dialogue performance, voice acting.
    VoiceActors,
    /// Score, foley, sound design, ambient audio.
    MusicSfxDirector,
    /// Image generation (concept art, stills, keyframes).
    PhotographyDirector,
    /// Video generation (shots, sequences).
    CameraDirector,
    /// Montage, pacing, assembly, timeline editing.
    Editor,
    /// Color grading, LUTs, visual style.
    Colorist,
}

impl AgentRole {
    /// Human-readable name for the agent
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::Showrunner => "The Showrunner",
            Self::Scriptwriter => "Scriptwriter",
            Self::Cinematographer => "Cinematographer",
            Self::CastingDirector => "Casting Director",
            Self::ArtDirector => "Art Director",
            Self::VoiceActors => "Voice Actors",
            Self::MusicSfxDirector => "Music & SFX Director",
            Self::PhotographyDirector => "Photography Director",
            Self::CameraDirector => "Camera Director",
            Self::Editor => "Editor",
            Self::Colorist => "Colorist",
        }
    }

    /// Get all agent roles
    pub fn all() -> &'static [AgentRole] {
        &[
            Self::Showrunner,
            Self::Scriptwriter,
            Self::Cinematographer,
            Self::CastingDirector,
            Self::ArtDirector,
            Self::VoiceActors,
            Self::MusicSfxDirector,
            Self::PhotographyDirector,
            Self::CameraDirector,
            Self::Editor,
            Self::Colorist,
        ]
    }
}

/// Input to an agent
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentInput {
    /// The user's request or command
    pub message: String,
    /// Optional context from the Vault (tokens, references)
    pub vault_context: Option<VaultContext>,
    /// Conversation history for continuity
    pub history: Vec<ConversationTurn>,
    /// Additional parameters (model preferences, etc.)
    pub params: HashMap<String, String>,
}

/// Context pulled from the Vault
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VaultContext {
    /// Character tokens with their descriptions and references
    pub characters: Vec<TokenReference>,
    /// Location tokens
    pub locations: Vec<TokenReference>,
    /// Props and objects
    pub props: Vec<TokenReference>,
    /// Style/mood references
    pub style: Option<String>,
    /// Current scene context
    pub scene: Option<String>,
}

/// A reference to a token in the Vault
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TokenReference {
    pub id: String,
    pub name: String,
    pub description: String,
    /// URLs or paths to reference images
    pub reference_images: Vec<String>,
    /// Associated LoRA model ID if any
    pub lora_id: Option<String>,
}

/// A single turn in the conversation
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ConversationTurn {
    pub role: String, // "user" | "assistant"
    pub content: String,
}

/// Output from an agent
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentOutput {
    /// The agent's response text
    pub message: String,
    /// Actions to execute (generation requests, vault updates, etc.)
    pub actions: Vec<AgentAction>,
    /// Suggested follow-up prompts
    pub suggestions: Vec<String>,
    /// Cost estimate in credits (if any)
    pub estimated_cost: Option<f64>,
}

/// Actions an agent can request
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum AgentAction {
    /// Generate an image
    GenerateImage {
        prompt: String,
        model_id: String,
        params: HashMap<String, String>,
    },
    /// Generate a video
    GenerateVideo {
        prompt: String,
        model_id: String,
        params: HashMap<String, String>,
        /// Optional keyframe/reference image
        reference_image: Option<String>,
    },
    /// Generate audio (voice, music, sfx)
    GenerateAudio {
        prompt: String,
        model_id: String,
        audio_type: AudioType,
        params: HashMap<String, String>,
    },
    /// Save result to the Vault
    SaveToVault {
        asset_type: String,
        name: String,
        data: String,
    },
    /// Request another agent to help
    DelegateToAgent {
        target_role: AgentRole,
        message: String,
    },
    /// Run a ComfyUI workflow
    RunWorkflow {
        workflow_id: String,
        inputs: HashMap<String, String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum AudioType {
    Voice,
    Music,
    SoundEffect,
    Ambient,
}

/// The core Agent trait - all Virtual Crew members implement this
pub trait Agent: Send + Sync {
    /// Get the agent's role
    fn role(&self) -> AgentRole;

    /// Get the system prompt for this agent
    fn system_prompt(&self) -> &str;

    /// Get the default model for this agent
    fn default_model(&self) -> &str;

    /// Process an input and return a response
    /// This is async because it may call LLMs
    fn process(&self, input: AgentInput) -> impl std::future::Future<Output = AgentOutput> + Send;

    /// Get suggested models for this agent's tasks
    fn recommended_models(&self) -> Vec<&str> {
        vec![self.default_model()]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_roles() {
        assert_eq!(AgentRole::all().len(), 11);
        assert_eq!(AgentRole::Showrunner.display_name(), "The Showrunner");
    }
}
