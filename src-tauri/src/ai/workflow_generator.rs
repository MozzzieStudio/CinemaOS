//! Workflow Generator - Template Engine
//!
//! Generates ComfyUI workflow JSON by injecting values into templates.
//! Defines the "Neuro-System" payload structure.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;
use std::collections::HashMap;
use std::path::PathBuf;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
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
    pub model: String, // ID from models.rs
    pub width: u32,
    pub height: u32,
    pub steps: Option<u32>,
    pub seed: Option<i64>,
    pub input_image: Option<String>,
    pub force_local: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GeneratedWorkflow {
    pub workflow_json: String,
    pub estimated_cost: f64,
    pub is_local: bool,
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/// Load a template, inject variables, and return the JSON string
pub fn generate_workflow(request: &WorkflowRequest) -> Result<GeneratedWorkflow, String> {
    // 1. Determine Execution Mode (Local/Cloud)
    // In a real implementation this would call `router.rs`
    let is_local = request.force_local.unwrap_or(false);

    // 2. Select Template File
    let template_name = match request.workflow_type {
        WorkflowType::TextToImage => "t2i_flux.json",
        WorkflowType::ImageToImage => "t2i_flux.json", // Reuse with adapters? Or i2i.json
        WorkflowType::TextToVideo => "start_frame_init.json",
        WorkflowType::ImageToVideo => "i2v.json",
    };

    // 3. Load Template String
    let assets_path = crate::utils::get_resource_path("assets").unwrap_or(PathBuf::from("assets"));
    let template_path = assets_path.join("workflows").join(template_name);

    let template_str = std::fs::read_to_string(&template_path)
        .map_err(|e| format!("Failed to read template {}: {}", template_name, e))?;

    // 4. Prepare Variables
    let mut variables = HashMap::new();
    variables.insert("{{PROMPT}}".to_string(), request.prompt.clone());
    variables.insert(
        "{{NEGATIVE_PROMPT}}".to_string(),
        request.negative_prompt.clone().unwrap_or_default(),
    );
    variables.insert("{{WIDTH}}".to_string(), request.width.to_string());
    variables.insert("{{HEIGHT}}".to_string(), request.height.to_string());
    variables.insert(
        "{{SEED}}".to_string(),
        request.seed.unwrap_or(0).to_string(),
    );
    variables.insert(
        "{{STEPS}}".to_string(),
        request.steps.unwrap_or(20).to_string(),
    );

    // Model Filename Mapping (Should come from models.rs in strict mode)
    let model_filename = match request.model.as_str() {
        "flux-schnell" => "flux1-schnell.safetensors",
        "flux-dev" => "flux1-dev.safetensors",
        "sdxl" => "sd_xl_base_1.0.safetensors",
        _ => "flux1-schnell.safetensors",
    };
    variables.insert("{{MODEL_FILENAME}}".to_string(), model_filename.to_string());

    if let Some(img) = &request.input_image {
        variables.insert("{{INPUT_IMAGE}}".to_string(), img.clone());
    }

    // 5. Inject
    let mut final_json = template_str;
    for (key, value) in variables {
        final_json = final_json.replace(&key, &value);
    }

    // 6. Validate JSON
    let _valid_json: Value = serde_json::from_str(&final_json)
        .map_err(|e| format!("Template injection produced invalid JSON: {}", e))?;

    Ok(GeneratedWorkflow {
        workflow_json: final_json,
        estimated_cost: 0.0, // TODO: Implement cost calculator
        is_local,
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════════

// Placeholder for resource path - should exist in lib.rs or utils.rs
