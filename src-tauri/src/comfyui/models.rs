//! Model management for ComfyUI
//!
//! Handles downloading and managing essential models for CinemaOS.
//! Updated December 2025 with latest model versions.

use crate::errors::AppError;
use std::path::PathBuf;
use std::process::Command;

/// Model category for organization
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ModelCategory {
    Checkpoint,
    Lora,
    Vae,
    ControlNet,
    Upscaler,
    Clip,
}

impl ModelCategory {
    pub fn folder_name(&self) -> &'static str {
        match self {
            Self::Checkpoint => "models/checkpoints",
            Self::Lora => "models/loras",
            Self::Vae => "models/vae",
            Self::ControlNet => "models/controlnet",
            Self::Upscaler => "models/upscale_models",
            Self::Clip => "models/clip",
        }
    }
}

/// Essential models for CinemaOS Local - Verified December 2025
/// All URLs verified against HuggingFace
pub struct EssentialModels;

impl EssentialModels {
    // ══════════════════════════════════════════════════════════════════════════
    // IMAGE GENERATION - FLUX.1 (Black Forest Labs)
    // Note: FLUX.2 is API-only, FLUX.1 is downloadable
    // ══════════════════════════════════════════════════════════════════════════

    /// FLUX.1 Schnell - Ultra-fast 4-step model (Apache 2.0 license)
    /// HuggingFace: https://huggingface.co/black-forest-labs/FLUX.1-schnell
    pub const FLUX_1_SCHNELL: &'static str =
        "https://huggingface.co/black-forest-labs/FLUX.1-schnell";

    /// FLUX.1 Dev - High quality development model (non-commercial)
    /// HuggingFace: https://huggingface.co/black-forest-labs/FLUX.1-dev
    pub const FLUX_1_DEV: &'static str = "https://huggingface.co/black-forest-labs/FLUX.1-dev";

    /// FLUX.1 Kontext Dev - Multi-image editing (non-commercial)
    /// HuggingFace: https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev
    pub const FLUX_1_KONTEXT: &'static str =
        "https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev";

    /// FLUX.1 Canny Dev - Edge-guided generation
    pub const FLUX_1_CANNY: &'static str =
        "https://huggingface.co/black-forest-labs/FLUX.1-Canny-dev";

    /// FLUX.1 Depth Dev - Depth-guided generation
    pub const FLUX_1_DEPTH: &'static str =
        "https://huggingface.co/black-forest-labs/FLUX.1-Depth-dev";

    // ══════════════════════════════════════════════════════════════════════════
    // VIDEO GENERATION - Local Models
    // ══════════════════════════════════════════════════════════════════════════

    /// LTX Video 0.9.8 13B Distilled - Fast video generation (Lightricks)
    /// HuggingFace: https://huggingface.co/Lightricks/LTX-Video-0.9.8-13B-distilled
    pub const LTX_VIDEO_13B: &'static str =
        "https://huggingface.co/Lightricks/LTX-Video-0.9.8-13B-distilled";

    /// LTX Video Base - Original model
    pub const LTX_VIDEO_BASE: &'static str = "https://huggingface.co/Lightricks/LTX-Video";

    /// Wan 2.1 T2V 14B - Text to Video (Alibaba)
    /// Note: Wan2.2 not yet on HuggingFace, using 2.1
    pub const WAN_T2V: &'static str = "https://huggingface.co/Wan-AI/Wan2.1-T2V-14B";

    /// Wan 2.1 I2V - Image to Video
    pub const WAN_I2V: &'static str = "https://huggingface.co/Wan-AI/Wan2.1-I2V-14B-480P";

    // ══════════════════════════════════════════════════════════════════════════
    // IMAGE PROCESSING & SEGMENTATION
    // ══════════════════════════════════════════════════════════════════════════

    /// SAM 2.1 Base - Segment Anything Model v2.1 (Meta)
    /// HuggingFace: https://huggingface.co/facebook/sam2.1-hiera-base
    pub const SAM_2_BASE: &'static str = "https://huggingface.co/facebook/sam2.1-hiera-base";

    /// SAM 2.1 Large - Higher quality segmentation
    pub const SAM_2_LARGE: &'static str = "https://huggingface.co/facebook/sam2.1-hiera-large";

    /// RMBG 2.0 - Background removal (Bria)
    pub const RMBG_2: &'static str = "https://huggingface.co/briaai/RMBG-2.0";

