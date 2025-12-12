/**
 * Error Codes for UI - TypeScript Types
 *
 * These types mirror the Rust error codes in src-tauri/src/errors/codes.rs
 * They are generated automatically by Tauri Specta.
 */

export type ErrorDomain =
  | { domain: "Auth"; code: AuthErrorCode }
  | { domain: "Vault"; code: VaultErrorCode }
  | { domain: "AI"; code: AIErrorCode }
  | { domain: "File"; code: FileErrorCode }
  | { domain: "System"; code: SystemErrorCode };

export type AuthErrorCode =
  | "AUTH_001" // InvalidApiKey
  | "AUTH_002" // RateLimited
  | "AUTH_003" // CreditsExhausted
  | "AUTH_004"; // Unauthorized

export type VaultErrorCode =
  | "VAULT_001" // ConnectionFailed
  | "VAULT_002" // SaveFailed
  | "VAULT_003" // QueryFailed
  | "VAULT_004" // NotFound
  | "VAULT_005"; // SyncConflict

export type AIErrorCode =
  | "AI_001" // ModelNotAvailable
  | "AI_002" // GenerationTimeout
  | "AI_003" // CreditLimitReached
  | "AI_004" // InvalidPrompt
  | "AI_005" // ProviderError
  | "AI_006"; // QuotaExceeded

export type FileErrorCode =
  | "FILE_001" // NotFound
  | "FILE_002" // PermissionDenied
  | "FILE_003" // InvalidFormat
  | "FILE_004"; // TooLarge

export type SystemErrorCode =
  | "SYS_001" // OutOfMemory
  | "SYS_002" // GPUNotAvailable
  | "SYS_003" // NetworkError
  | "SYS_004"; // Unknown

/**
 * UI Error with structured code
 */
export interface UIError {
  code: ErrorDomain;
  message: string;
  details?: string;
  retryable: boolean;
  retry_after_secs?: number;
  timestamp: string;
}

/**
 * Parse error code to human-readable string
 */
export function getErrorCodeLabel(code: ErrorDomain): string {
  const labels: Record<string, string> = {
    AUTH_001: "Invalid API Key",
    AUTH_002: "Rate Limited",
    AUTH_003: "Credits Exhausted",
    AUTH_004: "Unauthorized",
    VAULT_001: "Database Connection Failed",
    VAULT_002: "Save Failed",
    VAULT_003: "Query Failed",
    VAULT_004: "Not Found",
    VAULT_005: "Sync Conflict",
    AI_001: "Model Not Available",
    AI_002: "Generation Timeout",
    AI_003: "Credit Limit Reached",
    AI_004: "Invalid Prompt",
    AI_005: "Provider Error",
    AI_006: "Quota Exceeded",
    FILE_001: "File Not Found",
    FILE_002: "Permission Denied",
    FILE_003: "Invalid Format",
    FILE_004: "File Too Large",
    SYS_001: "Out of Memory",
    SYS_002: "GPU Not Available",
    SYS_003: "Network Error",
    SYS_004: "Unknown Error",
  };

  return labels[code.code] || "Unknown Error";
}

/**
 * Get user-friendly error message
 */
export function formatError(error: UIError): string {
  const label = getErrorCodeLabel(error.code);
  let message = `${label}: ${error.message}`;

  if (error.retryable && error.retry_after_secs) {
    message += ` (Retry after ${error.retry_after_secs}s)`;
  }

  return message;
}

/**
 * Check if error should show retry button
 */
export function isRetryable(error: UIError): boolean {
  return error.retryable;
}
