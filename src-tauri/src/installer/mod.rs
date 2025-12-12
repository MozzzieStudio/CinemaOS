//! Installer Module - UV, Python, ComfyUI, Hardware Detection, and Model Downloads

pub mod downloader;
pub mod gpu_detector;
pub mod hardware;

pub use downloader::*;
pub use hardware::*;

// Re-export from main installer module
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;
use std::process::Stdio;
use tokio::process::Command;

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLATION STATUS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum InstallStatus {
    NotStarted,
    CheckingPrerequisites,
    InstallingUV,
    InstallingPython,
    CreatingVenv,
    InstallingComfyUI,
    InstallingDependencies,
    Completed,
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct InstallProgress {
    pub status: InstallStatus,
    pub step: u8,
    pub total_steps: u8,
    pub message: String,
    pub percent: f32,
}

impl InstallProgress {
    pub fn new(status: InstallStatus, step: u8, message: &str) -> Self {
        Self {
            status,
            step,
            total_steps: 6,
            message: message.to_string(),
            percent: (step as f32 / 6.0) * 100.0,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATHS
// ═══════════════════════════════════════════════════════════════════════════════

pub fn get_cinema_os_dir() -> PathBuf {
    let base = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("CinemaOS")
}

pub fn get_comfyui_dir() -> PathBuf {
    get_cinema_os_dir().join("comfyui")
}

pub fn get_venv_dir() -> PathBuf {
    get_cinema_os_dir().join("venv")
}

pub fn get_models_dir() -> PathBuf {
    get_cinema_os_dir().join("models")
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

pub async fn is_uv_installed() -> bool {
    Command::new("uv")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .map(|s| s.success())
        .unwrap_or(false)
}

pub async fn is_python_installed() -> bool {
    let venv = get_venv_dir();
    if !venv.exists() {
        return false;
    }

    let python = if cfg!(windows) {
        venv.join("Scripts").join("python.exe")
    } else {
        venv.join("bin").join("python")
    };

    python.exists()
}

pub async fn is_comfyui_installed() -> bool {
    get_comfyui_dir().join("main.py").exists()
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct InstallationState {
    pub uv_installed: bool,
    pub python_installed: bool,
    pub comfyui_installed: bool,
    pub ready: bool,
}

pub async fn get_installation_state() -> InstallationState {
    let uv = is_uv_installed().await;
    let python = is_python_installed().await;
    let comfyui = is_comfyui_installed().await;

    InstallationState {
        uv_installed: uv,
        python_installed: python,
        comfyui_installed: comfyui,
        ready: uv && python && comfyui,
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLATION
// ═══════════════════════════════════════════════════════════════════════════════

async fn run_command(cmd: &str, args: &[&str], _cwd: Option<&PathBuf>) -> Result<String, String> {
    let mut command = Command::new(cmd);
    command.args(args);

    if let Some(dir) = _cwd {
        command.current_dir(dir);
    }

    let output = command
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute {}: {}", cmd, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("{} failed: {}", cmd, stderr))
    }
}

pub async fn install_uv() -> Result<(), String> {
    if is_uv_installed().await {
        return Ok(());
    }

    #[cfg(windows)]
    {
        run_command(
            "powershell",
            &[
                "-ExecutionPolicy",
                "ByPass",
                "-c",
                "irm https://astral.sh/uv/install.ps1 | iex",
            ],
            None,
        )
        .await?;
    }

    #[cfg(not(windows))]
    {
        run_command(
            "sh",
            &["-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"],
            None,
        )
        .await?;
    }

    Ok(())
}

pub async fn install_python() -> Result<(), String> {
    let cinema_dir = get_cinema_os_dir();
    let venv_dir = get_venv_dir();

    std::fs::create_dir_all(&cinema_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    run_command("uv", &["python", "install", "3.11"], None).await?;

    run_command(
        "uv",
        &["venv", venv_dir.to_str().unwrap(), "--python", "3.11"],
        None,
    )
    .await?;

    Ok(())
}

pub async fn install_comfyui() -> Result<(), String> {
    let comfyui_dir = get_comfyui_dir();
    let venv_dir = get_venv_dir();

    if !comfyui_dir.exists() {
        run_command(
            "git",
            &[
                "clone",
                "https://github.com/comfyanonymous/ComfyUI.git",
                comfyui_dir.to_str().unwrap(),
            ],
            None,
        )
        .await?;
    }

    let python_path = if cfg!(windows) {
        venv_dir.join("Scripts").join("python.exe")
    } else {
        venv_dir.join("bin").join("python")
    };

    run_command(
        "uv",
        &[
            "pip",
            "install",
            "-r",
            comfyui_dir.join("requirements.txt").to_str().unwrap(),
            "--python",
            python_path.to_str().unwrap(),
        ],
        None,
    )
    .await?;

    run_command(
        "uv",
        &[
            "pip",
            "install",
            "torch",
            "torchvision",
            "torchaudio",
            "--index-url",
            "https://download.pytorch.org/whl/cu121",
            "--python",
            python_path.to_str().unwrap(),
        ],
        None,
    )
    .await?;

    Ok(())
}

/// Copy CinemaOS custom nodes to ComfyUI
pub async fn install_custom_nodes() -> Result<(), String> {
    let comfyui_dir = get_comfyui_dir();
    let custom_nodes_target = comfyui_dir.join("custom_nodes").join("CinemaOS");

    // Create target directory
    if custom_nodes_target.exists() {
        std::fs::remove_dir_all(&custom_nodes_target).map_err(|e| e.to_string())?;
    }
    std::fs::create_dir_all(&custom_nodes_target)
        .map_err(|e| format!("Failed to create custom_nodes dir: {}", e))?;

    // Source is relative to the executable (bundled with app)
    let source_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("comfyui_nodes")
        .join("cinemaos"); // NEW: Point to the package folder

    // If source exists, copy files
    if source_dir.exists() {
        for entry in std::fs::read_dir(&source_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            // Copy everything (__init__.py, nodes.py, etc.)
            let filename = path.file_name().unwrap();
            let dest = custom_nodes_target.join(filename);
            if path.is_file() {
                std::fs::copy(&path, &dest).map_err(|e| e.to_string())?;
            }
            // Note: If we add subfolders later, we need recursive copy here.
        }
    }

    Ok(())
}

pub async fn install_all(
    progress_callback: impl Fn(InstallProgress) + Send + 'static,
) -> Result<(), String> {
    progress_callback(InstallProgress::new(
        InstallStatus::CheckingPrerequisites,
        1,
        "Checking prerequisites...",
    ));

    run_command("git", &["--version"], None)
        .await
        .map_err(|_| "Git is required but not installed")?;

    progress_callback(InstallProgress::new(
        InstallStatus::InstallingUV,
        2,
        "Installing UV package manager...",
    ));
    install_uv().await?;

    progress_callback(InstallProgress::new(
        InstallStatus::InstallingPython,
        3,
        "Installing Python 3.11...",
    ));
    install_python().await?;

    progress_callback(InstallProgress::new(
        InstallStatus::CreatingVenv,
        4,
        "Creating virtual environment...",
    ));

    progress_callback(InstallProgress::new(
        InstallStatus::InstallingComfyUI,
        5,
        "Installing ComfyUI...",
    ));
    install_comfyui().await?;

    // Install custom nodes
    progress_callback(InstallProgress::new(
        InstallStatus::InstallingDependencies,
        5,
        "Installing CinemaOS nodes...",
    ));
    install_custom_nodes().await?;

    progress_callback(InstallProgress::new(
        InstallStatus::Completed,
        6,
        "Installation complete!",
    ));

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMFYUI PROCESS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

pub struct ComfyUIProcess {
    process: Option<tokio::process::Child>,
    port: u16,
}

impl ComfyUIProcess {
    pub fn new() -> Self {
        Self {
            process: None,
            port: 8188,
        }
    }

    pub async fn start(&mut self) -> Result<(), String> {
        if self.process.is_some() {
            return Ok(());
        }

        let venv_dir = get_venv_dir();
        let comfyui_dir = get_comfyui_dir();

        let python = if cfg!(windows) {
            venv_dir.join("Scripts").join("python.exe")
        } else {
            venv_dir.join("bin").join("python")
        };

        let child = Command::new(python)
            .arg("main.py")
            .arg("--listen")
            .arg("127.0.0.1")
            .arg("--port")
            .arg(self.port.to_string())
            .current_dir(&comfyui_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start ComfyUI: {}", e))?;

        self.process = Some(child);

        let client = reqwest::Client::new();
        let url = format!("http://127.0.0.1:{}/system_stats", self.port);

        for _ in 0..30 {
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            if client.get(&url).send().await.is_ok() {
                return Ok(());
            }
        }

        Err("ComfyUI failed to start within 30 seconds".into())
    }

    pub async fn stop(&mut self) -> Result<(), String> {
        if let Some(mut child) = self.process.take() {
            child
                .kill()
                .await
                .map_err(|e| format!("Failed to stop ComfyUI: {}", e))?;
        }
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.process.is_some()
    }
}

impl Default for ComfyUIProcess {
    fn default() -> Self {
        Self::new()
    }
}
