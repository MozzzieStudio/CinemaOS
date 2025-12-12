//! Local Inference Stack
//!
//! Manages local AI model execution:
//! - Llama Stack (LLMs grandes: Llama 4)
//! - AI Edge (modelos pequeños/rápidos: Gemma 3, Gemini Nano)
//! - Whisper (transcripción)
//! - SAM (segmentación)
//! - AudioCraft (música/audio)
//! - GPT-OSS (OpenAI open source models)

use serde::{Deserialize, Serialize};
use specta::Type;

/// Local inference provider
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum LocalProvider {
    LlamaStack, // Llama 4 via Meta Llama Stack
    AIEdge,     // Gemma 3/3n, Gemini Nano, PaliGemma via MediaPipe/LiteRT
    Whisper,    // OpenAI Whisper for speech-to-text
    SAM,        // Segment Anything Model 3
    AudioCraft, // Meta AudioCraft for music/audio
    GPTOss,     // GPT-OSS 120B/20B open source
}

/// Hardware capabilities for local inference
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HardwareCapabilities {
    pub gpu_name: Option<String>,
    pub vram_gb: u32,
    pub ram_gb: u32,
    pub can_run_llama_stack: bool,
    pub can_run_ai_edge: bool,
    pub can_run_whisper: bool,
    pub can_run_sam: bool,
    pub can_run_audiocraft: bool,
    pub can_run_gpt_oss: bool,
}

impl Default for HardwareCapabilities {
    fn default() -> Self {
        Self {
            gpu_name: None,
            vram_gb: 0,
            ram_gb: 8,
            can_run_llama_stack: false,
            can_run_ai_edge: false,
            can_run_whisper: true, // CPU ok
            can_run_sam: false,
            can_run_audiocraft: false,
            can_run_gpt_oss: false,
        }
    }
}

/// Detect hardware capabilities
pub fn detect_hardware() -> HardwareCapabilities {
    // Get RAM
    let ram_gb = sys_info::mem_info()
        .map(|m| (m.total / 1024 / 1024) as u32)
        .unwrap_or(8);

    // GPU detection using gpu_detector module (WGPU-based)
    let (gpu_name, vram_gb) = detect_gpu_info();

    HardwareCapabilities {
        gpu_name,
        vram_gb,
        ram_gb,
        can_run_llama_stack: vram_gb >= 16, // Llama 4 needs 16GB+
        can_run_ai_edge: vram_gb >= 4,      // Gemma 3n, Gemini Nano
        can_run_whisper: ram_gb >= 4,       // CPU inference ok
        can_run_sam: vram_gb >= 8,          // SAM 3 needs 8GB
        can_run_audiocraft: vram_gb >= 8,   // AudioCraft needs 8GB
        can_run_gpt_oss: vram_gb >= 24,     // GPT-OSS 20B needs 24GB+
    }
}

/// Detect GPU info using gpu_detector module
fn detect_gpu_info() -> (Option<String>, u32) {
    use crate::installer::gpu_detector;
    let (name, _vendor, vram) = gpu_detector::detect_gpu();
    (name, vram)
}

/// Get the local provider for a model ID
pub fn get_local_provider(model_id: &str) -> LocalProvider {
    match model_id {
        // Meta Llama
        id if id.starts_with("llama") => LocalProvider::LlamaStack,

        // Google AI Edge models
        id if id.starts_with("gemma") => LocalProvider::AIEdge,
        id if id.starts_with("gemini-nano") => LocalProvider::AIEdge,
        id if id.starts_with("paligemma") => LocalProvider::AIEdge,

        // Audio
        id if id.starts_with("whisper") => LocalProvider::Whisper,
        id if id.starts_with("audiocraft") => LocalProvider::AudioCraft,

        // Vision
        id if id.starts_with("sam") => LocalProvider::SAM,

        // OpenAI Open Source
        id if id.starts_with("gpt-oss") => LocalProvider::GPTOss,

        // default to fast inference
        _ => LocalProvider::AIEdge,
    }
}

