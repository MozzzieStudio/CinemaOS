//! Model Downloader
//!
//! Downloads AI models with progress tracking

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;
use tokio::io::AsyncWriteExt;

use crate::installer::get_models_dir;

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD STATUS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum DownloadStatus {
    NotStarted,
    Downloading,
    Extracting,
    Completed,
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DownloadProgress {
    pub model_id: String,
    pub status: DownloadStatus,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percent: f32,
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL SOURCES
// ═══════════════════════════════════════════════════════════════════════════════

use once_cell::sync::Lazy;
use std::sync::RwLock;

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL SOURCES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelSource {
    pub id: String,
    pub name: String,
    pub download_url: String,
    pub filename: String,
    pub size_bytes: u64,
    pub checksum_sha256: Option<String>,
    pub requires_auth: bool,
}

static MODEL_SOURCES: Lazy<RwLock<Vec<ModelSource>>> =
    Lazy::new(|| RwLock::new(get_hardcoded_sources()));

/// Get download sources for known models (from cache/hardcoded)
pub fn get_model_sources() -> Vec<ModelSource> {
    MODEL_SOURCES.read().unwrap().clone()
}

/// Helper: Hardcoded sources as fallback
fn get_hardcoded_sources() -> Vec<ModelSource> {
    vec![
        // ── Checkpoints for ComfyUI ──
        ModelSource {
            id: "sdxl-base".into(),
            name: "SDXL Base 1.0".into(),
            download_url: "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors".into(),
            filename: "sd_xl_base_1.0.safetensors".into(),
            size_bytes: 6_938_040_682,
            checksum_sha256: None,
            requires_auth: false,
        },
        ModelSource {
            id: "flux-schnell".into(),
            name: "FLUX.1 Schnell".into(),
            download_url: "https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors".into(),
            filename: "flux1-schnell.safetensors".into(),
            size_bytes: 23_800_000_000,
            checksum_sha256: None,
            requires_auth: false,
        },
        // ── Wan 2.1 (Alibaba) ──
        ModelSource {
            id: "wan-2.1-t2v-14b".into(),
            name: "Wan 2.1 T2V 14B".into(),
            download_url: "https://huggingface.co/Wan-AI/Wan2.1-T2V-14B/resolve/main/model.safetensors".into(),
            filename: "wan2.1_t2v_14b.safetensors".into(),
            size_bytes: 14_500_000_000,
            checksum_sha256: None,
            requires_auth: true,
        },
        ModelSource {
            id: "wan-2.1-14b".into(),
            name: "Wan 2.1 Video 14B".into(),
            download_url: "https://huggingface.co/Wan-AI/Wan2.1-T2V-14B/resolve/main/wan2.1_14b.safetensors".into(),
            filename: "wan2.1_14b.safetensors".into(),
            size_bytes: 28_000_000_000,
            checksum_sha256: None,
            requires_auth: false,
        },
        // Z-Image Turbo
        ModelSource {
            id: "z-image-turbo".into(),
            name: "Z-Image Turbo".into(),
            download_url: "https://huggingface.co/Tongyi-MAI/Z-Image-Turbo/resolve/main/z_image_turbo.safetensors".into(),
            filename: "z_image_turbo.safetensors".into(),
            size_bytes: 12_000_000_000,
            checksum_sha256: None,
            requires_auth: false,
        },
        // ── SAM 3 (Meta) ──
        ModelSource {
            id: "sam-3-large".into(),
            name: "SAM 3 Large".into(),
            download_url: "https://huggingface.co/facebookresearch/sam3/resolve/main/sam3_large.safetensors".into(),
            filename: "sam3_large.safetensors".into(),
            size_bytes: 2_400_000_000,
            checksum_sha256: None,
            requires_auth: false,
        },
        // ── Llama 4 (Meta) - REQUIRES AUTH ──
        ModelSource {
            id: "llama-4-70b-quant".into(),
            name: "Llama 4 70B (Q4_K_M)".into(),
            download_url: "https://huggingface.co/meta-llama/Llama-4-70b-GGUF/resolve/main/llama-4-70b.Q4_K_M.gguf".into(),
            filename: "llama-4-70b.Q4_K_M.gguf".into(),
            size_bytes: 42_000_000_000,
            checksum_sha256: None,
            requires_auth: true,
        },
    ]
}

/// Fetch the latest model manifest from the web
pub async fn refresh_model_manifest(url: Option<String>) -> Result<(), String> {
    let manifest_url =
        url.unwrap_or_else(|| "https://api.cinemaos.com/v1/models/manifest.json".to_string());
    tracing::info!("Refreshing model manifest from {}", manifest_url);

    let client = reqwest::Client::new();
    let response = client
        .get(&manifest_url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch manifest: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Manifest fetch failed with status: {}",
            response.status()
        ));
    }

    let dynamic_sources: Vec<ModelSource> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse manifest: {}", e))?;

    // Update the lock
    if let Ok(mut sources) = MODEL_SOURCES.write() {
        *sources = dynamic_sources;
        tracing::info!("Model manifest updated successfully");
    } else {
        return Err("Failed to acquire write lock on MODEL_SOURCES".to_string());
    }

    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get the path where a model should be stored
pub fn get_model_path(model_id: &str, filename: &str) -> PathBuf {
    let models_dir = get_models_dir();
    let category_dir = match model_id {
        id if id.contains("sdxl") || id.contains("flux") || id.contains("wan") => "checkpoints",
        id if id.contains("llama") || id.contains("gemma") => "llm",
        id if id.contains("whisper") => "audio",
        id if id.contains("sam") => "segmentation",
        _ => "other",
    };

    models_dir.join(category_dir).join(filename)
}

/// Check if a model is already downloaded
pub fn is_model_downloaded(model_id: &str) -> bool {
    let sources = get_model_sources();
    if let Some(source) = sources.iter().find(|s| s.id == model_id) {
        let path = get_model_path(&source.id, &source.filename);
        path.exists()
    } else {
        false
    }
}

/// Get list of downloaded models
pub fn get_downloaded_models() -> Vec<String> {
    get_model_sources()
        .iter()
        .filter(|s| is_model_downloaded(&s.id))
        .map(|s| s.id.clone())
        .collect()
}

/// Download a model with progress callback
pub async fn download_model(
    model_id: &str,
    progress_callback: impl Fn(DownloadProgress) + Send + 'static,
) -> Result<PathBuf, String> {
    let sources = get_model_sources();
    let source = sources
        .iter()
        .find(|s| s.id == model_id)
        .ok_or_else(|| format!("Unknown model: {}", model_id))?;

    let dest_path = get_model_path(&source.id, &source.filename);

    // Create parent directories
    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Skip if already downloaded and verified
    if dest_path.exists() {
        if let Ok(metadata) = std::fs::metadata(&dest_path) {
            // loose check: if file is at least 90% of expected size, we might want to be careful
            // but for now, exact match or re-download is safer for models that must be exact.
            // However, some huggingface models might vary slightly if metadata changes.
            // Let's stick to exact match for now as these are static assets.
            if metadata.len() == source.size_bytes {
                progress_callback(DownloadProgress {
                    model_id: model_id.to_string(),
                    status: DownloadStatus::Completed,
                    downloaded_bytes: source.size_bytes,
                    total_bytes: source.size_bytes,
                    percent: 100.0,
                });
                return Ok(dest_path);
            } else {
                // File exists but wrong size, likely corrupt or partial. Proceed to re-download.
                // Ideally logging here would be good.
            }
        }
    }

    progress_callback(DownloadProgress {
        model_id: model_id.to_string(),
        status: DownloadStatus::Downloading,
        downloaded_bytes: 0,
        total_bytes: source.size_bytes,
        percent: 0.0,
    });

    // Download with progress
    let client = reqwest::Client::new();
    let mut request = client.get(&source.download_url);

    // Add Auth Header if required
    if source.requires_auth {
        use keyring::Entry;
        let entry = Entry::new("cinemaos", "hf_token").map_err(|e| e.to_string())?;
        if let Ok(token) = entry.get_password() {
            request = request.header("Authorization", format!("Bearer {}", token));
        } else {
            return Err(format!(
                "Model {} requires authentication. Please set your HuggingFace Token in Settings.",
                source.name
            ));
        }
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    let total_size = response.content_length().unwrap_or(source.size_bytes);

    let mut file = tokio::fs::File::create(&dest_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Write error: {}", e))?;

        downloaded += chunk.len() as u64;
        let percent = (downloaded as f32 / total_size as f32) * 100.0;

        progress_callback(DownloadProgress {
            model_id: model_id.to_string(),
            status: DownloadStatus::Downloading,
            downloaded_bytes: downloaded,
            total_bytes: total_size,
            percent,
        });
    }

    progress_callback(DownloadProgress {
        model_id: model_id.to_string(),
        status: DownloadStatus::Completed,
        downloaded_bytes: total_size,
        total_bytes: total_size,
        percent: 100.0,
    });

    Ok(dest_path)
}

/// Download a model via Ollama (for LLMs)
pub async fn download_via_ollama(model_name: &str) -> Result<(), String> {
    // Sanitize input to prevent injection
    if !model_name
        .chars()
        .all(|c| c.is_alphanumeric() || c == ':' || c == '.' || c == '-' || c == '_')
    {
        return Err("Invalid model name".into());
    }

    use std::process::Stdio;
    use tokio::process::Command;

    let output = Command::new("ollama")
        .args(["pull", model_name])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run ollama: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Ollama pull failed: {}", stderr))
    }
}

/// Check if Ollama is installed
pub async fn is_ollama_installed() -> bool {
    use std::process::Stdio;
    use tokio::process::Command;

    Command::new("ollama")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .map(|s| s.success())
        .unwrap_or(false)
}

/// Get Ollama models list
pub async fn get_ollama_models() -> Result<Vec<String>, String> {
    use std::process::Stdio;
    use tokio::process::Command;

    let output = Command::new("ollama")
        .args(["list"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run ollama: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let models: Vec<String> = stdout
            .lines()
            .skip(1) // Skip header
            .filter_map(|line| line.split_whitespace().next())
            .map(String::from)
            .collect();
        Ok(models)
    } else {
        Err("Failed to list Ollama models".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_path() {
        let path = get_model_path("sdxl-base", "test.safetensors");
        assert!(path.to_str().unwrap().contains("checkpoints"));
    }

    #[test]
    fn test_model_sources() {
        let sources = get_model_sources();
        assert!(!sources.is_empty());
    }
}
