//! ComfyUI integration module
//!
//! This module provides headless ComfyUI integration for CinemaOS.
//! It manages installation, process lifecycle, and workflow execution.
//!
//! ## Architecture
//! - `installer`: Auto-install ComfyUI via UV + comfy-cli
//! - `process`: Start/stop headless ComfyUI server
//! - `client`: WebSocket communication with ComfyUI API
//! - `workflows`: Predefined generation workflows
//! - `models`: Model management and download

pub mod client;
pub mod installer;
pub mod models;
pub mod process;
pub mod workflows;

use std::path::PathBuf;

/// ComfyUI configuration
#[derive(Debug, Clone)]
pub struct ComfyUIConfig {
    pub install_path: PathBuf,
    pub host: String,
    pub port: u16,
    pub auto_start: bool,
}

impl Default for ComfyUIConfig {
    fn default() -> Self {
        Self {
            install_path: get_default_install_path(),
            host: "127.0.0.1".to_string(),
            port: 8188,
            auto_start: true,
        }
    }
}

/// Get default ComfyUI installation path
///
/// - Windows: %APPDATA%/CinemaOS/ComfyUI
/// - macOS: ~/Library/Application Support/CinemaOS/ComfyUI
/// - Linux: ~/.local/share/CinemaOS/ComfyUI
pub fn get_default_install_path() -> PathBuf {
    // Get app data directory
    let app_data = if cfg!(target_os = "windows") {
        std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string())
    } else if cfg!(target_os = "macos") {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        format!("{}/Library/Application Support", home)
    } else {
        // Linux
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        format!("{}/.local/share", home)
    };

    PathBuf::from(app_data).join("CinemaOS").join("ComfyUI")
}

/// ComfyUI status
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ComfyUIStatus {
    pub installed: bool,
    pub running: bool,
    pub version: Option<String>,
    pub install_path: String,
}
