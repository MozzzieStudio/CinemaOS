//! Tauri Commands for AI Model Matrix
//!
//! Exposes AI functionality to the frontend

use crate::ai::{
    local::{detect_hardware, HardwareCapabilities},
    models::{get_all_models, get_local_models, ModelDefinition},
    router::{get_recommended_models, route_model_request, RoutingResult},
};

/// Get all available models
#[tauri::command]
#[specta::specta]
pub fn get_models() -> Vec<ModelDefinition> {
    get_all_models()
}

/// Get models for a specific task type
#[tauri::command]
#[specta::specta]
pub fn get_models_for_task(task_type: String) -> Vec<ModelDefinition> {
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
    get_local_models()
}

/// Detect hardware capabilities
#[tauri::command]
#[specta::specta]
pub fn get_hardware_capabilities() -> HardwareCapabilities {
    detect_hardware()
}

/// Route a model request (check if local or cloud)
#[tauri::command]
#[specta::specta]
pub fn route_request(model_id: String, prefer_local: bool) -> Result<RoutingResult, String> {
    let hw = detect_hardware();
    route_model_request(&model_id, &hw, prefer_local).map_err(|e| e.to_string())
}

/// Get models that can run on current hardware
#[tauri::command]
#[specta::specta]
pub fn get_available_local_models() -> Vec<ModelDefinition> {
    let hw = detect_hardware();
    get_local_models()
        .into_iter()
        .filter(|m| crate::ai::local::can_run_locally(&m.id, &hw))
        .collect()
}
