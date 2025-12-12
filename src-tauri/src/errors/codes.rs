//! Error Codes for UI Communication
//!
//! Structured error codes that the frontend can handle programmatically.
//! Each error has a code, user message, retryability, and optional retry delay.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Structured error code for UI
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(tag = "domain", content = "code")]
pub enum ErrorCode {
    // Authentication & Authorization (AUTH_xxx)
    Auth(AuthErrorCode),

    // Vault / Database (VAULT_xxx)
    Vault(VaultErrorCode),

    // AI Generation (AI_xxx)
    AI(AIErrorCode),

    // File I/O (FILE_xxx)
    File(FileErrorCode),

    // System / Hardware (SYS_xxx)
    System(SystemErrorCode),
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum AuthErrorCode {
    #[serde(rename = "AUTH_001")]
    InvalidApiKey,

    #[serde(rename = "AUTH_002")]
    RateLimited,

    #[serde(rename = "AUTH_003")]
    CreditsExhausted,

    #[serde(rename = "AUTH_004")]
    Unauthorized,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum VaultErrorCode {
    #[serde(rename = "VAULT_001")]
    ConnectionFailed,

    #[serde(rename = "VAULT_002")]
    SaveFailed,

    #[serde(rename = "VAULT_003")]
    QueryFailed,

    #[serde(rename = "VAULT_004")]
    NotFound,

    #[serde(rename = "VAULT_005")]
    SyncConflict,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum AIErrorCode {
    #[serde(rename = "AI_001")]
    ModelNotAvailable,

    #[serde(rename = "AI_002")]
    GenerationTimeout,

    #[serde(rename = "AI_003")]
    CreditLimitReached,

    #[serde(rename = "AI_004")]
    InvalidPrompt,

    #[serde(rename = "AI_005")]
    ProviderError,

    #[serde(rename = "AI_006")]
    QuotaExceeded,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum FileErrorCode {
    #[serde(rename = "FILE_001")]
    NotFound,

    #[serde(rename = "FILE_002")]
    PermissionDenied,

    #[serde(rename = "FILE_003")]
    InvalidFormat,

    #[serde(rename = "FILE_004")]
    TooLarge,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum SystemErrorCode {
    #[serde(rename = "SYS_001")]
    OutOfMemory,

    #[serde(rename = "SYS_002")]
    GPUNotAvailable,

    #[serde(rename = "SYS_003")]
    NetworkError,

    #[serde(rename = "SYS_004")]
    Unknown,
}

/// User-facing error with structured code
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UIError {
    /// Structured error code
    pub code: ErrorCode,

    /// User-friendly message
    pub message: String,

    /// Technical details (for developers/support)
    pub details: Option<String>,

    /// Can this error be retried?
    pub retryable: bool,

    /// Suggested retry delay in seconds
    pub retry_after_secs: Option<u64>,

    /// Timestamp
    pub timestamp: String,
}

impl UIError {
    /// Create a new UI error
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code: code.clone(),
            message: message.into(),
            details: None,
            retryable: Self::is_retryable(&code),
            retry_after_secs: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create with details
    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }

    /// Set retry delay
    pub fn with_retry(mut self, secs: u64) -> Self {
        self.retry_after_secs = Some(secs);
        self
    }

    /// Determine if error is retryable based on code
    fn is_retryable(code: &ErrorCode) -> bool {
        match code {
            ErrorCode::Auth(AuthErrorCode::RateLimited) => true,
            ErrorCode::Vault(VaultErrorCode::ConnectionFailed) => true,
            ErrorCode::Vault(VaultErrorCode::SaveFailed) => true,
            ErrorCode::AI(AIErrorCode::GenerationTimeout) => true,
            ErrorCode::AI(AIErrorCode::ProviderError) => true,
            ErrorCode::System(SystemErrorCode::NetworkError) => true,
            _ => false,
        }
    }
}

// Conversion helpers
impl From<UIError> for String {
    fn from(err: UIError) -> String {
        serde_json::to_string(&err).unwrap_or(err.message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_code_serialization() {
        let err = UIError::new(
            ErrorCode::AI(AIErrorCode::ModelNotAvailable),
            "Model is currently unavailable",
        );
        assert_eq!(err.code, ErrorCode::AI(AIErrorCode::ModelNotAvailable));
        assert!(!err.retryable);
    }

    #[test]
    fn test_retryable_errors() {
        let rate_limited = UIError::new(
            ErrorCode::Auth(AuthErrorCode::RateLimited),
            "Rate limit exceeded",
        );
        assert!(rate_limited.retryable);

        let invalid_key = UIError::new(
            ErrorCode::Auth(AuthErrorCode::InvalidApiKey),
            "Invalid API key",
        );
        assert!(!invalid_key.retryable);
    }

    #[test]
    fn test_error_with_details() {
        let err = UIError::new(
            ErrorCode::Vault(VaultErrorCode::QueryFailed),
            "Query failed",
        )
        .with_details("SELECT * FROM token WHERE id = '123'")
        .with_retry(5);

        assert_eq!(err.retry_after_secs, Some(5));
        assert!(err.details.is_some());
    }
}
