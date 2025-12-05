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
        },
        ModelDefinition {
            id: "gpt-5-nano".into(),
            name: "GPT-5 Nano".into(),
            provider: "openai".into(),
            capabilities: vec![TextGeneration],
            location: Cloud,
            cost_per_unit: Some(0.0005),
            unit_type: "1K tokens".into(),
            description: "Ultra efficient".into(),
            is_new: true,
            speed_tier: Fast,
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
        },
        ModelDefinition {
            id: "flux-1.1-pro-ultra".into(),
            name: "FLUX 1.1 Pro Ultra".into(),
            provider: "bfl".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            cost_per_unit: Some(0.06),
            unit_type: "image".into(),
            description: "4MP ultra high-res".into(),
            is_new: true,
            speed_tier: Quality,
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
        },
        // --- Google (deepmind.google/models/imagen) ---
        ModelDefinition {
            id: "imagen-4".into(),
            name: "Imagen 4".into(),
            provider: "google".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.03),
            unit_type: "image".into(),
            description: "Photorealistic".into(),
            is_new: true,
            speed_tier: Quality,
        },
        // --- Google Nano Banana (deepmind.google/models/gemini-image/) ---
        ModelDefinition {
            id: "nano-banana-pro".into(),
            name: "Nano Banana Pro (Gemini 3 Pro Image)".into(),
            provider: "google".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.04),
            unit_type: "image".into(),
            description: "Studio-quality 4K images".into(),
            is_new: true,
            speed_tier: Quality,
        },
        ModelDefinition {
            id: "nano-banana".into(),
            name: "Nano Banana (Gemini 2.5 Flash Image)".into(),
            provider: "google".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.02),
            unit_type: "image".into(),
            description: "Fast 1024px images".into(),
            is_new: true,
            speed_tier: Fast,
        },
        // --- ByteDance ---
        ModelDefinition {
            id: "seedream-4.5".into(),
            name: "Seedream 4.5".into(),
            provider: "bytedance".into(),
            capabilities: vec![TextToImage, ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.02),
            unit_type: "image".into(),
            description: "Reference consistency".into(),
            is_new: true,
            speed_tier: Quality,
        },
        ModelDefinition {
            id: "seedream-4.0".into(),
            name: "Seedream 4.0".into(),
            provider: "bytedance".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            cost_per_unit: Some(0.015),
            unit_type: "image".into(),
            description: "Previous version".into(),
            is_new: false,
            speed_tier: Standard,
        },
        ModelDefinition {
            id: "seededit-3.0".into(),
            name: "SeedEdit 3.0".into(),
            provider: "bytedance".into(),
            capabilities: vec![ImageToImage],
            location: Cloud,
            cost_per_unit: Some(0.015),
            unit_type: "image".into(),
            description: "Multi-image editing".into(),
            is_new: true,
            speed_tier: Standard,
        },
        // --- Alibaba ---
        ModelDefinition {
            id: "z-image-turbo".into(),
            name: "Z-Image Turbo".into(),
            provider: "alibaba".into(),
            capabilities: vec![TextToImage],
            location: Cloud,
            cost_per_unit: Some(0.005),
            unit_type: "image".into(),
            description: "Ultra-fast".into(),
            is_new: false,
            speed_tier: Fast,
        },
        // ═══════════════════════════════════════════════════════════════════
        // VIDEO GENERATION
        // ═══════════════════════════════════════════════════════════════════

        // --- Google (deepmind.google/models/veo) ---
        ModelDefinition {
            id: "veo-3.1".into(),
            name: "Veo 3.1".into(),
            provider: "google".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.15),
            unit_type: "second".into(),
            description: "State-of-the-art".into(),
            is_new: true,
            speed_tier: Quality,
        },
        // --- OpenAI ---
        ModelDefinition {
            id: "sora-2".into(),
            name: "Sora 2".into(),
            provider: "openai".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.15),
            unit_type: "second".into(),
            description: "OpenAI video".into(),
            is_new: true,
            speed_tier: Quality,
        },
        ModelDefinition {
            id: "sora-2-pro".into(),
            name: "Sora 2 Pro".into(),
            provider: "openai".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.25),
            unit_type: "second".into(),
            description: "Extended video".into(),
            is_new: true,
            speed_tier: Quality,
        },
        // --- Runway (runwayml.com/research/introducing-runway-gen-4.5) ---
        ModelDefinition {
            id: "gen-4.5".into(),
            name: "Runway Gen-4.5".into(),
            provider: "runway".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.12),
            unit_type: "second".into(),
            description: "Best motion quality".into(),
            is_new: true,
            speed_tier: Quality,
        },
        // --- Kuaishou (klingai.com) ---
        ModelDefinition {
            id: "kling-v2.5-turbo".into(),
            name: "Kling V2.5 Turbo".into(),
            provider: "kling".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.08),
            unit_type: "second".into(),
            description: "Fast generation".into(),
            is_new: true,
            speed_tier: Fast,
        },
        // --- Alibaba Wan (huggingface.co/Wan-AI) ---
        ModelDefinition {
            id: "wan-2.5".into(),
            name: "Wan 2.5".into(),
            provider: "alibaba".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.06),
            unit_type: "second".into(),
            description: "I2V preview".into(),
            is_new: true,
            speed_tier: Standard,
        },
        ModelDefinition {
            id: "wan-2.2".into(),
            name: "Wan 2.2".into(),
            provider: "alibaba".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.05),
            unit_type: "second".into(),
            description: "T2V/I2V 14B".into(),
            is_new: true,
            speed_tier: Standard,
        },
        // --- ByteDance ---
        ModelDefinition {
            id: "seedance-1.0".into(),
            name: "Seedance 1.0".into(),
            provider: "bytedance".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.10),
            unit_type: "second".into(),
            description: "ByteDance video".into(),
            is_new: true,
            speed_tier: Quality,
        },
        // --- Lightricks (ltx.studio) ---
        ModelDefinition {
            id: "ltx-2".into(),
            name: "LTX-2".into(),
            provider: "lightricks".into(),
            capabilities: vec![TextToVideo, ImageToVideo],
            location: Cloud,
            cost_per_unit: Some(0.05),
            unit_type: "second".into(),
            description: "Video production".into(),
            is_new: true,
            speed_tier: Standard,
        },
        // ═══════════════════════════════════════════════════════════════════
        // AUDIO & VOICE
        // ═══════════════════════════════════════════════════════════════════

        // --- ElevenLabs ---
        ModelDefinition {
            id: "elevenlabs-v3".into(),
            name: "ElevenLabs v3".into(),
            provider: "elevenlabs".into(),
            capabilities: vec![TextToSpeech],
            location: Cloud,
            cost_per_unit: Some(0.18),
            unit_type: "1K chars".into(),
            description: "Best voice synthesis".into(),
            is_new: true,
            speed_tier: Quality,
        },
        // --- ByteDance ---
        ModelDefinition {
            id: "seed-realtime-voice".into(),
            name: "Seed Realtime Voice".into(),
            provider: "bytedance".into(),
            capabilities: vec![TextToSpeech],
            location: Cloud,
            cost_per_unit: Some(0.10),
            unit_type: "1K chars".into(),
            description: "Low-latency TTS".into(),
            is_new: true,
            speed_tier: Fast,
        },
        ModelDefinition {
            id: "seed-liveinterpret-2.0".into(),
            name: "Seed LiveInterpret 2.0".into(),
            provider: "bytedance".into(),
            capabilities: vec![TextToSpeech, SpeechToText],
            location: Cloud,
            cost_per_unit: Some(0.12),
            unit_type: "minute".into(),
            description: "Live interpretation".into(),
            is_new: true,
            speed_tier: Fast,
        },
        // --- Google (deepmind.google/models/lyria) ---
        ModelDefinition {
            id: "lyria-2".into(),
            name: "Lyria 2".into(),
            provider: "google".into(),
            capabilities: vec![MusicGeneration],
            location: Cloud,
            cost_per_unit: Some(0.10),
            unit_type: "second".into(),
            description: "High-fidelity music".into(),
            is_new: true,
            speed_tier: Quality,
        },
        ModelDefinition {
            id: "lyria-realtime".into(),
            name: "Lyria RealTime".into(),
            provider: "google".into(),
            capabilities: vec![MusicGeneration],
            location: Cloud,
            cost_per_unit: Some(0.05),
            unit_type: "second".into(),
            description: "Real-time music".into(),
            is_new: true,
            speed_tier: Fast,
        },
        ModelDefinition {
            id: "magenta-realtime".into(),
            name: "Magenta RealTime".into(),
            provider: "google".into(),
            capabilities: vec![MusicGeneration],
            location: Cloud,
            cost_per_unit: Some(0.04),
            unit_type: "second".into(),
            description: "Interactive music".into(),
            is_new: true,
            speed_tier: Fast,
        },
        // --- ByteDance ---
        ModelDefinition {
            id: "seed-music".into(),
            name: "Seed Music".into(),
            provider: "bytedance".into(),
            capabilities: vec![MusicGeneration],
            location: Cloud,
            cost_per_unit: Some(0.08),
            unit_type: "second".into(),
            description: "Music generation".into(),
            is_new: true,
            speed_tier: Standard,
        },
        // --- Meta ---
        ModelDefinition {
            id: "audiocraft".into(),
            name: "AudioCraft".into(),
            provider: "meta".into(),
            capabilities: vec![MusicGeneration, AudioGeneration],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Open-source audio".into(),
            is_new: false,
            speed_tier: Standard,
        },
        // --- OpenAI ---
        ModelDefinition {
            id: "whisper-v3".into(),
            name: "Whisper v3".into(),
            provider: "openai".into(),
            capabilities: vec![SpeechToText],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Speech transcription".into(),
            is_new: false,
            speed_tier: Fast,
        },
        // ═══════════════════════════════════════════════════════════════════
        // VISION & SEGMENTATION
        // ═══════════════════════════════════════════════════════════════════

        // --- Meta (github.com/facebookresearch/sam3) ---
        ModelDefinition {
            id: "sam-3".into(),
            name: "SAM 3".into(),
            provider: "meta".into(),
            capabilities: vec![Segmentation],
            location: Local,
            cost_per_unit: None,
            unit_type: "free".into(),
            description: "Segment Anything".into(),
            is_new: true,
            speed_tier: Fast,
        },
        ModelDefinition {
            id: "sam-3d".into(),
            name: "SAM 3D".into(),
            provider: "meta".into(),
            capabilities: vec![Segmentation, ThreeDGeneration],
            location: Cloud,
            cost_per_unit: Some(0.05),
            unit_type: "scene".into(),
            description: "2D to 3D reconstruction".into(),
            is_new: true,
            speed_tier: Standard,
        },
        // ═══════════════════════════════════════════════════════════════════
        // 3D GENERATION
        // ═══════════════════════════════════════════════════════════════════

        // --- ByteDance ---
        ModelDefinition {
            id: "seed-3d".into(),
            name: "Seed 3D".into(),
            provider: "bytedance".into(),
            capabilities: vec![ThreeDGeneration],
            location: Cloud,
            cost_per_unit: Some(0.10),
            unit_type: "model".into(),
            description: "3D model generation".into(),
            is_new: true,
            speed_tier: Quality,
        },
        // --- Meshy (meshy.ai) ---
        ModelDefinition {
            id: "meshy-4".into(),
            name: "Meshy 4".into(),
            provider: "meshy".into(),
            capabilities: vec![ThreeDGeneration],
            location: Cloud,
            cost_per_unit: Some(0.08),
            unit_type: "model".into(),
            description: "Text/image to 3D".into(),
            is_new: true,
            speed_tier: Standard,
        },
    ]
}

/// Get models filtered by capability
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
