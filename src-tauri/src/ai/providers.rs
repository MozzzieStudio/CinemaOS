//! Cloud Provider Routing
//!
//! Routes model requests to the appropriate cloud provider:
//! - Vertex AI (Google models: Gemini, Veo, Imagen, Lyria)
//! - Fal.ai (Flux, Mystic, and many third-party models)
//! - OpenAI (GPT-5.x, Sora, Whisper)
//! - Anthropic (Claude 4.5)
//! - ElevenLabs (TTS)
//! - xAI (Grok)
//! - Runway (Gen-4.5)
//! - Kling (Video)
//! - ByteDance (Seed models)
//! - Meshy (3D)
//! - Suno (Music)

use serde::{Deserialize, Serialize};
use specta::Type;

/// Cloud provider enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum CloudProvider {
    VertexAI,
    FalAI,
    OpenAI,
    Anthropic,
    ElevenLabs,
    XAI,
    Runway,
    Kling,
    ByteDance,
    Meshy,
    Suno,
    Lightricks,
}

impl CloudProvider {
    /// Get the base URL for this provider
    pub fn base_url(&self) -> &'static str {
        match self {
            CloudProvider::VertexAI => "https://us-central1-aiplatform.googleapis.com",
            CloudProvider::FalAI => "https://fal.run",
            CloudProvider::OpenAI => "https://api.openai.com",
            CloudProvider::Anthropic => "https://api.anthropic.com",
            CloudProvider::ElevenLabs => "https://api.elevenlabs.io",
            CloudProvider::XAI => "https://api.x.ai",
            CloudProvider::Runway => "https://api.runwayml.com",
            CloudProvider::Kling => "https://api.klingai.com",
            CloudProvider::ByteDance => "https://api.seed.bytedance.com",
            CloudProvider::Meshy => "https://api.meshy.ai",
            CloudProvider::Suno => "https://api.suno.ai",
            CloudProvider::Lightricks => "https://api.ltx.studio",
        }
    }

    /// Get the secret key name for this provider
    pub fn secret_key_name(&self) -> &'static str {
        match self {
            CloudProvider::VertexAI => "GOOGLE_CLOUD_API_KEY",
            CloudProvider::FalAI => "FAL_API_KEY",
            CloudProvider::OpenAI => "OPENAI_API_KEY",
            CloudProvider::Anthropic => "ANTHROPIC_API_KEY",
            CloudProvider::ElevenLabs => "ELEVENLABS_API_KEY",
            CloudProvider::XAI => "XAI_API_KEY",
            CloudProvider::Runway => "RUNWAY_API_KEY",
            CloudProvider::Kling => "KLING_API_KEY",
            CloudProvider::ByteDance => "BYTEDANCE_API_KEY",
            CloudProvider::Meshy => "MESHY_API_KEY",
            CloudProvider::Suno => "SUNO_API_KEY",
            CloudProvider::Lightricks => "LIGHTRICKS_API_KEY",
        }
    }
}

/// Determine which cloud provider to use for a given model
pub fn get_provider_for_model(model_id: &str) -> CloudProvider {
    match model_id {
        // ── Vertex AI (Google models) ──
        id if id.starts_with("gemini") => CloudProvider::VertexAI,
        id if id.starts_with("gemma") => CloudProvider::VertexAI,
        id if id.starts_with("veo") => CloudProvider::VertexAI,
        id if id.starts_with("imagen") => CloudProvider::VertexAI,
        id if id.starts_with("lyria") => CloudProvider::VertexAI,

        // ── OpenAI Direct ──
        id if id.starts_with("gpt") => CloudProvider::OpenAI,
        id if id.starts_with("sora") => CloudProvider::OpenAI,
        id if id.starts_with("whisper") => CloudProvider::OpenAI,

        // ── Anthropic Direct ──
        id if id.starts_with("claude") => CloudProvider::Anthropic,

        // ── xAI Direct ──
        id if id.starts_with("grok") => CloudProvider::XAI,

        // ── ElevenLabs Direct ──
        id if id.starts_with("elevenlabs") => CloudProvider::ElevenLabs,

        // ── Runway Direct ──
        id if id.starts_with("gen-") => CloudProvider::Runway,

        // ── Kling Direct ──
        id if id.starts_with("kling") => CloudProvider::Kling,

        // ── ByteDance Direct ──
        id if id.starts_with("seed") => CloudProvider::ByteDance,

        // ── Meshy Direct ──
        id if id.starts_with("meshy") => CloudProvider::Meshy,

        // ── Suno Direct ──
        id if id.starts_with("suno") => CloudProvider::Suno,

        // ── Lightricks Direct ──
        id if id.starts_with("ltx") => CloudProvider::Lightricks,

        // ── Everything else → Fal.ai (Flux, Kling via Fal, Mystic, etc.) ──
        _ => CloudProvider::FalAI,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_routing() {
        // Google → Vertex AI
        assert_eq!(
            get_provider_for_model("gemini-2.5-pro"),
            CloudProvider::VertexAI
        );
        assert_eq!(get_provider_for_model("veo-3"), CloudProvider::VertexAI);
        assert_eq!(get_provider_for_model("imagen-4"), CloudProvider::VertexAI);

        // OpenAI
        assert_eq!(get_provider_for_model("gpt-5.1"), CloudProvider::OpenAI);
        assert_eq!(get_provider_for_model("sora-2-pro"), CloudProvider::OpenAI);

        // Anthropic
        assert_eq!(
            get_provider_for_model("claude-opus-4.5"),
            CloudProvider::Anthropic
        );

        // xAI
        assert_eq!(get_provider_for_model("grok-3"), CloudProvider::XAI);

        // Runway
        assert_eq!(get_provider_for_model("gen-4.5"), CloudProvider::Runway);

        // ByteDance
        assert_eq!(
            get_provider_for_model("seedream-4.5"),
            CloudProvider::ByteDance
        );
        assert_eq!(
            get_provider_for_model("seedance-1.0"),
            CloudProvider::ByteDance
        );

        // Fal.ai fallback
        assert_eq!(get_provider_for_model("flux-2-pro"), CloudProvider::FalAI);
        assert_eq!(get_provider_for_model("wan-2.5"), CloudProvider::FalAI);
    }
}
