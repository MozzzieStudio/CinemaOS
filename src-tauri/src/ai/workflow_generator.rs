//! Workflow Generator - Connects Agents to ComfyUI
//!
//! Generates ComfyUI workflow JSON based on agent requests.

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use specta::Type;

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum WorkflowType {
    TextToImage,
    ImageToImage,
    TextToVideo,
    ImageToVideo,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct WorkflowRequest {
    pub workflow_type: WorkflowType,
    pub prompt: String,
    pub negative_prompt: Option<String>,
    pub model: String,
    pub width: u32,
    pub height: u32,
    pub steps: Option<u32>,
    pub cfg_scale: Option<f32>,
    pub seed: Option<i64>,
    pub input_image: Option<String>,
    pub token_context: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GeneratedWorkflow {
    pub workflow_json: String,
    pub estimated_credits: f32,
    pub is_local: bool,
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/// Generate a ComfyUI workflow JSON from a request
pub fn generate_workflow(request: &WorkflowRequest) -> GeneratedWorkflow {
    // Determine if we should use local or cloud
    let is_local = is_local_model(&request.model);

    let workflow = if is_local {
        generate_local_workflow(request)
    } else {
        generate_cloud_workflow(request)
    };

    let estimated_credits = estimate_credits(request, is_local);

    GeneratedWorkflow {
        workflow_json: serde_json::to_string_pretty(&workflow).unwrap_or_default(),
        estimated_credits,
        is_local,
    }
}

fn is_local_model(model: &str) -> bool {
    // Check if model is local (downloaded) or cloud-only
    matches!(
        model.to_lowercase().as_str(),
        "sdxl" | "flux-local" | "sd15" | "sd21"
    )
}

fn estimate_credits(request: &WorkflowRequest, is_local: bool) -> f32 {
    if is_local {
        return 0.0;
    }

    let base_cost = match request.model.as_str() {
        "flux-pro" => 0.05,
        "flux-schnell" => 0.003,
        "imagen-3" => 0.04,
        "kling" => 0.112,
        _ => 0.01,
    };

    // Scale by resolution
    let pixels = request.width * request.height;
    let scale = pixels as f32 / (1024.0 * 1024.0);

    base_cost * scale
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL WORKFLOW TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

fn generate_local_workflow(request: &WorkflowRequest) -> Value {
    match request.workflow_type {
        WorkflowType::TextToImage => generate_t2i_local(request),
        WorkflowType::ImageToImage => generate_i2i_local(request),
        _ => generate_t2i_local(request), // Fallback
    }
}

fn generate_t2i_local(request: &WorkflowRequest) -> Value {
    let seed = request.seed.unwrap_or(-1);
    let steps = request.steps.unwrap_or(20);
    let cfg = request.cfg_scale.unwrap_or(7.0);

    json!({
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "cfg": cfg,
                "denoise": 1.0,
                "latent_image": ["5", 0],
                "model": ["4", 0],
                "negative": ["7", 0],
                "positive": ["6", 0],
                "sampler_name": "euler",
                "scheduler": "normal",
                "seed": seed,
                "steps": steps
            }
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": format!("{}.safetensors", request.model)
            }
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "batch_size": 1,
                "height": request.height,
                "width": request.width
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["4", 1],
                "text": request.prompt
            }
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["4", 1],
                "text": request.negative_prompt.as_deref().unwrap_or("")
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "CinemaOS",
                "images": ["8", 0]
            }
        }
    })
}

fn generate_i2i_local(request: &WorkflowRequest) -> Value {
    // Similar to t2i but with image input
    // Simplified for now
    generate_t2i_local(request)
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLOUD WORKFLOW TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

fn generate_cloud_workflow(request: &WorkflowRequest) -> Value {
    match request.workflow_type {
        WorkflowType::TextToImage => generate_t2i_cloud(request),
        WorkflowType::ImageToVideo => generate_i2v_cloud(request),
        _ => generate_t2i_cloud(request),
    }
}

fn generate_t2i_cloud(request: &WorkflowRequest) -> Value {
    // Cloud workflow uses our custom FalProvider node
    json!({
        "1": {
            "class_type": "FalProvider",
            "inputs": {
                "prompt": request.prompt,
                "model": request.model,
                "width": request.width,
                "height": request.height,
                "negative_prompt": request.negative_prompt.as_deref().unwrap_or(""),
                "seed": request.seed.unwrap_or(-1),
                "num_steps": request.steps.unwrap_or(28),
                "guidance_scale": request.cfg_scale.unwrap_or(7.5)
            }
        },
        "2": {
            "class_type": "CreditTracker",
            "inputs": {
                "credits_used": ["1", 1],
                "model_name": request.model
            }
        },
        "3": {
            "class_type": "VaultSave",
            "inputs": {
                "image": ["1", 0],
                "token_type": "shot",
                "token_name": ""
            }
        }
    })
}

fn generate_i2v_cloud(request: &WorkflowRequest) -> Value {
    json!({
        "1": {
            "class_type": "FalProvider",
            "inputs": {
                "prompt": request.prompt,
                "model": "kling-i2v",
                "width": request.width,
                "height": request.height,
                "input_image": request.input_image
            }
        },
        "2": {
            "class_type": "CreditTracker",
            "inputs": {
                "credits_used": ["1", 1],
                "model_name": "kling-i2v"
            }
        }
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/// Convert an agent's text request to a workflow request
pub fn parse_agent_request(agent_output: &str) -> Option<WorkflowRequest> {
    // Try to parse as JSON first
    if let Ok(request) = serde_json::from_str::<WorkflowRequest>(agent_output) {
        return Some(request);
    }

    // Otherwise, try to extract from natural language
    // This is a simplified version - in production, we'd use NLP
    let prompt = agent_output.to_string();

    Some(WorkflowRequest {
        workflow_type: WorkflowType::TextToImage,
        prompt,
        negative_prompt: None,
        model: "flux-schnell".into(),
        width: 1024,
        height: 1024,
        steps: None,
        cfg_scale: None,
        seed: None,
        input_image: None,
        token_context: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_local_workflow() {
        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToImage,
            prompt: "A cat".into(),
            negative_prompt: None,
            model: "sdxl".into(),
            width: 1024,
            height: 1024,
            steps: None,
            cfg_scale: None,
            seed: None,
            input_image: None,
            token_context: None,
        };

        let result = generate_workflow(&request);
        assert!(result.is_local);
        assert_eq!(result.estimated_credits, 0.0);
    }

    #[test]
    fn test_generate_cloud_workflow() {
        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToImage,
            prompt: "A dog".into(),
            negative_prompt: None,
            model: "flux-pro".into(),
            width: 1024,
            height: 1024,
            steps: None,
            cfg_scale: None,
            seed: None,
            input_image: None,
            token_context: None,
        };

        let result = generate_workflow(&request);
        assert!(!result.is_local);
        assert!(result.estimated_credits > 0.0);
    }
}