    // ══════════════════════════════════════════════════════════════════════════
    // FAST IMAGE MODELS
    // ══════════════════════════════════════════════════════════════════════════

    /// SDXL Turbo - Fast 1-step image generation (Stability AI)
    pub const SDXL_TURBO: &'static str = "https://huggingface.co/stabilityai/sdxl-turbo";

    /// SDXL Lightning - 4-step fast generation (ByteDance)
    pub const SDXL_LIGHTNING: &'static str = "https://huggingface.co/ByteDance/SDXL-Lightning";

    // ══════════════════════════════════════════════════════════════════════════
    // UPSCALING
    // ══════════════════════════════════════════════════════════════════════════

    /// Real-ESRGAN x4 - Image upscaling
    pub const REALESRGAN_X4: &'static str = "https://huggingface.co/ai-forever/Real-ESRGAN";

    // ══════════════════════════════════════════════════════════════════════════
    // LOCAL LLMs (for Llama Stack / Ollama)
    // ══════════════════════════════════════════════════════════════════════════

    /// Gemma 3 - Google's open multimodal LLM
    /// HuggingFace: https://huggingface.co/google/gemma-3
    pub const GEMMA_3: &'static str = "https://huggingface.co/google/gemma-3";

    /// Gemma 3n - Mobile-first, low-latency
    pub const GEMMA_3N: &'static str = "https://huggingface.co/google/gemma-3n";

    /// Llama 4 Maverick - Meta's latest open model
    pub const LLAMA_4: &'static str = "https://huggingface.co/meta-llama/Llama-4-Maverick";

    /// Qwen 3 - Alibaba's multilingual model
    pub const QWEN_3: &'static str = "https://huggingface.co/Qwen/Qwen3-32B";

    /// Get list of all essential models for local ComfyUI
    pub fn all_local() -> Vec<(&'static str, &'static str, ModelCategory)> {
        vec![
            // Primary image model (fast, Apache 2.0)
            (
                "FLUX.1 Schnell",
                Self::FLUX_1_SCHNELL,
                ModelCategory::Checkpoint,
            ),
        ]
    }

    /// Get list of optional models for enhanced capabilities
    pub fn optional() -> Vec<(&'static str, &'static str, ModelCategory)> {
        vec![
            ("FLUX.1 Dev", Self::FLUX_1_DEV, ModelCategory::Checkpoint),
            (
                "FLUX.1 Kontext",
                Self::FLUX_1_KONTEXT,
                ModelCategory::Checkpoint,
            ),
            (
                "LTX Video 13B",
                Self::LTX_VIDEO_13B,
                ModelCategory::Checkpoint,
            ),
            ("Wan T2V", Self::WAN_T2V, ModelCategory::Checkpoint),
            ("SAM 2.1 Base", Self::SAM_2_BASE, ModelCategory::Checkpoint),
            ("SDXL Turbo", Self::SDXL_TURBO, ModelCategory::Checkpoint),
            ("Real-ESRGAN", Self::REALESRGAN_X4, ModelCategory::Upscaler),
        ]
    }
}

/// Cloud models available via Fal.ai & Replicate - No download needed
/// Updated December 2025 from Fal.ai/explore and Replicate/explore
pub struct CloudModels;

impl CloudModels {
    // ══════════════════════════════════════════════════════════════════════════
    // IMAGE GENERATION (Fal.ai + Replicate)
    // ══════════════════════════════════════════════════════════════════════════

    /// Nano Banana Pro - Google's state-of-the-art image gen/edit
    pub const NANO_BANANA_PRO: &'static str = "fal-ai/nano-banana-pro";
    pub const NANO_BANANA_PRO_EDIT: &'static str = "fal-ai/nano-banana-pro/edit";

    /// FLUX.2 Flex - Enhanced typography
    pub const FLUX_2_FLEX: &'static str = "fal-ai/flux-2-flex";

    /// FLUX.2 Pro - High-quality with 8 reference images
    pub const FLUX_2_PRO: &'static str = "black-forest-labs/flux-2-pro";

    /// FLUX Kontext Pro - Multi-image editing
    pub const FLUX_KONTEXT_PRO: &'static str = "fal-ai/flux-pro/kontext";
    pub const FLUX_KONTEXT_MAX: &'static str = "fal-ai/flux-pro/kontext/max";
    pub const FLUX_KONTEXT_FAST: &'static str = "prunaai/flux-kontext-fast";

