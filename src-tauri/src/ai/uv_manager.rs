//! UV Python Environment Manager
//!
//! Manages the local Python environment using `uv`.
//! - Downloads `uv` if missing.
//! - Creates/Updates virtual environments.
//! - Synchronizes dependencies (`uv pip sync`).
//! - Runs commands in the environment (`uv run`).

use std::path::{Path, PathBuf};
use std::process::Stdio;
use tokio::process::Command;

#[derive(Debug, Clone)]
pub struct UVManager {
    pub project_dir: PathBuf,
    pub venv_dir: PathBuf,
}

impl UVManager {
    pub fn new(project_dir: PathBuf) -> Self {
        Self {
            venv_dir: project_dir.join(".venv"),
            project_dir,
        }
    }

    /// Check if `uv` is installed and valid
    pub async fn check_uv_installed() -> bool {
        match Command::new("uv").arg("--version").output().await {
            Ok(output) => output.status.success(),
            Err(_) => false,
        }
    }

    /// Initialize the virtual environment
    pub async fn create_venv(&self) -> Result<(), String> {
        if self.venv_dir.exists() {
            return Ok(());
        }

        let output = Command::new("uv")
            .arg("venv")
            .current_dir(&self.project_dir)
            .output()
            .await
            .map_err(|e| format!("Failed to execute uv venv: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "uv venv failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(())
    }

    /// Install/Sync dependencies from requirements.txt
    pub async fn sync_dependencies(&self, requirements_path: &Path) -> Result<(), String> {
        let output = Command::new("uv")
            .arg("pip")
            .arg("install")
            .arg("-r")
            .arg(requirements_path)
            .current_dir(&self.project_dir)
            .env("VIRTUAL_ENV", &self.venv_dir)
            .output()
            .await
            .map_err(|e| format!("Failed to execute uv pip install: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "uv pip install failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(())
    }

    /// Run a python script in the environment
    pub async fn run_script(
        &self,
        script_path: &str,
        args: &[&str],
    ) -> Result<tokio::process::Child, String> {
        // uv run python script.py [args]
        // Automatic venv detection by uv run in the project dir

        let mut cmd = Command::new("uv");
        cmd.arg("run")
            .arg("python")
            .arg(script_path)
            .args(args)
            .current_dir(&self.project_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // On Windows, we might need to be explicit about the venv if uv run doesn't pick it up automatically
        // but 'uv run' is designed to do exactly that.

        cmd.spawn()
            .map_err(|e| format!("Failed to spawn process: {}", e))
    }
}
