//! Error Types for CinemaOS Backend
//!
//! Typed errors using thiserror for better debugging and handling.

pub mod codes;

use thiserror::Error;

// ═══════════════════════════════════════════════════════════════════════════════
// LLM ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Error)]
pub enum LLMError {
    #[error("API key not set for {provider}. Set {env_var} environment variable.")]
    MissingApiKey { provider: String, env_var: String },

    #[error("Rate limited by {provider}. Retry after {retry_after_secs} seconds.")]
    RateLimited {
        provider: String,
        retry_after_secs: u64,
    },

    #[error("Authentication failed for {provider}: {message}")]
    AuthenticationFailed { provider: String, message: String },

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("Invalid response from {provider}: {message}")]
    InvalidResponse { provider: String, message: String },

    #[error("Model not found: {model_id}")]
    ModelNotFound { model_id: String },

    #[error("Request timeout after {timeout_secs} seconds")]
    Timeout { timeout_secs: u64 },

    #[error("Provider error: {provider} returned {status_code}: {message}")]
    ProviderError {
        provider: String,
        status_code: u16,
        message: String,
    },
}

impl LLMError {
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            LLMError::RateLimited { .. } | LLMError::Timeout { .. } | LLMError::NetworkError(_)
        )
    }

    pub fn retry_delay(&self) -> Option<u64> {
        match self {
            LLMError::RateLimited {
                retry_after_secs, ..
            } => Some(*retry_after_secs),
            LLMError::Timeout { .. } => Some(5),
            LLMError::NetworkError(_) => Some(2),
            _ => None,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLER ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Error)]
pub enum InstallerError {
    #[error("Git not installed. Please install Git first.")]
    GitNotInstalled,

    #[error("Failed to install UV: {message}")]
    UVInstallFailed { message: String },

    #[error("Failed to install Python: {message}")]
    PythonInstallFailed { message: String },

    #[error("Failed to clone ComfyUI: {message}")]
    ComfyUICloneFailed { message: String },

    #[error("Failed to install dependencies: {message}")]
    DependencyInstallFailed { message: String },

    #[error("ComfyUI failed to start: {message}")]
    ComfyUIStartFailed { message: String },

    #[error("Installation directory not writable: {path}")]
    DirectoryNotWritable { path: String },

    #[error("Insufficient disk space: need {needed_gb}GB, have {available_gb}GB")]
    InsufficientDiskSpace { needed_gb: f32, available_gb: f32 },

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Command failed: {command} - {stderr}")]
    CommandFailed { command: String, stderr: String },
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMFYUI ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Error)]
pub enum ComfyUIError {
    #[error("ComfyUI not running. Start it first.")]
    NotRunning,

    #[error("Failed to connect to ComfyUI at {url}: {message}")]
    ConnectionFailed { url: String, message: String },

    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    #[error("Workflow execution failed: {message}")]
    ExecutionFailed { message: String },

    #[error("Node not found: {node_type}")]
    NodeNotFound { node_type: String },

    #[error("Model not loaded: {model_name}")]
    ModelNotLoaded { model_name: String },

    #[error("Invalid workflow JSON: {message}")]
    InvalidWorkflow { message: String },

    #[error("Timeout waiting for generation (>{timeout_secs}s)")]
    GenerationTimeout { timeout_secs: u64 },

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Error)]
pub enum VaultError {
    #[error("Token not found: {token_type}/{token_name}")]
    TokenNotFound {
        token_type: String,
        token_name: String,
    },

    #[error("Duplicate token: {token_type}/{token_name} already exists")]
    DuplicateToken {
        token_type: String,
        token_name: String,
    },

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Invalid token data: {message}")]
    InvalidTokenData { message: String },

    #[error("Asset upload failed: {message}")]
    AssetUploadFailed { message: String },

    #[error("Asset not found: {asset_id}")]
    AssetNotFound { asset_id: String },

    #[error("Insufficient credits: need {needed}, have {available}")]
    InsufficientCredits { needed: f32, available: f32 },
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Error)]
pub enum DownloadError {
    #[error("Model not found: {model_id}")]
    ModelNotFound { model_id: String },

    #[error("Download failed: {message}")]
    DownloadFailed { message: String },

    #[error("Checksum mismatch for {filename}: expected {expected}, got {actual}")]
    ChecksumMismatch {
        filename: String,
        expected: String,
        actual: String,
    },

    #[error("Disk full: need {needed_bytes} bytes")]
    DiskFull { needed_bytes: u64 },

    #[error("Network error: {0}")]
    NetworkError(#[from] reqwest::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Ollama not installed")]
    OllamaNotInstalled,
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT ERRORS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Error)]
pub enum AgentError {
    #[error("Unknown agent role: {role}")]
    UnknownRole { role: String },

    #[error("Agent failed to process: {message}")]
    ProcessingFailed { message: String },

    #[error("LLM error: {0}")]
    LLMError(#[from] LLMError),

    #[error("Workflow generation failed: {message}")]
    WorkflowFailed { message: String },
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED APP ERROR
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Error)]
pub enum AppError {
    #[error("LLM: {0}")]
    LLM(#[from] LLMError),

    #[error("Installer: {0}")]
    Installer(#[from] InstallerError),

    #[error("ComfyUI: {0}")]
    ComfyUI(#[from] ComfyUIError),

    #[error("Vault: {0}")]
    Vault(#[from] VaultError),

    #[error("Download: {0}")]
    Download(#[from] DownloadError),

    #[error("Agent: {0}")]
    Agent(#[from] AgentError),

    // ComfyUI installation & process management errors
    #[error("Installation failed: {0}")]
    Installation(String),

    #[error("Process start failed: {0}")]
    ProcessStart(String),

    #[error("Process stop failed: {0}")]
    ProcessStop(String),

    #[error("Model download failed: {0}")]
    ModelDownload(String),

    #[error("API request failed: {0}")]
    ApiRequest(String),

    #[error("API response error: {0}")]
    ApiResponse(String),
}

// For Tauri command compatibility
impl From<AppError> for String {
    fn from(err: AppError) -> String {
        err.to_string()
    }
}

impl From<LLMError> for String {
    fn from(err: LLMError) -> String {
        err.to_string()
    }
}

impl From<InstallerError> for String {
    fn from(err: InstallerError) -> String {
        err.to_string()
    }
}

impl From<ComfyUIError> for String {
    fn from(err: ComfyUIError) -> String {
        err.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_llm_error_retryable() {
        let rate_limited = LLMError::RateLimited {
            provider: "gemini".into(),
            retry_after_secs: 30,
        };
        assert!(rate_limited.is_retryable());
        assert_eq!(rate_limited.retry_delay(), Some(30));

        let auth_error = LLMError::AuthenticationFailed {
            provider: "openai".into(),
            message: "invalid key".into(),
        };
        assert!(!auth_error.is_retryable());
        assert_eq!(auth_error.retry_delay(), None);
    }

    #[test]
    fn test_error_display() {
        let err = LLMError::MissingApiKey {
            provider: "Gemini".into(),
            env_var: "GOOGLE_API_KEY".into(),
        };
        assert!(err.to_string().contains("GOOGLE_API_KEY"));
    }
}
