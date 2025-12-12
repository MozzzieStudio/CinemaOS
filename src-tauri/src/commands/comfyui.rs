//! Tauri Commands for ComfyUI
//!
//! Exposes ComfyUI installation, process management, and execution to the frontend

use crate::comfyui::{self, ComfyUIConfig, ComfyUIStatus};
use tauri::Emitter;

/// Get ComfyUI status (installation + running state)
#[tauri::command]
#[specta::specta]
pub async fn get_comfyui_status() -> Result<ComfyUIStatus, String> {
    let config = ComfyUIConfig::default();

    Ok(ComfyUIStatus {
        installed: comfyui::installer::is_installed(),
        running: comfyui::process::is_running(&config.host, config.port),
        version: comfyui::installer::get_version(),
        install_path: config.install_path.display().to_string(),
    })
}

/// Install ComfyUI via UV + comfy-cli
#[tauri::command]
#[specta::specta]
pub async fn install_comfyui(window: tauri::Window) -> Result<String, String> {
    let install_path = comfyui::get_default_install_path();

    // Emit progress events
    window
        .emit("comfyui-install-progress", "Installing UV...")
        .ok();

    // Install ComfyUI
    comfyui::installer::install_comfyui(install_path.clone())
        .await
        .map_err(|e| e.to_string())?;

    window
        .emit(
            "comfyui-install-progress",
            "Downloading essential models...",
        )
        .ok();

    // Download FLUX Schnell
    comfyui::models::download_essential_models(&install_path)
        .await
        .map_err(|e| e.to_string())?;

    window.emit("comfyui-install-complete", ()).ok();

    Ok(install_path.display().to_string())
}

/// Start ComfyUI headless server
#[tauri::command]
#[specta::specta]
pub async fn start_comfyui() -> Result<(), String> {
    let config = ComfyUIConfig::default();

    comfyui::process::start_comfyui(config.install_path, &config.host, config.port)
        .await
        .map_err(|e| e.to_string())
}

/// Stop ComfyUI server
#[tauri::command]
#[specta::specta]
pub async fn stop_comfyui() -> Result<(), String> {
    comfyui::process::stop_comfyui()
        .await
        .map_err(|e| e.to_string())
}

/// Generate image using FLUX Schnell text-to-image
#[tauri::command]
#[specta::specta]
pub async fn generate_image(
    prompt: String,
    seed: Option<u64>,
    width: Option<u32>,
    height: Option<u32>,
) -> Result<String, String> {
    let config = ComfyUIConfig::default();
    let client = comfyui::client::ComfyUIClient::new(&config.host, config.port);

    // Create FLUX Schnell workflow
    let workflow = comfyui::workflows::flux_schnell_text2img(&prompt, seed, width, height);

    // Queue workflow for execution
    let response = client
        .queue_prompt(workflow)
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.prompt_id)
}

/// Get system stats from ComfyUI
#[tauri::command]
#[specta::specta]
pub async fn get_comfyui_stats() -> Result<String, String> {
    let config = ComfyUIConfig::default();
    let client = comfyui::client::ComfyUIClient::new(&config.host, config.port);

    let stats = client.get_system_stats().await.map_err(|e| e.to_string())?;

    serde_json::to_string(&stats).map_err(|e| format!("Failed to serialize stats: {}", e))
}
