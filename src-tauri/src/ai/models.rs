//! Model Definitions for the Model Matrix
//!
//! Defines all available AI models, their capabilities, and pricing.
//! Updated: December 2025 - FULLY VERIFIED from official documentation

use serde::{Deserialize, Serialize};
use specta::Type;

/// Where the model runs
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum ModelLocation {
    Local, // Free, on-device
    Cloud, // CinemaOS Credits
}

/// Model capability categories
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum ModelCapability {
    TextGeneration,
    TextToImage,
    ImageToImage,
    TextToVideo,
    ImageToVideo,
    TextToSpeech,
    SpeechToText,
    AudioGeneration,
    MusicGeneration,
    Vision,
    Segmentation,
    ColorGrading,
    ThreeDGeneration,
}

/// Speed/quality tier
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum SpeedTier {
    Fast,
    Standard,
    Quality,
}

/// A model definition
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelDefinition {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub capabilities: Vec<ModelCapability>,
    pub location: ModelLocation,
    pub cost_per_unit: Option<f64>, // None = free/local
    pub unit_type: String,          // "token", "image", "second"
    pub description: String,
    pub is_new: bool,
    pub speed_tier: SpeedTier,
    pub local_download_id: Option<String>, // Links to downloader::ModelSource
}

/// User's model preferences per agent/task
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelMatrixConfig {
    pub agent_id: String,
    pub task_type: String,
    pub preferred_model: String,
    pub fallback_model: Option<String>,
    pub prefer_local: bool,
}

