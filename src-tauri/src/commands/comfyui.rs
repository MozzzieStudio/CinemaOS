//! Tauri Commands for ComfyUI
//!
//! Exposes ComfyUI functionality to the frontend

use crate::ai::comfyui_client::{get_client, ConnectionStatus, ExecutionResult};

/// Check if ComfyUI is running
#[tauri::command]
#[specta::specta]
pub async fn comfyui_ping() -> Result<bool, String> {
    get_client().ping().await
}

/// Get ComfyUI connection status
#[tauri::command]
#[specta::specta]
pub async fn comfyui_status() -> ConnectionStatus {
    get_client().status().await
}

/// Get available models from ComfyUI
#[tauri::command]
#[specta::specta]
pub async fn comfyui_get_models() -> Result<Vec<String>, String> {
    get_client().get_models().await
}

/// Execute a workflow (prompt as JSON string)
#[tauri::command]
#[specta::specta]
pub async fn comfyui_execute(prompt_json: String) -> Result<ExecutionResult, String> {
    let prompt: serde_json::Value =
        serde_json::from_str(&prompt_json).map_err(|e| format!("Invalid JSON prompt: {}", e))?;
    get_client().execute(prompt, None).await
}

/// Get execution history (returns JSON string)
#[tauri::command]
#[specta::specta]
pub async fn comfyui_get_history(prompt_id: String) -> Result<String, String> {
    let history = get_client().get_history(&prompt_id).await?;
    serde_json::to_string(&history).map_err(|e| format!("Failed to serialize: {}", e))
}

/// Get generated image
#[tauri::command]
#[specta::specta]
pub async fn comfyui_get_image(
    filename: String,
    subfolder: String,
    folder_type: String,
) -> Result<Vec<u8>, String> {
    get_client()
        .get_image(&filename, &subfolder, &folder_type)
        .await
}
