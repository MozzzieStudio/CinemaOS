//! ComfyUI Orchestration Engine
//!
//! ComfyUI is the CENTRAL orchestration layer for CinemaOS:
//! - All generation (image, video, audio, 3D) goes through ComfyUI workflows
//! - Custom nodes wrap cloud providers (Fal.ai, Vertex AI) and local models
//! - Workflows are portable between local and cloud execution
//!
//! ## Model Support (December 2025)
//!
//! ### Cloud (via Fal.ai Serverless)
//! - **Image**: FLUX.2, Nano Banana Pro, Imagen 4
//! - **Video**: Veo 3.1, Sora 2, Kling v2.6 (all with native audio)
//! - **Audio**: Lyria 2, Beatoven, ElevenLabs
//! - **3D**: Meshy
//!
//! ### Local (ComfyUI Native)
//! - **Image**: FLUX.2 Schnell/Dev
//! - **Video**: LTX Video 13B, Wan 2.2
//!
//! For low-latency tasks (chat, quick LLM responses), use the Fast Path
//! which bypasses ComfyUI and calls providers directly.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Execution path for AI requests
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum ExecutionPath {
    /// Low-latency path for text/chat (bypasses ComfyUI)
    FastPath { provider: String, model_id: String },
    /// Full workflow path through ComfyUI
    WorkflowPath {
        workflow_id: String,
        execution_target: WorkflowTarget,
    },
}

/// Where to execute a ComfyUI workflow
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum WorkflowTarget {
    /// Run on user's local ComfyUI instance
    Local,
    /// Run on CinemaOS cloud (Fal.ai serverless)
    Cloud,
    /// Hybrid: heavy compute on cloud, post-processing local
    Hybrid,
}

