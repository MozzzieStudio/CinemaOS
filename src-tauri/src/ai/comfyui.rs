//! ComfyUI Orchestration Engine
//!
//! ComfyUI is the CENTRAL orchestration layer for CinemaOS:
//! - All generation (image, video, audio, 3D) goes through ComfyUI workflows
//! - Custom nodes wrap cloud providers (Fal, Vertex) and local models
//! - Workflows are portable between local and cloud execution
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
    /// Run on CinemaOS cloud (Fal.ai serverless ComfyUI)
    Cloud,
}

/// Custom node types for CinemaOS workflows (simplified for Specta compatibility)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum CinemaOSNode {
    // ── Provider Nodes ──
    FalInference {
        model_id: String,
        params_json: String, // JSON-encoded params
    },
    VertexInference {
        model_id: String,
        params_json: String,
    },
    LocalInference {
        model_id: String,
        params_json: String,
    },

    // ── Vault Integration ──
    VaultContext {
        token_ids: Vec<String>,
    },
    VaultSave {
        asset_type: String,
    },

    // ── Media Processing ──
    Upscale {
        scale: f32,
    },
    ColorGrade {
        lut_id: Option<String>,
    },
    Segment {
        mode: String,
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
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct WorkflowNode {
    pub id: String,
    pub node_type: String,
    pub params_json: String, // JSON-encoded params
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
        "chat" | "quick_text" | "translate" | "summarize" | "completion"
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
        WorkflowTarget::Local
    } else {
        WorkflowTarget::Cloud
    };

    let workflow_id = match task_type {
        "image" | "concept_art" => "text_to_image_v1",
        "video" | "shot" => "text_to_video_v1",
        "image_edit" | "inpaint" => "image_edit_v1",
        "upscale" => "upscale_v1",
        "voice" | "tts" => "text_to_speech_v1",
        "music" | "sfx" => "music_generation_v1",
        "3d" | "model" => "text_to_3d_v1",
        "segment" | "mask" => "segmentation_v1",
        _ => "generic_v1",
    };

    ExecutionPath::WorkflowPath {
        workflow_id: workflow_id.to_string(),
        execution_target: target,
    }
}

/// Get predefined workflow templates
pub fn get_workflow_template(workflow_id: &str) -> Option<Workflow> {
    match workflow_id {
        "text_to_image_v1" => Some(Workflow {
            id: "text_to_image_v1".into(),
            name: "Text to Image".into(),
            description: "Generate images from text prompts".into(),
            nodes: vec![
                WorkflowNode {
                    id: "prompt".into(),
                    node_type: "CLIPTextEncode".into(),
                    params_json: "{}".into(),
                    position_x: 0.0,
                    position_y: 0.0,
                },
                WorkflowNode {
                    id: "sampler".into(),
                    node_type: "KSampler".into(),
                    params_json: r#"{"steps": 20, "cfg": 7.0}"#.into(),
                    position_x: 200.0,
                    position_y: 0.0,
                },
                WorkflowNode {
                    id: "decode".into(),
                    node_type: "VAEDecode".into(),
                    params_json: "{}".into(),
                    position_x: 400.0,
                    position_y: 0.0,
                },
            ],
            connections: vec![
                NodeConnection {
                    from_node: "prompt".into(),
                    from_output: "CONDITIONING".into(),
                    to_node: "sampler".into(),
                    to_input: "positive".into(),
                },
                NodeConnection {
                    from_node: "sampler".into(),
                    from_output: "LATENT".into(),
                    to_node: "decode".into(),
                    to_input: "samples".into(),
                },
            ],
            local_compatible: true,
            requires_credits: false,
        }),
        _ => None,
    }
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

        // Video generation with prefer_local should use Local target
        let path = determine_execution_path("video", "veo-3.1", true);
        assert!(matches!(
            path,
            ExecutionPath::WorkflowPath {
                execution_target: WorkflowTarget::Local,
                ..
            }
        ));
    }

    #[test]
    fn test_workflow_template() {
        let workflow = get_workflow_template("text_to_image_v1");
        assert!(workflow.is_some());
        let w = workflow.unwrap();
        assert_eq!(w.nodes.len(), 3);
        assert_eq!(w.connections.len(), 2);
    }
}