    /// Seedream 4.5 - ByteDance (spatial understanding + world knowledge)
    pub const SEEDREAM_45: &'static str = "bytedance/seedream-4.5";
    pub const SEEDREAM_4_EDIT: &'static str = "fal-ai/bytedance/seedream/v4/edit";

    /// Imagen 4 Fast - Google
    pub const IMAGEN_4_FAST: &'static str = "google/imagen-4-fast";

    /// ImagineArt 1.5 - High-fidelity with correct text
    pub const IMAGINEART_15: &'static str = "imagineart/imagineart-1.5-preview/text-to-image";

    /// Recraft V3 - Vector art and typography
    pub const RECRAFT_V3: &'static str = "fal-ai/recraft/v3/text-to-image";

    /// Bria Fibo - SOTA open source (licensed data)
    pub const BRIA_FIBO: &'static str = "bria/fibo/generate";

    /// Reve Edit - Image transformation
    pub const REVE_EDIT: &'static str = "fal-ai/reve/edit";

    /// P-Image Edit - Sub 1 second editing
    pub const P_IMAGE_EDIT: &'static str = "prunaai/p-image-edit";

    // ══════════════════════════════════════════════════════════════════════════
    // VIDEO GENERATION - With Native Audio (Fal.ai + Replicate)
    // ══════════════════════════════════════════════════════════════════════════

    /// Veo 3.1 - Google DeepMind (best quality)
    pub const VEO_31: &'static str = "fal-ai/veo3.1";
    pub const VEO_31_FAST: &'static str = "fal-ai/veo3.1/fast";
    pub const VEO_31_I2V: &'static str = "fal-ai/veo3.1/image-to-video";
    pub const VEO_31_FIRST_LAST: &'static str = "fal-ai/veo3.1/first-last-frame-to-video";
    pub const VEO_31_REF: &'static str = "fal-ai/veo3.1/reference-to-video";

    /// Sora 2 - OpenAI (flagship)
    pub const SORA_2: &'static str = "fal-ai/sora-2/text-to-video";
    pub const SORA_2_PRO: &'static str = "fal-ai/sora-2/text-to-video/pro";
    pub const SORA_2_I2V: &'static str = "fal-ai/sora-2/image-to-video";

    /// Kling v2.6 - Kuaishou (cinematic)
    pub const KLING_V26_T2V: &'static str = "fal-ai/kling-video/v2.6/pro/text-to-video";
    pub const KLING_V26_I2V: &'static str = "fal-ai/kling-video/v2.6/pro/image-to-video";

    /// Kling v2.5 Turbo Pro - Fast cinematic
    pub const KLING_V25_TURBO: &'static str = "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";

    /// Kling v2.1 Master - Premium
    pub const KLING_V21_MASTER: &'static str = "fal-ai/kling-video/v2.1/master/image-to-video";

    /// Wan 2.5 - Alibaba (I2V + T2V)
    pub const WAN_25_I2V: &'static str = "wan-video/wan-2.5-i2v";
    pub const WAN_25_T2V: &'static str = "wan-video/wan-2.5-t2v";
    pub const WAN_22_I2V: &'static str = "fal-ai/wan/v2.2-a14b/image-to-video";

    /// MiniMax Hailuo 2.3 - Latest version
    pub const HAILUO_23: &'static str = "minimax/hailuo-2.3";
    pub const HAILUO_02: &'static str = "fal-ai/minimax/hailuo-02/standard/image-to-video";

    /// PixVerse v5 - Stylized video
    pub const PIXVERSE_V5: &'static str = "fal-ai/pixverse/v5/image-to-video";

    /// Lucy-14B - Ultra fast I2V (Decart)
    pub const LUCY_14B: &'static str = "decart/lucy-14b/image-to-video";

    /// LTX Video 13B - Long videos
    pub const LTX_13B_I2V: &'static str = "fal-ai/ltxv-13b-098-distilled/image-to-video";

    /// LTX-2 Retake - Video section editing (Lightricks)
    pub const LTX_2_RETAKE: &'static str = "lightricks/ltx-2-retake";

    /// Runway Gen4 - Image generation with face control
    pub const RUNWAY_GEN4: &'static str = "runwayml/gen4-image";

    // ══════════════════════════════════════════════════════════════════════════
    // AUDIO GENERATION (Fal.ai + Replicate)
    // ══════════════════════════════════════════════════════════════════════════