/// Custom node types for CinemaOS workflows
/// Updated December 2025 with latest Fal.ai models
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CinemaOSNode {
    // ══════════════════════════════════════════════════════════════════════════
    // IMAGE GENERATION (Fal.ai Cloud)
    // ══════════════════════════════════════════════════════════════════════════
    /// FLUX.2 - Black Forest Labs (default image model)
    FalFlux2 {
        prompt: String,
        width: u32,
        height: u32,
        num_inference_steps: u32,
        guidance_scale: f32,
    },

    /// Nano Banana Pro - Google's image gen/edit
    FalNanoBananaPro {
        prompt: String,
        image_url: Option<String>,
        edit_mode: bool,
    },

    /// FLUX Kontext - Multi-image editing
    FalFluxKontext {
        prompt: String,
        reference_images: Vec<String>,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // VIDEO GENERATION (Fal.ai Cloud) - All support native audio
    // ══════════════════════════════════════════════════════════════════════════
    /// Veo 3.1 - Google DeepMind (state-of-the-art, native audio)
    FalVeo31 {
        prompt: String,
        duration_seconds: f32,
        with_audio: bool,
        image_url: Option<String>,
    },

    /// Sora 2 Pro - OpenAI (premium quality, native audio)
    FalSora2Pro {
        prompt: String,
        with_audio: bool,
        image_url: Option<String>,
    },

    /// Kling v2.6 - Kuaishou (cinematic, native audio)
    FalKlingV26 {
        prompt: String,
        duration_seconds: f32,
        with_audio: bool,
        image_url: Option<String>,
    },

    /// Kling v2.5 Turbo - Fast cinematic
    FalKlingV25Turbo {
        prompt: String,
        image_url: Option<String>,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // AUDIO GENERATION (Fal.ai + External)
    // ══════════════════════════════════════════════════════════════════════════
    /// Beatoven - Royalty-free music generation
    FalBeatovenMusic {
        prompt: String,
        genre: String,
        duration_seconds: f32,
    },

    /// Beatoven SFX - Sound effects
    FalBeatovenSfx { description: String },

    /// ElevenLabs TTS - Voice synthesis
    ElevenLabsTts {
        text: String,
        voice_id: String,
        model: String, // v3, flash_v2.5, turbo_v2.5
    },

    // ══════════════════════════════════════════════════════════════════════════
    // AVATAR & LIPSYNC (Fal.ai Cloud)
    // ══════════════════════════════════════════════════════════════════════════
    /// Creatify Aurora - Studio quality avatars
    FalCreatifyAurora {
        image_url: String,
        audio_url: String,
    },

    /// OmniHuman v1.5 - Expressive avatars
    FalOmniHuman {
        image_url: String,
        audio_url: String,
    },

    /// Sync Lipsync v2
    FalSyncLipsync {
        video_url: String,
        audio_url: String,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // LOCAL MODELS (ComfyUI Native)
    // ══════════════════════════════════════════════════════════════════════════
    /// Local FLUX.2 Schnell (4-step fast)
    LocalFlux2Schnell {
        prompt: String,
        width: u32,
        height: u32,
    },

    /// Local LTX Video 13B
    LocalLtxVideo {
        prompt: String,
        image_url: Option<String>,
    },

    /// Local Wan 2.2
    LocalWan22 {
        prompt: String,
        image_url: Option<String>,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // UTILITY NODES
    // ══════════════════════════════════════════════════════════════════════════
    /// Topaz Upscaler (image/video)
    FalTopazUpscale {
        media_url: String,
        scale: f32,
        is_video: bool,
    },

    /// Bria Background Removal
    FalBriaRemoveBg { image_url: String },

    /// Color Grading
    ColorGrade {
        lut_id: Option<String>,
        params_json: String,
    },

    /// SAM 3 Segmentation
    Segment {
        mode: String, // "auto", "point", "box"
        image_url: String,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // VAULT INTEGRATION
    // ══════════════════════════════════════════════════════════════════════════
    /// Load context from Vault tokens
    VaultContext { token_ids: Vec<String> },

    /// Save output to Vault
    VaultSave {
        asset_type: String,
        token_id: Option<String>,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // GENERIC PROVIDER NODES (legacy compatibility)
    // ══════════════════════════════════════════════════════════════════════════
    FalInference {
        model_id: String,
        params_json: String,
    },
    VertexInference {
        model_id: String,
        params_json: String,
    },
    LocalInference {
        model_id: String,
        params_json: String,
    },
}

/// A ComfyUI workflow definition
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub description: String,
    pub nodes: Vec<WorkflowNode>,
    pub connections: Vec<NodeConnection>,
    pub local_compatible: bool,
    pub requires_credits: bool,
    /// Estimated cost per execution (USD)
    pub estimated_cost: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct WorkflowNode {
    pub id: String,
    pub node_type: String,
    pub params_json: String,
    pub position_x: f32,
    pub position_y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct NodeConnection {
    pub from_node: String,
    pub from_output: String,
    pub to_node: String,
    pub to_input: String,
}

/// Determine which execution path to use
pub fn determine_execution_path(
    task_type: &str,
    model_id: &str,
    prefer_local: bool,
) -> ExecutionPath {
    // Fast Path: LLM chat and quick text generation
    let is_fast_path_task = matches!(
        task_type,
        "chat" | "quick_text" | "translate" | "summarize" | "completion" | "script"
    );

    if is_fast_path_task {
        let provider = crate::ai::providers::get_provider_for_model(model_id);
        return ExecutionPath::FastPath {
            provider: format!("{:?}", provider),
            model_id: model_id.to_string(),
        };
    }

    // Workflow Path: All generation tasks
    let target = if prefer_local {
        // Check if model supports local execution
        let local_models = ["flux.2-schnell", "ltx-video", "wan-2.2", "flux-dev"];
        if local_models
            .iter()
            .any(|m| model_id.to_lowercase().contains(m))
        {
            WorkflowTarget::Local
        } else {
            WorkflowTarget::Hybrid // Cloud gen, local post-processing
        }
    } else {
        WorkflowTarget::Cloud
    };

    let workflow_id = match task_type {
        // Image workflows
        "image" | "concept_art" => "flux2_turbo_v1",
        "image_edit" | "inpaint" => "image_edit_kontext_v1",
        "upscale" => "topaz_upscale_v1",

        // Video workflows
        "video" | "shot" => "veo31_cinematic_v1",
        "video_fast" => "kling_turbo_v1",
        "image_to_video" | "i2v" => "i2v_kling_v1",

        // Audio workflows
        "voice" | "tts" => "elevenlabs_v3_v1",
        "music" => "beatoven_music_v1",
        "sfx" => "beatoven_sfx_v1",

        // Avatar workflows
        "avatar" | "lipsync" => "omnihuman_avatar_v1",

        // Other
        "3d" | "model" => "meshy_3d_v1",
        "segment" | "mask" => "sam3_segment_v1",

        _ => "generic_v1",
    };

    ExecutionPath::WorkflowPath {
        workflow_id: workflow_id.to_string(),
        execution_target: target,
    }
}

/// Get predefined workflow templates - Updated December 2025
pub fn get_workflow_template(workflow_id: &str) -> Option<Workflow> {
    match workflow_id {
        // ═══════════════════════════════════════════════════════════════════════
        // IMAGE WORKFLOWS
        // ═══════════════════════════════════════════════════════════════════════
        "flux2_turbo_v1" => Some(Workflow {
            id: "flux2_turbo_v1".into(),
            name: "FLUX.2 Turbo Image".into(),
            description: "4-step ultra-fast image generation".into(),
            nodes: vec![WorkflowNode {
                id: "flux2".into(),
                node_type: "FalFlux2".into(),
                params_json: r#"{"num_inference_steps": 4, "guidance_scale": 1.0}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: true,
            requires_credits: false,
            estimated_cost: 0.003,
        }),

        "text_to_image_v1" => Some(Workflow {
            id: "text_to_image_v1".into(),
            name: "Text to Image".into(),
            description: "High quality image generation with FLUX.2".into(),
            nodes: vec![WorkflowNode {
                id: "flux2".into(),
                node_type: "FalFlux2".into(),
                params_json: r#"{"num_inference_steps": 28, "guidance_scale": 3.5}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: true,
            requires_credits: false,
            estimated_cost: 0.01,
        }),

        // ═══════════════════════════════════════════════════════════════════════
        // VIDEO WORKFLOWS
        // ═══════════════════════════════════════════════════════════════════════
        "veo31_cinematic_v1" => Some(Workflow {
            id: "veo31_cinematic_v1".into(),
            name: "Veo 3.1 Cinematic".into(),
            description: "State-of-the-art video with native audio (Google DeepMind)".into(),
            nodes: vec![WorkflowNode {
                id: "veo31".into(),
                node_type: "FalVeo31".into(),
                params_json: r#"{"duration_seconds": 5.0, "with_audio": true}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: false,
            requires_credits: true,
            estimated_cost: 0.25, // ~$0.05/sec * 5 sec
        }),

        "kling_turbo_v1" => Some(Workflow {
            id: "kling_turbo_v1".into(),
            name: "Kling v2.5 Turbo".into(),
            description: "Fast cinematic video generation".into(),
            nodes: vec![WorkflowNode {
                id: "kling".into(),
                node_type: "FalKlingV25Turbo".into(),
                params_json: r#"{}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: false,
            requires_credits: true,
            estimated_cost: 0.15,
        }),

        "i2v_kling_v1" => Some(Workflow {
            id: "i2v_kling_v1".into(),
            name: "Image to Video (Kling)".into(),
            description: "Animate images with Kling v2.6 + native audio".into(),
            nodes: vec![WorkflowNode {
                id: "kling26".into(),
                node_type: "FalKlingV26".into(),
                params_json: r#"{"duration_seconds": 5.0, "with_audio": true}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: false,
            requires_credits: true,
            estimated_cost: 0.55, // ~$0.11/sec * 5 sec
        }),

        // ═══════════════════════════════════════════════════════════════════════
        // AUDIO WORKFLOWS
        // ═══════════════════════════════════════════════════════════════════════
        "beatoven_music_v1" => Some(Workflow {
            id: "beatoven_music_v1".into(),
            name: "Beatoven Music".into(),
            description: "Royalty-free instrumental music generation".into(),
            nodes: vec![WorkflowNode {
                id: "music".into(),
                node_type: "FalBeatovenMusic".into(),
                params_json: r#"{"genre": "cinematic", "duration_seconds": 30.0}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: false,
            requires_credits: true,
            estimated_cost: 0.10,
        }),

        "elevenlabs_v3_v1" => Some(Workflow {
            id: "elevenlabs_v3_v1".into(),
            name: "ElevenLabs v3 TTS".into(),
            description: "High-quality voice synthesis with emotional range".into(),
            nodes: vec![WorkflowNode {
                id: "tts".into(),
                node_type: "ElevenLabsTts".into(),
                params_json: r#"{"model": "v3"}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: false,
            requires_credits: true,
            estimated_cost: 0.05,
        }),

        // ═══════════════════════════════════════════════════════════════════════
        // AVATAR WORKFLOWS
        // ═══════════════════════════════════════════════════════════════════════
        "omnihuman_avatar_v1" => Some(Workflow {
            id: "omnihuman_avatar_v1".into(),
            name: "OmniHuman Avatar".into(),
            description: "Expressive talking avatar from image + audio".into(),
            nodes: vec![WorkflowNode {
                id: "avatar".into(),
                node_type: "FalOmniHuman".into(),
                params_json: r#"{}"#.into(),
                position_x: 0.0,
                position_y: 0.0,
            }],
            connections: vec![],
            local_compatible: false,
            requires_credits: true,
            estimated_cost: 0.20,
        }),

        _ => None,
    }
}

/// Get all available workflow templates
pub fn get_all_workflow_templates() -> Vec<Workflow> {
    let ids = [
        "flux2_turbo_v1",
        "text_to_image_v1",
        "veo31_cinematic_v1",
        "kling_turbo_v1",
        "i2v_kling_v1",
        "beatoven_music_v1",
        "elevenlabs_v3_v1",
        "omnihuman_avatar_v1",
    ];

    ids.iter()
        .filter_map(|id| get_workflow_template(id))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execution_path_routing() {
        // Chat should use Fast Path
        let path = determine_execution_path("chat", "gemini-3-pro", false);
        assert!(matches!(path, ExecutionPath::FastPath { .. }));

        // Image generation should use Workflow Path
        let path = determine_execution_path("image", "flux.2", false);
        assert!(matches!(path, ExecutionPath::WorkflowPath { .. }));

        // Video generation with prefer_local should use Hybrid (cloud model)
        let path = determine_execution_path("video", "veo-3.1", true);
        assert!(matches!(
            path,
            ExecutionPath::WorkflowPath {
                execution_target: WorkflowTarget::Hybrid,
                ..
            }
        ));

        // Local model should use Local target
        let path = determine_execution_path("image", "flux.2-schnell", true);
        assert!(matches!(
            path,
            ExecutionPath::WorkflowPath {
                execution_target: WorkflowTarget::Local,
                ..
            }
        ));
    }

    #[test]
    fn test_workflow_templates() {
        let workflow = get_workflow_template("veo31_cinematic_v1");
        assert!(workflow.is_some());
        let w = workflow.unwrap();
        assert!(w.requires_credits);
        assert!(!w.local_compatible);

        let all = get_all_workflow_templates();
        assert!(all.len() >= 5);
    }

    #[test]
    fn test_video_workflows_have_audio() {
        let veo = get_workflow_template("veo31_cinematic_v1").unwrap();
        assert!(veo.nodes[0].params_json.contains("with_audio"));

        let kling = get_workflow_template("i2v_kling_v1").unwrap();
        assert!(kling.nodes[0].params_json.contains("with_audio"));
    }
}