/// Check if a model can run locally with current hardware
pub fn can_run_locally(model_id: &str, hw: &HardwareCapabilities) -> bool {
    match get_local_provider(model_id) {
        LocalProvider::LlamaStack => hw.can_run_llama_stack,
        LocalProvider::AIEdge => hw.can_run_ai_edge,
        LocalProvider::Whisper => hw.can_run_whisper,
        LocalProvider::SAM => hw.can_run_sam,
        LocalProvider::AudioCraft => hw.can_run_audiocraft,
        LocalProvider::GPTOss => hw.can_run_gpt_oss,
    }
}

/// Get all locally runnable models for given hardware
pub fn get_available_local_models(hw: &HardwareCapabilities) -> Vec<&'static str> {
    let mut models = Vec::new();

    // Always available (CPU)
    if hw.can_run_whisper {
        models.push("whisper-v3");
    }

    // Light GPU (4GB+)
    if hw.can_run_ai_edge {
        models.push("gemma-3n");
        models.push("gemini-nano");
        models.push("paligemma-2");
    }

    // Medium GPU (8GB+)
    if hw.can_run_sam {
        models.push("sam-3");
        models.push("gemma-3");
    }
    if hw.can_run_audiocraft {
        models.push("audiocraft");
    }

    // High GPU (16GB+)
    if hw.can_run_llama_stack {
        models.push("llama-4");
    }

    // Very High GPU (24GB+)
    if hw.can_run_gpt_oss {
        models.push("gpt-oss-20b");
        models.push("gpt-oss-120b");
    }

    models
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_local_provider_routing() {
        assert_eq!(get_local_provider("llama-4"), LocalProvider::LlamaStack);
        assert_eq!(get_local_provider("gemma-3"), LocalProvider::AIEdge);
        assert_eq!(get_local_provider("gemini-nano"), LocalProvider::AIEdge);
        assert_eq!(get_local_provider("paligemma-2"), LocalProvider::AIEdge);
        assert_eq!(get_local_provider("whisper-v3"), LocalProvider::Whisper);
        assert_eq!(get_local_provider("sam-3"), LocalProvider::SAM);
        assert_eq!(get_local_provider("audiocraft"), LocalProvider::AudioCraft);
        assert_eq!(get_local_provider("gpt-oss-120b"), LocalProvider::GPTOss);
    }

    #[test]
    fn test_hardware_requirements() {
        let low_end = HardwareCapabilities {
            vram_gb: 4,
            ram_gb: 8,
            can_run_ai_edge: true,
            can_run_whisper: true,
            ..Default::default()
        };
        assert!(!can_run_locally("llama-4", &low_end));
        assert!(can_run_locally("gemma-3", &low_end));
        assert!(can_run_locally("whisper-v3", &low_end));

        let high_end = HardwareCapabilities {
            vram_gb: 24,
            ram_gb: 64,
            can_run_llama_stack: true,
            can_run_ai_edge: true,
            can_run_whisper: true,
            can_run_sam: true,
            can_run_audiocraft: true,
            can_run_gpt_oss: true,
            ..Default::default()
        };
        assert!(can_run_locally("llama-4", &high_end));
        assert!(can_run_locally("gpt-oss-120b", &high_end));
    }

    #[test]
    fn test_available_models() {
        let hw = HardwareCapabilities {
            vram_gb: 8,
            ram_gb: 16,
            can_run_ai_edge: true,
            can_run_whisper: true,
            can_run_sam: true,
            can_run_audiocraft: true,
            ..Default::default()
        };
        let models = get_available_local_models(&hw);
        assert!(models.contains(&"whisper-v3"));
        assert!(models.contains(&"gemma-3n"));
        assert!(models.contains(&"sam-3"));
        assert!(!models.contains(&"llama-4")); // needs 16GB
    }
}
