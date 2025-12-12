//! Cost calculation for AI operations
//!
//! Transparent credit-based pricing

use serde::{Deserialize, Serialize};

/// Credit costs per operation
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CostEstimate {
    /// Estimated credits
    pub credits: f32,
    /// Breakdown by service
    pub breakdown: Vec<CostItem>,
}

/// Cost item
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct CostItem {
    pub service: String,
    pub operation: String,
    pub credits: f32,
}

/// Cost calculator
pub struct CostCalculator;

impl CostCalculator {
    /// Estimate cost for image generation
    pub fn estimate_image_generation(
        model: &str,
        width: u32,
        height: u32,
        steps: u32,
    ) -> CostEstimate {
        let credits = match model {
            // Local models (free)
            "flux-schnell" => 0.0,

            // Cloud models (Fal.ai pricing)
            "flux-2-pro" => {
                // ~$0.05 per image
                let megapixels = (width * height) as f32 / 1_000_000.0;
                0.05 * megapixels
            }
            "kling-image-o1" => {
                // $0.028 per image (Kling pricing)
                0.028
            }
            "imagen-4" => {
                // Google Imagen 4 pricing
                0.04
            }
            _ => 0.0,
        };

        CostEstimate {
            credits,
            breakdown: vec![CostItem {
                service: "Image Generation".to_string(),
                operation: model.to_string(),
                credits,
            }],
        }
    }

    /// Estimate cost for video generation
    pub fn estimate_video_generation(
        model: &str,
        duration_secs: f32,
        resolution: VideoResolution,
    ) -> CostEstimate {
        let credits = match model {
            // Kling Video pricing: $0.112 per second
            "kling-o1" | "kling-video-2.6" => 0.112 * duration_secs,
            // Veo 3.1 (estimate)
            "veo-3.1" => 0.15 * duration_secs,
            // Sora 2 Pro (estimate)
            "sora-2-pro" => 0.20 * duration_secs,
            _ => 0.0,
        };

        CostEstimate {
            credits,
            breakdown: vec![CostItem {
                service: "Video Generation".to_string(),
                operation: format!("{} ({} seconds, {:?})", model, duration_secs, resolution),
                credits,
            }],
        }
    }

    /// Estimate cost for TTS
    pub fn estimate_tts(service: &str, characters: usize) -> CostEstimate {
        let credits = match service {
            // ElevenLabs v3: ~$0.30 per 1000 chars
            "elevenlabs-v3" => (characters as f32 / 1000.0) * 0.30,
            // Kling native audio (included in video)
            "kling-native" => 0.0,
            _ => 0.0,
        };

        CostEstimate {
            credits,
            breakdown: vec![CostItem {
                service: "Text-to-Speech".to_string(),
                operation: format!("{} ({} chars)", service, characters),
                credits,
            }],
        }
    }

    /// Estimate cost for LLM inference
    pub fn estimate_llm(model: &str, prompt_tokens: u32, max_completion: u32) -> CostEstimate {
        let (input_cost, output_cost) = match model {
            // Local models (free)
            "llama-4" | "mistral" | "qwen-3" => (0.0, 0.0),

            // Gemini 3 Pro (Google pricing)
            "gemini-3-pro" => (0.000125, 0.0005), // per 1K tokens

            // Claude Opus 4.5
            "claude-opus-4.5" => (0.015, 0.075),

            // GPT-5
            "gpt-5" => (0.010, 0.030),

            _ => (0.0, 0.0),
        };

        let prompt_cost = (prompt_tokens as f32 / 1000.0) * input_cost;
        let completion_cost = (max_completion as f32 / 1000.0) * output_cost;
        let credits = prompt_cost + completion_cost;

        CostEstimate {
            credits,
            breakdown: vec![CostItem {
                service: "LLM Inference".to_string(),
                operation: format!(
                    "{} (~{}K tokens)",
                    model,
                    (prompt_tokens + max_completion) / 1000
                ),
                credits,
            }],
        }
    }
}

/// Video resolution enum
#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type)]
pub enum VideoResolution {
    SD,     // 480p
    HD,     // 720p
    FullHD, // 1080p
    #[serde(rename = "4K")]
    FourK, // 2160p
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_image_cost() {
        let cost = CostCalculator::estimate_image_generation("flux-schnell", 1024, 1024, 4);
        assert_eq!(cost.credits, 0.0); // Local is free

        let cost = CostCalculator::estimate_image_generation("kling-image-o1", 1024, 1024, 4);
        assert_eq!(cost.credits, 0.028); // Kling pricing
    }

    #[test]
    fn test_video_cost() {
        let cost =
            CostCalculator::estimate_video_generation("kling-o1", 5.0, VideoResolution::FullHD);
        assert_eq!(cost.credits, 0.56); // 5s * $0.112
    }
}
