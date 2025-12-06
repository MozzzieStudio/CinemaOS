//! Tauri Commands for Installer
//!
//! Exposes installation, hardware detection, and model downloads to the frontend

use crate::installer::{
    detect_hardware, download_model, download_via_ollama, get_downloaded_models,
    get_installation_state, get_model_recommendations, get_model_sources, get_ollama_models,
    get_recommended_models, get_runnable_models, install_all, is_model_downloaded,
    is_ollama_installed, ComfyUIProcess, DownloadProgress, HardwareInfo, InstallationState,
    ModelRecommendation, ModelSource,
};
use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::sync::RwLock;

// Global ComfyUI process handle
static COMFYUI_PROCESS: Lazy<Arc<RwLock<ComfyUIProcess>>> =
    Lazy::new(|| Arc::new(RwLock::new(ComfyUIProcess::new())));

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get current installation state
#[tauri::command]
#[specta::specta]
pub async fn get_install_state() -> InstallationState {
    get_installation_state().await
}

/// Check if system is ready (all components installed)
#[tauri::command]
#[specta::specta]
pub async fn is_system_ready() -> bool {
    get_installation_state().await.ready
}

/// Run full installation
#[tauri::command]
#[specta::specta]
pub async fn run_installation() -> Result<String, String> {
    install_all(|progress| {
        tracing::info!(
            "Install progress: {:?} - {} ({}%)",
            progress.status,
            progress.message,
            progress.percent
        );
    })
    .await?;

    Ok("Installation complete".into())
}

/// Start ComfyUI process
#[tauri::command]
#[specta::specta]
pub async fn start_comfyui() -> Result<(), String> {
    let mut process = COMFYUI_PROCESS.write().await;
    process.start().await
}

/// Stop ComfyUI process
#[tauri::command]
#[specta::specta]
pub async fn stop_comfyui() -> Result<(), String> {
    let mut process = COMFYUI_PROCESS.write().await;
    process.stop().await
}

/// Check if ComfyUI is running
#[tauri::command]
#[specta::specta]
pub async fn is_comfyui_running() -> bool {
    let process = COMFYUI_PROCESS.read().await;
    process.is_running()
}

// ═══════════════════════════════════════════════════════════════════════════════
// HARDWARE DETECTION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Detect hardware capabilities
#[tauri::command]
#[specta::specta]
pub fn get_hardware_info() -> HardwareInfo {
    detect_hardware()
}

/// Get all model recommendations for current hardware
#[tauri::command]
#[specta::specta]
pub fn get_all_model_recommendations() -> Vec<ModelRecommendation> {
    let hw = detect_hardware();
    get_model_recommendations(&hw)
}

/// Get recommended models for current hardware
#[tauri::command]
#[specta::specta]
pub fn get_recommended_models_for_hardware() -> Vec<ModelRecommendation> {
    let hw = detect_hardware();
    get_recommended_models(&hw)
}

/// Get runnable models for current hardware
#[tauri::command]
#[specta::specta]
pub fn get_runnable_models_for_hardware() -> Vec<ModelRecommendation> {
    let hw = detect_hardware();
    get_runnable_models(&hw)
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL DOWNLOAD COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get available model sources
#[tauri::command]
#[specta::specta]
pub fn get_available_model_sources() -> Vec<ModelSource> {
    get_model_sources()
}

/// Check if a model is downloaded
#[tauri::command]
#[specta::specta]
pub fn check_model_downloaded(model_id: String) -> bool {
    is_model_downloaded(&model_id)
}

/// Get list of downloaded models
#[tauri::command]
#[specta::specta]
pub fn get_downloaded_model_ids() -> Vec<String> {
    get_downloaded_models()
}

/// Download a model
#[tauri::command]
#[specta::specta]
pub async fn download_model_by_id(model_id: String) -> Result<String, String> {
    let path = download_model(&model_id, |progress| {
        tracing::info!(
            "Download {}: {}% ({}/{})",
            progress.model_id,
            progress.percent,
            progress.downloaded_bytes,
            progress.total_bytes
        );
    })
    .await?;

    Ok(path.to_string_lossy().to_string())
}

// ═══════════════════════════════════════════════════════════════════════════════
// OLLAMA COMMANDS (for LLMs)
// ═══════════════════════════════════════════════════════════════════════════════

/// Check if Ollama is installed
#[tauri::command]
#[specta::specta]
pub async fn check_ollama_installed() -> bool {
    is_ollama_installed().await
}

/// Get installed Ollama models
#[tauri::command]
#[specta::specta]
pub async fn get_ollama_model_list() -> Result<Vec<String>, String> {
    get_ollama_models().await
}

/// Pull a model via Ollama
#[tauri::command]
#[specta::specta]
pub async fn pull_ollama_model(model_name: String) -> Result<(), String> {
    download_via_ollama(&model_name).await
}
