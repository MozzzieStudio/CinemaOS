//! Tauri Commands for AI Model Matrix and Virtual Crew
//!
//! Exposes AI functionality to the frontend

use crate::ai::{
    agents::traits::AgentRole,
    local::{detect_hardware, HardwareCapabilities},
    models::{
        get_all_models, get_local_models, get_models_by_capability, ModelCapability,
        ModelDefinition,
    },
    router::{route_model_request, RouterDecision},
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get all available models
#[tauri::command]
#[specta::specta]
pub fn get_models() -> Vec<ModelDefinition> {
    tracing::debug!("Fetching all models");
    get_all_models()
}

/// Get models for a specific task type
#[tauri::command]
#[specta::specta]
pub fn get_models_for_task(task_type: String) -> Vec<ModelDefinition> {
    tracing::debug!("Fetching models for task: {}", task_type);

    let capability = match task_type.as_str() {
        "text" | "script" | "dialogue" => ModelCapability::TextGeneration,
        "image" | "concept_art" => ModelCapability::TextToImage,
        "video" | "shot" => ModelCapability::TextToVideo,
        "voice" | "tts" => ModelCapability::TextToSpeech,
        "transcription" | "stt" => ModelCapability::SpeechToText,
        "music" | "sfx" => ModelCapability::AudioGeneration,
        "segment" | "mask" => ModelCapability::Segmentation,
        _ => ModelCapability::TextGeneration,
    };

    get_models_by_capability(capability)
}

/// Get only local (free) models
#[tauri::command]
#[specta::specta]
pub fn get_free_models() -> Vec<ModelDefinition> {
    tracing::debug!("Fetching local models");
    get_local_models()
}

/// Detect hardware capabilities
#[tauri::command]
#[specta::specta]
pub fn get_hardware_capabilities() -> HardwareCapabilities {
    tracing::info!("Detecting hardware capabilities");
    detect_hardware()
}

/// Route a model request (check if local or cloud)
#[tauri::command]
#[specta::specta]
pub fn route_request(model_id: String, prefer_local: bool) -> Result<RouterDecision, String> {
    tracing::info!(
        "Routing request for model: {}, prefer_local: {}",
        model_id,
        prefer_local
    );

    // In the new router, we route based on Capability + Preference
    // We first need to find the model capability to route correctly
    let all = get_all_models();
    let model = all
        .iter()
        .find(|m| m.id == model_id)
        .ok_or_else(|| format!("Model {} not found", model_id))?;

    // Use the model's primary capability
    let cap = model
        .capabilities
        .first()
        .cloned()
        .unwrap_or(ModelCapability::TextGeneration);

    route_model_request(cap, Some(model_id), prefer_local)
}

/// Get models that can run on current hardware
#[tauri::command]
#[specta::specta]
pub fn get_available_local_models() -> Vec<ModelDefinition> {
    tracing::debug!("Fetching available local models");
    let hw = detect_hardware();
    get_local_models()
        .into_iter()
        .filter(|m| crate::ai::local::can_run_locally(&m.id, &hw))
        .collect()
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get all agent roles with details
#[tauri::command]
#[specta::specta]
pub fn get_agent_roles_detailed() -> Vec<AgentRoleInfo> {
    tracing::info!("Fetching detailed agent roles");
    AgentRole::all()
        .iter()
        .map(|role| AgentRoleInfo {
            id: format!("{:?}", role).to_lowercase(),
            name: role.display_name().to_string(),
            role: *role,
        })
        .collect()
}

/// Helper struct for frontend
#[derive(serde::Serialize, specta::Type)]
pub struct AgentRoleInfo {
    pub id: String,
    pub name: String,
    pub role: AgentRole,
}

/// Get the system prompt for an agent (for debugging/transparency)
#[tauri::command]
#[specta::specta]
pub fn get_agent_prompt(role: AgentRole) -> String {
    tracing::info!("Fetching system prompt for role: {:?}", role);
    use crate::ai::agents::prompts::get_system_prompt;
    get_system_prompt(role).to_string()
}

/// Get recommended models for an agent
#[tauri::command]
#[specta::specta]
pub fn get_agent_models(role: AgentRole) -> Vec<String> {
    tracing::info!("Fetching recommended models for role: {:?}", role);
    use crate::ai::agents::crew::CrewMember;
    let member = CrewMember::new(role);
    member
        .get_alternative_models()
        .iter()
        .map(|s| s.to_string())
        .collect()
}
