//! Tauri Commands for Workflow Generation
//!
//! Exposes workflow generation to frontend

use crate::ai::{
    generate_workflow, parse_agent_request, GeneratedWorkflow, WorkflowRequest, WorkflowType,
};

/// Generate a workflow from a request
#[tauri::command]
#[specta::specta]
pub fn generate_comfyui_workflow(
    prompt: String,
    model: String,
    width: u32,
    height: u32,
    workflow_type: String,
) -> GeneratedWorkflow {
    let wf_type = match workflow_type.as_str() {
        "text_to_image" | "t2i" => WorkflowType::TextToImage,
        "image_to_image" | "i2i" => WorkflowType::ImageToImage,
        "text_to_video" | "t2v" => WorkflowType::TextToVideo,
        "image_to_video" | "i2v" => WorkflowType::ImageToVideo,
        _ => WorkflowType::TextToImage,
    };

    let request = WorkflowRequest {
        workflow_type: wf_type,
        prompt,
        negative_prompt: None,
        model,
        width,
        height,
        steps: None,
        cfg_scale: None,
        seed: None,
        input_image: None,
        token_context: None,
    };

    generate_workflow(&request)
}

/// Generate workflow from agent's natural language output
#[tauri::command]
#[specta::specta]
pub fn generate_workflow_from_agent(agent_output: String) -> Option<GeneratedWorkflow> {
    parse_agent_request(&agent_output).map(|req| generate_workflow(&req))
}