/// Get all available models - December 2025 FULLY VERIFIED
pub fn get_all_models() -> Vec<ModelDefinition> {
    use ModelCapability::*;
    use ModelLocation::*;
    use SpeedTier::*;

    vec![
        // ═══════════════════════════════════════════════════════════════════
        // GOOGLE - deepmind.google/models/gemini
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "gemini-3-pro".into(),
            name: "Gemini 3 Pro".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.00125),
            unit_type: "1K tokens".into(),
            description: "Best for complex tasks".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gemini-3-deep-think".into(),
            name: "Gemini 3 Deep Think".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.005),
            unit_type: "1K tokens".into(),
            description: "Extended reasoning".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gemini-2.5-flash".into(),
            name: "Gemini 2.5 Flash".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.000075),
            unit_type: "1K tokens".into(),
            description: "Fast everyday tasks".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gemini-2.5-flash-lite".into(),
            name: "Gemini 2.5 Flash-Lite".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.00003),
            unit_type: "1K tokens".into(),
            description: "High volume, cost efficient".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        // --- Google Local (deepmind.google/models/gemma) ---
        ModelDefinition {
            id: "gemma-3".into(),
            name: "Gemma 3".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Open-weight local model".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gemma-3n".into(),
            name: "Gemma 3n".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Compact variant".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gemini-nano".into(),
            name: "Gemini Nano".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "On-device via AI Edge".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        ModelDefinition {
            id: "paligemma-2".into(),
            name: "PaliGemma 2".into(),
            provider: "google".into(),
            capabilities: vec![Vision, Segmentation],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Vision-language model".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // OPENAI - platform.openai.com/docs/models
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "gpt-5.1".into(),
            name: "GPT-5.1".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.01),
            unit_type: "1K tokens".into(),
            description: "OpenAI flagship".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gpt-5".into(),
            name: "GPT-5".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.008),
            unit_type: "1K tokens".into(),
            description: "Previous flagship".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gpt-5-mini".into(),
            name: "GPT-5 Mini".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.0015),
            unit_type: "1K tokens".into(),
            description: "Fast and affordable".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        ModelDefinition {
            id: "llama-4-70b".into(),
            name: "Llama 4 70B".into(),
            provider: "meta".into(),
            capabilities: vec![TextGeneration],
            location: Cloud,
            cost_per_unit: Some(0.0007),
            unit_type: "1K tokens".into(),
            description: "Open source frontier model".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: Some("llama-4-70b-quant".into()),
        },
        ModelDefinition {
            id: "gpt-5-pro".into(),
            name: "GPT-5 Pro".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.03),
            unit_type: "1K tokens".into(),
            description: "Extended thinking".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gpt-4.1".into(),
            name: "GPT-4.1".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.002),
            unit_type: "1K tokens".into(),
            description: "Reliable workhorse".into(),
            is_new: false,
            speed_tier: Standard,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gpt-oss-120b".into(),
            name: "GPT-OSS 120B".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Open source 120B".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "gpt-oss-20b".into(),
            name: "GPT-OSS 20B".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Open source 20B".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // ANTHROPIC - platform.claude.com/docs
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "claude-opus-4.5".into(),
            name: "Claude Opus 4.5".into(),
            provider: "anthropic".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.015),
            unit_type: "1K tokens".into(),
            description: "Maximum intelligence".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "claude-sonnet-4.5".into(),
            name: "Claude Sonnet 4.5".into(),
            provider: "anthropic".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.003),
            unit_type: "1K tokens".into(),
            description: "Coding excellence".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        ModelDefinition {
            id: "claude-haiku-4.5".into(),
            name: "Claude Haiku 4.5".into(),
            provider: "anthropic".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.0008),
            unit_type: "1K tokens".into(),
            description: "Blazing fast".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // xAI - x.ai/api
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "grok-3".into(),
            name: "Grok 3".into(),
            provider: "xai".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.003),
            unit_type: "1K tokens".into(),
            description: "xAI flagship".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // META - llama.com/models/llama-4/
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "llama-4".into(),
            name: "Llama 4".into(),
            provider: "meta".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Meta open model".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // ALIBABA - modelstudio.console.alibabacloud.com
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "qwen3-max".into(),
            name: "Qwen3-Max".into(),
            provider: "alibaba".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.001),
            unit_type: "1K tokens".into(),
            description: "Alibaba flagship".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "qwen3-vl".into(),
            name: "Qwen3-VL".into(),
            provider: "alibaba".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.001),
            unit_type: "1K tokens".into(),
            description: "Vision-language 235B".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // BYTEDANCE - seed.bytedance.com
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "seed-1.6".into(),
            name: "Seed 1.6".into(),
            provider: "bytedance".into(),
            capabilities: vec![TextGeneration],
            location: Cloud,
            cost_per_unit: Some(0.0008),
            unit_type: "1K tokens".into(),
            description: "ByteDance LLM".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        ModelDefinition {
            id: "seed-1.5-vl".into(),
            name: "Seed 1.5-VL".into(),
            provider: "bytedance".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            cost_per_unit: Some(0.001),
            unit_type: "1K tokens".into(),
            description: "Vision-language".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // IMAGE GENERATION
        // ═══════════════════════════════════════════════════════════════════

        // --- Black Forest Labs (bfl.ai/models) ---
        ModelDefinition {
            id: "flux.2".into(),
            name: "FLUX.2".into(),
            provider: "bfl".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.05),
            unit_type: "image".into(),
            description: "State-of-the-art".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: Some("flux-2-schnell".into()),
        },
        ModelDefinition {
            id: "flux-2-pro-ultra".into(),
            name: "FLUX.2 Pro Ultra".into(),
            provider: "bfl".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            cost_per_unit: Some(0.06),
            unit_type: "image".into(),
            description: "4MP ultra high-res".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "flux-1.1-pro".into(),
            name: "FLUX 1.1 Pro".into(),
            provider: "bfl".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            cost_per_unit: Some(0.04),
            unit_type: "image".into(),
            description: "Fast high-quality".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: Some("flux-schnell".into()),
        },
        ModelDefinition {
            id: "flux-1-kontext".into(),
            name: "FLUX.1 Kontext".into(),
            provider: "bfl".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.04),
            unit_type: "image".into(),
            description: "In-context editing".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        // Z-Image Turbo
        ModelDefinition {
            id: "z-image-turbo".into(),
            name: "Z-Image Turbo".into(),
            provider: "Alibaba".into(),
            capabilities: vec![TextToImage],
            location: Local,
            cost_per_unit: None,
            unit_type: "image".into(),
            description:
                "6B parameter model specialized for hyper-realistic portraits. Real-time speed."
                    .into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: Some("z-image-turbo".into()),
        },
        // ═══════════════════════════════════════════════════════════════════
        // VIDEO GENERATION (Updated Dec 2025 from research)
        // ═══════════════════════════════════════════════════════════════════

        // --- Kling AI (klingai.com/global/dev) ---
        ModelDefinition {
            id: "kling-o1".into(),
            name: "Kling O1 (Omni One)".into(),
            provider: "kling".into(),
            capabilities: vec![TextToVideo, ImageToVideo, Vision],
            location: Cloud,
            cost_per_unit: Some(0.112),
            unit_type: "second".into(),
            description: "First unified multimodal. Native audio, 2min 1080p".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "kling-video-2.6".into(),
            name: "Kling Video 2.6".into(),
            provider: "kling".into(),
            capabilities: vec![TextToVideo, ImageToVideo, AudioGeneration],
            location: Cloud,
            cost_per_unit: Some(0.08),
            unit_type: "second".into(),
            description: "Video + audio in one pass. Dialogue, SFX, ambient".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        ModelDefinition {
            id: "kling-image-o1".into(),
            name: "Kling Image O1".into(),
            provider: "kling".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.028),
            unit_type: "image".into(),
            description: "Kolors 2.1 architecture, 4K output, 10 refs".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        // --- Google DeepMind (deepmind.google/models/veo) ---
        ModelDefinition {
            id: "veo-3.1".into(),
            name: "Veo 3.1".into(),
            provider: "google".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.15),
            unit_type: "second".into(),
            description: "Google's flagship video model".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "imagen-4".into(),
            name: "Imagen 4".into(),
            provider: "google".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.04),
            unit_type: "image".into(),
            description: "Photorealistic image synthesis".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        // --- OpenAI (Sora) ---
        ModelDefinition {
            id: "sora-2-pro".into(),
            name: "Sora 2 Pro".into(),
            provider: "openai".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.20),
            unit_type: "second".into(),
            description: "OpenAI flagship video, extended duration".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        // --- Alibaba (Wan) ---
        ModelDefinition {
            id: "wan-2.5-i2v".into(),
            name: "Wan 2.5 I2V".into(),
            provider: "alibaba".into(),
            capabilities: vec![ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.06),
            unit_type: "second".into(),
            description: "Image-to-video preview model".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // AUDIO GENERATION (ElevenLabs, Suno, Lyria)
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "elevenlabs-v3".into(),
            name: "ElevenLabs v3".into(),
            provider: "elevenlabs".into(),
            capabilities: vec![TextToSpeech],
            location: Cloud,
            cost_per_unit: Some(0.30),
            unit_type: "1K chars".into(),
            description: "Ultra-realistic TTS".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        ModelDefinition {
            id: "suno-v4".into(),
            name: "Suno v4".into(),
            provider: "suno".into(),
            capabilities: vec![MusicGeneration, AudioGeneration],
            location: Cloud,
            cost_per_unit: Some(0.05),
            unit_type: "second".into(),
            description: "Full song generation".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        ModelDefinition {
            id: "lyria-2".into(),
            name: "Lyria 2".into(),
            provider: "google".into(),
            capabilities: vec![MusicGeneration],
            location: Cloud,
            cost_per_unit: Some(0.04),
            unit_type: "second".into(),
            description: "Google AI music model".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // 3D / SEGMENTATION
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "meshy-4".into(),
            name: "Meshy 4".into(),
            provider: "meshy".into(),
            capabilities: vec![ThreeDGeneration],
            location: Cloud,
            cost_per_unit: Some(0.10),
            unit_type: "model".into(),
            description: "Text/image to 3D mesh".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
        },
        ModelDefinition {
            id: "sam-3".into(),
            name: "SAM 3".into(),
            provider: "meta".into(),
            capabilities: vec![Segmentation, Vision],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Segment Anything 3, 3D support".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: Some("sam-3".into()),
        },
    ]
}

pub fn get_models_by_capability(capability: ModelCapability) -> Vec<ModelDefinition> {
    get_all_models()
        .into_iter()
        .filter(|m| m.capabilities.contains(&capability))
        .collect()
}

/// Get only local (free) models
pub fn get_local_models() -> Vec<ModelDefinition> {
    get_all_models()
        .into_iter()
        .filter(|m| m.location == ModelLocation::Local)
        .collect()
}

/// Get models by provider
pub fn get_models_by_provider(provider: &str) -> Vec<ModelDefinition> {
    get_all_models()
        .into_iter()
        .filter(|m| m.provider == provider)
        .collect()
}