    /// Beatoven - Royalty-free music generation
    pub const BEATOVEN_MUSIC: &'static str = "beatoven/music-generation";
    pub const BEATOVEN_SFX: &'static str = "beatoven/sound-effect-generation";

    /// MiniMax Speech-02 - TTS
    pub const MINIMAX_TTS_HD: &'static str = "fal-ai/minimax/speech-02-hd";
    pub const MINIMAX_TTS_TURBO: &'static str = "minimax/speech-02-turbo";

    /// Chatterbox - Resemble AI TTS
    pub const CHATTERBOX_TTS: &'static str = "fal-ai/chatterbox/text-to-speech";
    pub const CHATTERBOX_MULTI: &'static str = "resemble-ai/chatterbox-multilingual";

    /// Dia TTS - Voice cloning
    pub const DIA_TTS_CLONE: &'static str = "fal-ai/dia-tts/voice-clone";

    /// PlayAI Dialog - Multi-speaker dialogues
    pub const PLAYAI_DIALOG: &'static str = "fal-ai/playai/tts/dialog";

    /// Kokoro - Lightweight TTS (82M params)
    pub const KOKORO_TTS: &'static str = "jaaari/kokoro-82m";

    /// Mirelo SFX - Video to audio
    pub const MIRELO_SFX: &'static str = "mirelo-ai/sfx-v1/video-to-audio";
    pub const MIRELO_SFX_V2V: &'static str = "mirelo-ai/sfx-v1/video-to-video";

    // ══════════════════════════════════════════════════════════════════════════
    // ELEVENLABS (Direct API - Not via Fal/Replicate)
    // API Docs: https://elevenlabs.io/docs/api-reference
    // ══════════════════════════════════════════════════════════════════════════

    /// ElevenLabs Multilingual v2 - Best quality, 29 languages
    pub const ELEVENLABS_V2: &'static str = "eleven_multilingual_v2";

    /// ElevenLabs Flash v2.5 - Fast streaming (75ms latency)
    pub const ELEVENLABS_FLASH: &'static str = "eleven_flash_v2_5";

    /// ElevenLabs Turbo v2.5 - Balanced speed/quality
    pub const ELEVENLABS_TURBO: &'static str = "eleven_turbo_v2_5";

    /// ElevenLabs Voice Cloning
    pub const ELEVENLABS_CLONE: &'static str = "voice_clone";

    /// ElevenLabs Sound Effects
    pub const ELEVENLABS_SFX: &'static str = "sound_effects";

    // ══════════════════════════════════════════════════════════════════════════
    // AVATAR & LIPSYNC
    // ══════════════════════════════════════════════════════════════════════════

    /// Creatify Aurora - Studio quality avatars
    pub const CREATIFY_AURORA: &'static str = "fal-ai/creatify/aurora";

    /// VEED Fabric - Image to talking video
    pub const VEED_FABRIC: &'static str = "veed/fabric-1.0";

    /// ByteDance OmniHuman v1.5 - Expressive avatars
    pub const OMNIHUMAN_V15: &'static str = "fal-ai/bytedance/omnihuman/v1.5";

    /// AI Avatar Single Text - Text to talking avatar
    pub const AI_AVATAR_TEXT: &'static str = "fal-ai/ai-avatar/single-text";

    /// Sync Lipsync v2 - Lipsync animations
    pub const SYNC_LIPSYNC_V2: &'static str = "fal-ai/sync-lipsync/v2";

    /// PixVerse Lipsync
    pub const PIXVERSE_LIPSYNC: &'static str = "fal-ai/pixverse/lipsync";

    /// Kling AI Avatar
    pub const KLING_AVATAR: &'static str = "fal-ai/kling-video/v1/pro/ai-avatar";

    // ══════════════════════════════════════════════════════════════════════════
    // 3D GENERATION
    // ══════════════════════════════════════════════════════════════════════════

    /// Seed3D - ByteDance (high-quality image to 3D)
    pub const SEED3D: &'static str = "fal-ai/bytedance/seed3d/image-to-3d";

    /// TRELLIS - Best all-around 3D (Replicate recommended)
    /// https://replicate.com/firtoz/trellis
    pub const TRELLIS: &'static str = "firtoz/trellis";

