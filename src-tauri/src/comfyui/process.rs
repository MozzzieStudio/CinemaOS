//! ComfyUI process management
//!
//! Manages the lifecycle of the headless ComfyUI server process.

use crate::errors::AppError;
use once_cell::sync::Lazy;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

/// Global ComfyUI process handle
static COMFYUI_PROCESS: Lazy<Arc<Mutex<Option<Child>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

/// Start ComfyUI headless server
pub async fn start_comfyui(
    install_path: std::path::PathBuf,
    host: &str,
    port: u16,
) -> Result<(), AppError> {
    let mut process_lock = COMFYUI_PROCESS.lock().await;

    // Check if already running
    if process_lock.is_some() {
        return Ok(());
    }

    // Start ComfyUI via comfy-cli
    let child = Command::new("uv")
        .args([
            "run",
            "comfy",
            "launch",
            "--listen",
            host,
            "--port",
            &port.to_string(),
            "--disable-auto-launch", // No browser
            "--preview-method",
            "none", // No preview images
        ])
        .current_dir(&install_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| AppError::ProcessStart(format!("Failed to spawn ComfyUI: {}", e)))?;

    *process_lock = Some(child);

    // Wait for server to be ready
    wait_for_ready(host, port).await?;

    println!("✅ ComfyUI ready at http://{}:{}", host, port);

    Ok(())
}

/// Stop ComfyUI server
pub async fn stop_comfyui() -> Result<(), AppError> {
    let mut process_lock = COMFYUI_PROCESS.lock().await;

    if let Some(mut child) = process_lock.take() {
        child
            .kill()
            .map_err(|e| AppError::ProcessStop(format!("Failed to kill process: {}", e)))?;

        child
            .wait()
            .map_err(|e| AppError::ProcessStop(format!("Failed to wait for process: {}", e)))?;

        println!("🛑 ComfyUI stopped");
    }

    Ok(())
}

/// Check if ComfyUI is running
pub fn is_running(host: &str, port: u16) -> bool {
    // Try to connect to API endpoint
    let url = format!("http://{}:{}/system_stats", host, port);
    reqwest::blocking::get(&url).is_ok()
}

/// Wait for ComfyUI server to be ready
async fn wait_for_ready(host: &str, port: u16) -> Result<(), AppError> {
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(60);
    let url = format!("http://{}:{}/system_stats", host, port);

    loop {
        if start.elapsed() > timeout {
            return Err(AppError::ProcessStart(
                "ComfyUI failed to start within 60 seconds".to_string(),
            ));
        }

        // Test API endpoint
        match reqwest::get(&url).await {
            Ok(_) => return Ok(()),
            Err(_) => tokio::time::sleep(Duration::from_millis(500)).await,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_running() {
        // Should return false if not running
        assert_eq!(is_running("127.0.0.1", 8188), false);
    }
}
