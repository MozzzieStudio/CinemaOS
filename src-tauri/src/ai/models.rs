//! Model Definitions for the Model Matrix
//!
//! Defines all available AI models, their capabilities, pricing, and context limits.
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
    Reasoning, // New: Chain of Thought
}

/// Speed/quality tier
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum SpeedTier {
    Fast,
    Standard,
    Quality,
}

/// Pricing structure per 1000 units
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelPricing {
    pub input_cost: f64,   // Per 1M tokens or per image/second
    pub output_cost: f64,  // Per 1M tokens or per image/second
    pub cache_read: f64,   // Per 1M tokens (if applicable)
    pub unit_type: String, // "1M tokens", "image", "second"
}

/// A model definition
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelDefinition {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub capabilities: Vec<ModelCapability>,
    pub location: ModelLocation,
    pub pricing: ModelPricing, // Replaces simple cost_per_unit
    pub context_window: u32,
    pub max_output: u32,
    pub description: String,
    pub is_new: bool,
    pub speed_tier: SpeedTier,
    pub local_download_id: Option<String>,
    pub api_schema: Option<String>, // JSON schema for specific integration
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
            id: "gemini-3.0-pro-001".into(),
            name: "Gemini 3 Pro".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Vision, AudioGeneration, Reasoning],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 1.25,
                output_cost: 5.00,
                cache_read: 0.30,
                unit_type: "1M tokens".into(),
            },
            context_window: 2_000_000,
            max_output: 16_384,
            description: "Native multimodal. Best context window (2M).".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "gemini-3.0-thinking".into(),
            name: "Gemini 3 Deep Think".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Reasoning],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 5.00,
                output_cost: 15.00,
                cache_read: 1.25,
                unit_type: "1M tokens".into(),
            },
            context_window: 1_000_000,
            max_output: 64_000,
            description: "Extended reasoning with thought signatures.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "gemini-2.5-flash".into(),
            name: "Gemini 2.5 Flash".into(),
            provider: "google".into(),
            capabilities: vec![TextGeneration, Vision, TextToImage], // Nano Banana
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.05,
                output_cost: 0.15,
                cache_read: 0.01,
                unit_type: "1M tokens".into(),
            },
            context_window: 2_000_000,
            max_output: 8_192,
            description: "Fast multimodal workhorse. Native image gen.".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "veo-3.1-vid".into(),
            name: "Veo 3.1".into(),
            provider: "google".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.0,
                output_cost: 0.20,
                cache_read: 0.0,
                unit_type: "second".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "1080p 60fps video with embedded audio.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "imagen-3-pro".into(),
            name: "Nano Banana Pro".into(),
            provider: "google".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.08,
                output_cost: 0.08,
                cache_read: 0.0,
                unit_type: "image".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "4096x4096 resolution. Glyph-Lock typography.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // OPENAI - platform.openai.com/docs/models
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "gpt-5.2-preview".into(),
            name: "GPT-5.2 Preview".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Vision, Reasoning],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 5.00,
                output_cost: 15.00,
                cache_read: 2.50,
                unit_type: "1M tokens".into(),
            },
            context_window: 1_000_000,
            max_output: 32_768,
            description: "Top-tier reasoning. Systems 2 thinking.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: Some("json_schema".into()),
        },
        ModelDefinition {
            id: "gpt-5.2-turbo".into(),
            name: "GPT-5.2 Turbo".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 2.00,
                output_cost: 6.00,
                cache_read: 1.00,
                unit_type: "1M tokens".into(),
            },
            context_window: 128_000,
            max_output: 16_384,
            description: "Fast flagship. Standard logic.".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "o3-fast".into(),
            name: "o3 Fast".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration, Reasoning],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 1.00,
                output_cost: 3.00,
                cache_read: 0.50,
                unit_type: "1M tokens".into(),
            },
            context_window: 200_000,
            max_output: 64_000,
            description: "Instant reasoning chain.".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: None,
            api_schema: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // ANTHROPIC - platform.claude.com/docs
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "claude-4.5-opus".into(),
            name: "Claude 4.5 Opus".into(),
            provider: "anthropic".into(),
            capabilities: vec![TextGeneration, Vision, Reasoning],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 10.00,
                output_cost: 30.00,
                cache_read: 1.00,
                unit_type: "1M tokens".into(),
            },
            context_window: 500_000,
            max_output: 8_192,
            description: "Maximum intelligence. Best writer.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: Some("prompt_caching".into()),
        },
        ModelDefinition {
            id: "claude-4.5-sonnet".into(),
            name: "Claude 4.5 Sonnet".into(),
            provider: "anthropic".into(),
            capabilities: vec![TextGeneration, Vision],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 3.00,
                output_cost: 12.00,
                cache_read: 0.30,
                unit_type: "1M tokens".into(),
            },
            context_window: 500_000,
            max_output: 8_192,
            description: "Balanced for coding and logic.".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
            api_schema: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // META - llama.com/models/llama-4
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "llama-4-70b".into(),
            name: "Llama 4 70B".into(),
            provider: "meta".into(),
            capabilities: vec![TextGeneration, Reasoning],
            location: Local,
            pricing: ModelPricing {
                input_cost: 0.0,
                output_cost: 0.0,
                cache_read: 0.0,
                unit_type: "free".into(),
            },
            context_window: 128_000,
            max_output: 4096,
            description: "Local workhorse. Requires 24GB VRAM.".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: Some("llama-4-70b-quant".into()),
            api_schema: None,
        },
        ModelDefinition {
            id: "llama-4-8b".into(),
            name: "Llama 4 8B".into(),
            provider: "meta".into(),
            capabilities: vec![TextGeneration],
            location: Local,
            pricing: ModelPricing {
                input_cost: 0.0,
                output_cost: 0.0,
                cache_read: 0.0,
                unit_type: "free".into(),
            },
            context_window: 128_000,
            max_output: 4096,
            description: "Fast local assistant. Requires 6GB VRAM.".into(),
            is_new: true,
            speed_tier: Fast,
            local_download_id: Some("llama-4-8b-quant".into()),
            api_schema: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // BLACK FOREST LABS - bfl.ai
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "flux-pro-1.1-ultra".into(),
            name: "Flux 1.1 Pro Ultra".into(),
            provider: "bfl".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.06,
                output_cost: 0.06,
                cache_read: 0.0,
                unit_type: "image".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "4MP Raw Mode. Photographic realism.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "flux-pro-2.0".into(),
            name: "Flux 2.0".into(),
            provider: "bfl".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.05,
                output_cost: 0.05,
                cache_read: 0.0,
                unit_type: "image".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "Multi-reference composition.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "flux-fill".into(),
            name: "Flux Fill".into(),
            provider: "bfl".into(),
            capabilities: vec![ImageToImage],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.03,
                output_cost: 0.03,
                cache_read: 0.0,
                unit_type: "image".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "State-of-the-art Inpainting/Outpainting.".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
            api_schema: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // KLING AI - klingai.com
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "kling-o1".into(),
            name: "Kling O1 (Omni)".into(),
            provider: "kling".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.112,
                output_cost: 0.112,
                cache_read: 0.0,
                unit_type: "second".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "Native Video+Audio. Unrivaled consistency.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "kling-v2.6".into(),
            name: "Kling Video 2.6".into(),
            provider: "kling".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.08,
                output_cost: 0.08,
                cache_read: 0.0,
                unit_type: "second".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "Cinematic motion generation.".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "kling-image-o1".into(),
            name: "Kling Image O1".into(),
            provider: "kling".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.0035,
                output_cost: 0.0035,
                cache_read: 0.0,
                unit_type: "image".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "Kolors 2.1 architecture. 4K output.".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
            api_schema: None,
        },
        // ═══════════════════════════════════════════════════════════════════
        // ALIBABA - modelstudio.console.alibabacloud.com
        // ═══════════════════════════════════════════════════════════════════
        ModelDefinition {
            id: "wan-2.5-i2v".into(),
            name: "Wan 2.5 I2V".into(),
            provider: "alibaba".into(),
            capabilities: vec![ImageToVideo],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.06,
                output_cost: 0.06,
                cache_read: 0.0,
                unit_type: "second".into(),
            },
            context_window: 0,
            max_output: 0,
            description: "Asian Sora. High motion physics.".into(),
            is_new: true,
            speed_tier: Standard,
            local_download_id: None,
            api_schema: None,
        },
        ModelDefinition {
            id: "qwen-3-max".into(),
            name: "Qwen 3 Max".into(),
            provider: "alibaba".into(),
            capabilities: vec![TextGeneration, Reasoning],
            location: Cloud,
            pricing: ModelPricing {
                input_cost: 0.001,
                output_cost: 0.002,
                cache_read: 0.0,
                unit_type: "1M tokens".into(),
            },
            context_window: 32_768,
            max_output: 8_192,
            description: "Best coding model per dollar.".into(),
            is_new: true,
            speed_tier: Quality,
            local_download_id: None,
            api_schema: None,
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