    /// Meshy v4 - Fast text/image to 3D
    /// https://www.meshy.ai
    pub const MESHY_T2M: &'static str = "meshy/text-to-3d";
    pub const MESHY_I2M: &'static str = "meshy/image-to-3d";

    /// Rodin - High-quality human/character 3D
    /// https://fal.ai
    pub const RODIN: &'static str = "fal-ai/rodin";

    // ══════════════════════════════════════════════════════════════════════════
    // UPSCALING & RESTORATION
    // ══════════════════════════════════════════════════════════════════════════

    /// Topaz - Professional upscaling
    pub const TOPAZ_UPSCALE_IMAGE: &'static str = "fal-ai/topaz/upscale/image";
    pub const TOPAZ_UPSCALE_VIDEO: &'static str = "fal-ai/topaz/upscale/video";

    /// Crystal Upscaler - Portrait/face optimized (Clarity AI)
    pub const CRYSTAL_UPSCALER: &'static str = "philz1337x/crystal-upscaler";

    /// Google Upscaler
    pub const GOOGLE_UPSCALER: &'static str = "google/upscaler";

    /// GFPGAN - Face restoration for old photos/AI faces
    pub const GFPGAN: &'static str = "tencentarc/gfpgan";

    // ══════════════════════════════════════════════════════════════════════════
    // UTILITY
    // ══════════════════════════════════════════════════════════════════════════

    /// Bria Background Removal
    pub const BRIA_BG_REMOVE: &'static str = "fal-ai/bria/background/remove";
    pub const BRIA_VIDEO_BG_REMOVE: &'static str = "bria/video/background-removal";

    /// CLIP Features - Image embeddings
    pub const CLIP_FEATURES: &'static str = "andreasjansson/clip-features";

    /// NSFW Detection
    pub const NSFW_FILTER: &'static str = "fal-ai/x-ailab/nsfw";

    // ══════════════════════════════════════════════════════════════════════════
    // TRAINING
    // ══════════════════════════════════════════════════════════════════════════

    /// FLUX LoRA Trainers
    pub const FLUX_LORA_PORTRAIT_TRAINER: &'static str = "fal-ai/flux-lora-portrait-trainer";
    pub const FLUX_LORA_FAST_TRAINER: &'static str = "fal-ai/flux-lora-fast-training";
    pub const FLUX_KONTEXT_TRAINER: &'static str = "fal-ai/flux-kontext-trainer";

    /// Wan LoRA Trainer
    pub const WAN_TRAINER: &'static str = "fal-ai/wan-trainer/t2v-14b";

    /// Qwen Image Trainer
    pub const QWEN_IMAGE_TRAINER: &'static str = "fal-ai/qwen-image-trainer";

    // ══════════════════════════════════════════════════════════════════════════
    // LLM MODELS - GOOGLE AI (Vertex AI / Gemini API)
    // API Docs: https://ai.google.dev/gemini-api/docs
    // ══════════════════════════════════════════════════════════════════════════

    /// Gemini 3 Pro - Most intelligent, best multimodal reasoning
    pub const GEMINI_3_PRO: &'static str = "gemini-3-pro";

    /// Gemini 2.5 Flash - Fast, 1M token context
    pub const GEMINI_25_FLASH: &'static str = "gemini-2.5-flash";

    /// Gemini 2.5 Flash-Lite - Fastest, cost-efficient
    pub const GEMINI_25_FLASH_LITE: &'static str = "gemini-2.5-flash-lite";

    /// Gemini 2.5 Pro - Complex reasoning, coding
    pub const GEMINI_25_PRO: &'static str = "gemini-2.5-pro";

    /// Gemini 2.5 Pro TTS - Native text-to-speech
    pub const GEMINI_25_PRO_TTS: &'static str = "gemini-2.5-pro-tts";

    // ══════════════════════════════════════════════════════════════════════════
    // LLM MODELS - GOOGLE GEMMA (Open Source, Local)
    // HuggingFace: https://huggingface.co/google/gemma-3
    // ══════════════════════════════════════════════════════════════════════════

    /// Gemma 3 - Multimodal, wide language support
    pub const GEMMA_3: &'static str = "google/gemma-3";

    /// Gemma 3n - Mobile-first, low-latency audio/visual
    pub const GEMMA_3N: &'static str = "google/gemma-3n";

    /// CodeGemma - Code generation specialist
    pub const CODE_GEMMA: &'static str = "google/codegemma";

