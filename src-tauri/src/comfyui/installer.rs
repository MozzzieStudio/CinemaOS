//! ComfyUI installation via UV + comfy-cli
//!
//! This module handles automatic installation of ComfyUI using:
//! 1. UV (Astral) for Python project management
//! 2. comfy-cli for ComfyUI installation
//! 3. Automatic model download

use crate::errors::AppError;
use std::path::PathBuf;
use std::process::Command;

/// Check if ComfyUI is installed
pub fn is_installed() -> bool {
    let path = super::get_default_install_path();
    path.exists() && path.join("pyproject.toml").exists()
}

/// Get ComfyUI version if installed
pub fn get_version() -> Option<String> {
    if !is_installed() {
        return None;
    }

    // Try to read version from pyproject.toml
    // For now, return a placeholder
    Some("latest".to_string())
}

/// Install ComfyUI using UV + comfy-cli
pub async fn install_comfyui(install_path: PathBuf) -> Result<(), AppError> {
    // Step 1: Ensure UV is installed
    ensure_uv_installed().await?;

    // Step 2: Create installation directory
    std::fs::create_dir_all(&install_path)
        .map_err(|e| AppError::Installation(format!("Failed to create directory: {}", e)))?;

    // Step 3: Initialize UV project
    init_uv_project(&install_path).await?;

    // Step 4: Install comfy-cli
    install_comfy_cli(&install_path).await?;

    // Step 5: Use comfy-cli to install ComfyUI
    install_comfyui_via_cli(&install_path).await?;

    // Step 6: Install CinemaOS Custom Nodes
    install_cinemaos_nodes(&install_path).await?;

    Ok(())
}

/// Ensure UV is installed on the system
async fn ensure_uv_installed() -> Result<(), AppError> {
    // Check if UV exists
    let check = Command::new("uv").arg("--version").output();

    if check.is_ok() {
        return Ok(());
    }

    // Install UV
    #[cfg(target_os = "windows")]
    {
        Command::new("powershell")
            .args(["-c", "irm https://astral.sh/uv/install.ps1 | iex"])
            .output()
            .map_err(|e| AppError::Installation(format!("Failed to install UV: {}", e)))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("sh")
            .args(["-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"])
            .output()
            .map_err(|e| AppError::Installation(format!("Failed to install UV: {}", e)))?;
    }

    Ok(())
}

/// Initialize UV project
async fn init_uv_project(path: &PathBuf) -> Result<(), AppError> {
    let output = Command::new("uv")
        .args(["init", "--no-readme"])
        .current_dir(path)
        .output()
        .map_err(|e| AppError::Installation(format!("Failed to init UV project: {}", e)))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Installation(format!("UV init failed: {}", err)));
    }

    Ok(())
}

/// Install comfy-cli via UV
async fn install_comfy_cli(path: &PathBuf) -> Result<(), AppError> {
    let output = Command::new("uv")
        .args(["add", "comfy-cli"])
        .current_dir(path)
        .output()
        .map_err(|e| AppError::Installation(format!("Failed to add comfy-cli: {}", e)))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Installation(format!("UV add failed: {}", err)));
    }

    Ok(())
}

/// Install ComfyUI via comfy-cli
async fn install_comfyui_via_cli(path: &PathBuf) -> Result<(), AppError> {
    let output = Command::new("uv")
        .args([
            "run",
            "comfy",
            "install",
            "--skip-manager", // No UI manager (headless)
        ])
        .current_dir(path)
        .output()
        .map_err(|e| AppError::Installation(format!("Failed to run comfy install: {}", e)))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Installation(format!(
            "Comfy install failed: {}",
            err
        )));
    }

    Ok(())
}

/// Install CinemaOS Custom Nodes
async fn install_cinemaos_nodes(install_path: &PathBuf) -> Result<(), AppError> {
    let source = crate::utils::get_resource_path("comfyui_nodes")
        .ok_or_else(|| AppError::Installation("Failed to find comfyui_nodes resource".into()))?;

    let target = install_path.join("custom_nodes").join("cinemaos_nodes");

    // Copy directory recursively
    copy_dir_all(&source, &target)
        .map_err(|e| AppError::Installation(format!("Failed to install CinemaOS nodes: {}", e)))?;

    Ok(())
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_installed() {
        // Should return false if directory doesn't exist
        assert_eq!(is_installed(), false);
    }
}
