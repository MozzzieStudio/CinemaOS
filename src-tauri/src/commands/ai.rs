//! Tauri Commands for AI Model Matrix and Virtual Crew
//!
//! Exposes AI functionality to the frontend

use crate::ai::{
    agents::{
        crew::VirtualCrew,
        traits::{AgentInput, AgentOutput, AgentRole, ConversationTurn, VaultContext},
    },
    local::{detect_hardware, HardwareCapabilities},
    models::{get_all_models, get_local_models, ModelDefinition},
    router::{get_recommended_models, route_model_request, RoutingResult},
};
use std::collections::HashMap;
use std::sync::OnceLock;

// VIRTUAL_CREW removed as it was only used by legacy commands

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
    let hw = detect_hardware();
    get_recommended_models(&task_type, &hw)
        .into_iter()
        .map(|(m, _)| m)
        .collect()
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
pub fn route_request(model_id: String, prefer_local: bool) -> Result<RoutingResult, String> {
    tracing::info!(
        "Routing request for model: {}, prefer_local: {}",
        model_id,
        prefer_local
    );
    let hw = detect_hardware();
    route_model_request(&model_id, &hw, prefer_local).map_err(|e| e.to_string())
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