    /// PaliGemma 2 - Vision-language model
    pub const PALI_GEMMA_2: &'static str = "google/paligemma-2";

    // ══════════════════════════════════════════════════════════════════════════
    // GOOGLE AI MUSIC - LYRIA 2
    // Docs: https://deepmind.google/models/lyria
    // ══════════════════════════════════════════════════════════════════════════

    /// Lyria 2 - High-fidelity music generation (48kHz stereo)
    pub const LYRIA_2: &'static str = "lyria-2";

    /// Lyria RealTime - Interactive real-time music
    pub const LYRIA_REALTIME: &'static str = "lyria-realtime";

    // ══════════════════════════════════════════════════════════════════════════
    // GOOGLE AI ON-DEVICE (MediaPipe / Gemini Nano)
    // Docs: https://ai.google.dev/edge/
    // ══════════════════════════════════════════════════════════════════════════

    /// Gemini Nano - On-device for Android/Chrome
    pub const GEMINI_NANO: &'static str = "gemini-nano";

    /// MediaPipe Face Mesh - Real-time face detection
    pub const MEDIAPIPE_FACE_MESH: &'static str = "mediapipe/face-mesh";

    /// MediaPipe Pose - Body pose estimation
    pub const MEDIAPIPE_POSE: &'static str = "mediapipe/pose";

    /// MediaPipe Object Detection
    pub const MEDIAPIPE_OBJECT: &'static str = "mediapipe/object-detection";

    // ══════════════════════════════════════════════════════════════════════════
    // GOOGLE CLOUD AI APIS
    // ══════════════════════════════════════════════════════════════════════════

    /// Video Intelligence API - Scene detection, labeling
    pub const VIDEO_INTELLIGENCE: &'static str = "video-intelligence-api";

    /// Vision AI - Image analysis
    pub const VISION_AI: &'static str = "cloud-vision-api";

    // ══════════════════════════════════════════════════════════════════════════
    // LLM MODELS - OTHER PROVIDERS
    // ══════════════════════════════════════════════════════════════════════════

    /// GPT-5.1 - OpenAI (via Replicate)
    pub const GPT_51: &'static str = "openai/gpt-5.1";

    /// Claude Opus 4.5 - Anthropic
    pub const CLAUDE_OPUS: &'static str = "anthropic/claude-opus-4.5";

    /// Claude Sonnet 4.5 - Anthropic (faster)
    pub const CLAUDE_SONNET: &'static str = "anthropic/claude-sonnet-4.5";

    /// Llama 4 Maverick - Meta (local)
    pub const LLAMA_4_MAVERICK: &'static str = "meta-llama/llama-4-maverick";

    /// Qwen 3 Max - Alibaba
    pub const QWEN_3_MAX: &'static str = "qwen/qwen-3-max";
}

/// Download a model via comfy-cli
pub async fn download_model(
    install_path: &PathBuf,
    model_url: &str,
    destination: &str,
) -> Result<(), AppError> {
    let output = Command::new("uv")
        .args(["run", "comfy", "model", "download", model_url, destination])
        .current_dir(install_path)
        .output()
        .map_err(|e| AppError::ModelDownload(format!("Failed to download model: {}", e)))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::ModelDownload(format!("Download failed: {}", err)));
    }

    Ok(())
}

/// Download all essential models for local ComfyUI
pub async fn download_essential_models(install_path: &PathBuf) -> Result<(), AppError> {
    for (name, url, category) in EssentialModels::all_local() {
        println!("📥 Downloading {}...", name);
        download_model(install_path, url, category.folder_name()).await?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_essential_models() {
        let models = EssentialModels::all_local();
        assert!(!models.is_empty());
        assert_eq!(models[0].0, "FLUX.1 Schnell");
    }

    #[test]
    fn test_cloud_models() {
        assert_eq!(CloudModels::VEO_31, "fal-ai/veo3.1");
        assert_eq!(CloudModels::SORA_2_PRO, "fal-ai/sora-2/text-to-video/pro");
        assert_eq!(
            CloudModels::KLING_V26_T2V,
            "fal-ai/kling-video/v2.6/pro/text-to-video"
        );
    }

    #[test]
    fn test_model_categories() {
        assert_eq!(
            ModelCategory::Checkpoint.folder_name(),
            "models/checkpoints"
        );
        assert_eq!(ModelCategory::Lora.folder_name(), "models/loras");
    }
}
