//! AI Crew Module
//!
//! The Virtual Crew of 11 specialized AI agents + Main Agent orchestrator.
//!
//! ## Architecture
//! - `crew/`: Individual agent implementations (NEW)
//! - `mcp/`: Model Context Protocol integration (NEW)
//! - `router.rs`: Smart routing (local vs cloud)
//! - `templates.rs`: Shared prompt templates (NEW)
//! - `cost.rs`: Credit cost calculation (NEW)
//! - `model_selection.rs`: Model selection logic (NEW)
//! - Legacy modules preserved for backward compatibility

// NEW: AI Crew framework
pub mod assets;
pub mod cost;
pub mod crew;
pub mod mcp;
pub mod model_selection;
pub mod templates;

// LEGACY: Existing AI modules (preserved)
pub mod actions;
pub mod agent_executor;
pub mod agents;
pub mod comfyui_client;
pub mod context;
pub mod elevenlabs_client;
pub mod fal_client;
pub mod keygen_client;
pub mod llm_client;
pub mod local;
pub mod models;
pub mod providers;
pub mod router;
pub mod uv_manager;
pub mod workflow;
pub mod workflow_generator;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// Agent capability enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum AgentCapability {
    /// Script writing & dialogue
    Scriptwriting,
    /// Visual composition & camera work
    Cinematography,
    /// Character design & consistency
    Casting,
    /// Set design & props
    ArtDirection,
    /// Voice generation & TTS
    VoiceActing,
    /// Music & sound effects
    AudioProduction,
    /// Music & SFX (alias)
    MusicSFX,
    /// Image generation
    Photography,
    /// Video generation
    Videography,
    /// Video direction (alias)
    VideoDirection,
    /// Editing & montage
    Editing,
    /// Color grading
    ColorGrading,
    /// Project oversight & consistency
    Showrunning,
}

/// Agent response
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AgentResponse {
    /// Agent that generated the response
    pub agent: String,
    /// Response content (text, JSON, etc.)
    pub content: String,
    /// Suggested actions (optional)
    pub actions: Vec<AgentAction>,
    /// Cost in credits (if cloud)
    pub cost: Option<f32>,
    /// Metadata (model used, tokens, etc.)
    pub metadata: AgentMetadata,
}

/// Agent action (executable operation)
pub use actions::AgentAction;

/// Agent metadata
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AgentMetadata {
    /// Model used (e.g., "gemini-3-pro", "llama-4")
    pub model: String,
    /// Processing time in ms
    pub processing_time_ms: u64,
    /// Tokens used (if applicable)
    pub tokens: Option<TokenUsage>,
    /// Whether local or cloud
    pub location: ProcessingLocation,
}

/// Token usage stats
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsage {
    pub prompt: u32,
    pub completion: u32,
    pub total: u32,
}

/// Processing location
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum ProcessingLocation {
    Local,
    Cloud,
}

/// Agent trait - common interface for all agents
#[async_trait]
pub trait Agent: Send + Sync {
    /// Agent name (e.g., "The Showrunner")
    fn name(&self) -> &str;

    /// Agent capability
    fn capability(&self) -> AgentCapability;

    /// Agent description
    fn description(&self) -> &str;

    /// Process a user message
    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError>;

    /// Estimate cost (in credits) before execution
    async fn estimate_cost(&self, message: &str) -> f32 {
        // Default: free (local processing)
        0.0
    }

    /// Check if agent can handle this request
    fn can_handle(&self, message: &str) -> bool {
        // Default: simple keyword matching
        // Override for more sophisticated logic
        true
    }
}

// Re-export context types
pub use context::{AgentContext, UserPreferences};

/// Agent error
#[derive(Debug, thiserror::Error)]
pub enum AgentError {
    #[error("Agent failed to process: {0}")]
    ProcessingFailed(String),

    #[error("Model unavailable: {0}")]
    ModelUnavailable(String),

    #[error("Insufficient credits: need {needed}, have {available}")]
    InsufficientCredits { needed: f32, available: f32 },

    #[error("Context missing: {0}")]
    ContextMissing(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),
}

impl From<AgentError> for String {
    fn from(err: AgentError) -> String {
        err.to_string()
    }
}

// Re-export workflow types for backward compatibility
pub use workflow::{
    generate_workflow, parse_agent_request, GeneratedWorkflow, WorkflowRequest, WorkflowType,
};
