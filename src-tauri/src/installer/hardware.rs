//! Hardware Detection and Model Recommendations
//!
//! Detects GPU, VRAM, RAM and recommends appropriate models

use serde::{Deserialize, Serialize};
use specta::Type;

// ═══════════════════════════════════════════════════════════════════════════════
// HARDWARE INFO
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HardwareInfo {
    pub gpu_name: Option<String>,
    pub gpu_vendor: Option<String>,
    pub vram_gb: u32,
    pub ram_gb: u32,
    pub cpu_cores: u32,
    pub os: String,
}

impl Default for HardwareInfo {
    fn default() -> Self {
        Self {
            gpu_name: None,
            gpu_vendor: None,
            vram_gb: 0,
            ram_gb: 8,
            cpu_cores: 4,
            os: std::env::consts::OS.to_string(),
        }
    }
}

/// Detect hardware
pub fn detect_hardware() -> HardwareInfo {
    let ram_gb = sys_info::mem_info()
        .map(|m| (m.total / 1024 / 1024) as u32)
        .unwrap_or(8);

    let cpu_cores = sys_info::cpu_num().unwrap_or(4);

    // GPU detection using WGPU with fallbacks
    let (gpu_name, gpu_vendor, vram_gb) = detect_gpu();

    HardwareInfo {
        gpu_name,
        gpu_vendor,
        vram_gb,
        ram_gb,
        cpu_cores,
        os: std::env::consts::OS.to_string(),
    }
}

fn detect_gpu() -> (Option<String>, Option<String>, u32) {
    use crate::installer::gpu_detector;
    gpu_detector::detect_gpu()
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelRecommendation {
    pub id: String,
    pub name: String,
    pub category: ModelCategory,
    pub size_gb: f32,
    pub min_vram_gb: u32,
    pub recommended: bool,
    pub can_run: bool,
    pub download_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum ModelCategory {
    TextLLM,      // Text generation (Llama, Gemma)
    ImageGen,     // Image generation (FLUX, SDXL)
    VideoGen,     // Video generation
    AudioSTT,     // Speech to text (Whisper)
    AudioTTS,     // Text to speech
    Segmentation, // SAM
}

/// Get model recommendations based on hardware
pub fn get_model_recommendations(hardware: &HardwareInfo) -> Vec<ModelRecommendation> {
    let vram = hardware.vram_gb;

    vec![
        // ── TEXT LLMs ──
        ModelRecommendation {
            id: "llama-3.1-8b".into(),
            name: "Llama 3.1 8B".into(),
            category: ModelCategory::TextLLM,
            size_gb: 4.5,
            min_vram_gb: 6,
            recommended: (8..16).contains(&vram),
            can_run: vram >= 6,
            download_url: Some("https://ollama.com/library/llama3.1:8b".into()),
        },
        ModelRecommendation {
            id: "gemma-3-9b".into(),
            name: "Gemma 3 9B".into(),
            category: ModelCategory::TextLLM,
            size_gb: 5.5,
            min_vram_gb: 8,
            recommended: vram >= 10,
            can_run: vram >= 8,
            download_url: Some("https://ollama.com/library/gemma3:9b".into()),
        },
        ModelRecommendation {
            id: "llama-3.1-70b".into(),
            name: "Llama 3.1 70B".into(),
            category: ModelCategory::TextLLM,
            size_gb: 40.0,
            min_vram_gb: 48,
            recommended: vram >= 48,
            can_run: vram >= 48,
            download_url: Some("https://ollama.com/library/llama3.1:70b".into()),
        },
        // ── IMAGE GENERATION ──
        ModelRecommendation {
            id: "flux-schnell".into(),
            name: "FLUX.1 Schnell".into(),
            category: ModelCategory::ImageGen,
            size_gb: 12.0,
            min_vram_gb: 12,
            recommended: (12..24).contains(&vram),
            can_run: vram >= 12,
            download_url: Some("https://huggingface.co/black-forest-labs/FLUX.1-schnell".into()),
        },
        ModelRecommendation {
            id: "sdxl-base".into(),
            name: "SDXL Base".into(),
            category: ModelCategory::ImageGen,
            size_gb: 6.5,
            min_vram_gb: 8,
            recommended: (8..12).contains(&vram),
            can_run: vram >= 8,
            download_url: Some(
                "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0".into(),
            ),
        },
        ModelRecommendation {
            id: "flux-dev".into(),
            name: "FLUX.1 Dev".into(),
            category: ModelCategory::ImageGen,
            size_gb: 24.0,
            min_vram_gb: 24,
            recommended: vram >= 24,
            can_run: vram >= 24,
            download_url: Some("https://huggingface.co/black-forest-labs/FLUX.1-dev".into()),
        },
        // ── AUDIO ──
        ModelRecommendation {
            id: "whisper-large".into(),
            name: "Whisper Large v3".into(),
            category: ModelCategory::AudioSTT,
            size_gb: 3.0,
            min_vram_gb: 4,
            recommended: vram >= 4,
            can_run: hardware.ram_gb >= 8, // Can run on CPU
            download_url: Some("https://huggingface.co/openai/whisper-large-v3".into()),
        },
        // ── SEGMENTATION ──
        ModelRecommendation {
            id: "sam-vit-h".into(),
            name: "SAM ViT-H".into(),
            category: ModelCategory::Segmentation,
            size_gb: 2.5,
            min_vram_gb: 8,
            recommended: vram >= 8,
            can_run: vram >= 8,
            download_url: Some("https://huggingface.co/facebook/sam-vit-huge".into()),
        },
    ]
}

/// Get only recommended models for this hardware
pub fn get_recommended_models(hardware: &HardwareInfo) -> Vec<ModelRecommendation> {
    get_model_recommendations(hardware)
        .into_iter()
        .filter(|m| m.recommended)
        .collect()
}

/// Get models that can run on this hardware
pub fn get_runnable_models(hardware: &HardwareInfo) -> Vec<ModelRecommendation> {
    get_model_recommendations(hardware)
        .into_iter()
        .filter(|m| m.can_run)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recommendations_8gb() {
        let hw = HardwareInfo {
            vram_gb: 8,
            ram_gb: 16,
            ..Default::default()
        };
        let recs = get_recommended_models(&hw);
        assert!(!recs.is_empty());
    }

    #[test]
    fn test_recommendations_24gb() {
        let hw = HardwareInfo {
            vram_gb: 24,
            ram_gb: 32,
            ..Default::default()
        };
        let recs = get_runnable_models(&hw);
        assert!(recs.len() > 5); // Should run most models
    }
}
