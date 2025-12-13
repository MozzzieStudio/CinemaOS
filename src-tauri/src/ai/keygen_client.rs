//! Keygen.sh Client
//!
//! Handles License Verification, Machine Activation, and Heartbeats.
//! Implements "Zombie Protection" to ensure seat limits are respected.

use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::sleep;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeygenConfig {
    pub account_id: String,
    pub product_id: String,
    pub public_key: Option<String>, // For verifies (not used in MVP)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub id: String,
    pub key: String,
    pub status: String, // "ACTIVE", "EXPIRED", etc.
    pub expiry: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MachineInfo {
    pub id: String,
    pub fingerprint: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct KeygenErrorResponse {
    errors: Vec<KeygenErrorDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct KeygenErrorDetail {
    title: String,
    detail: String,
    code: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

pub struct KeygenClient {
    config: KeygenConfig,
    client: reqwest::Client,
}

impl KeygenClient {
    pub fn new(account_id: String, product_id: String) -> Self {
        Self {
            config: KeygenConfig {
                account_id,
                product_id,
                public_key: None,
            },
            client: reqwest::Client::new(),
        }
    }

    /// Validate a license key
    pub async fn validate_license(&self, key: &str) -> Result<LicenseInfo, String> {
        let url = format!(
            "https://api.keygen.sh/v1/accounts/{}/licenses/actions/validate-key",
            self.config.account_id
        );

        let body = serde_json::json!({
            "meta": {
                "key": key
            }
        });

        let resp = self
            .client
            .post(&url)
            .json(&body)
            .header("Content-Type", "application/vnd.api+json")
            .header("Accept", "application/vnd.api+json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();

        if !status.is_success() {
            // Parse error code if possible
            if let Ok(err_json) = serde_json::from_str::<KeygenErrorResponse>(&text) {
                if let Some(first) = err_json.errors.first() {
                    return Err(format!("{}: {}", first.title, first.detail));
                }
            }
            return Err(format!("Validation failed: {}", text));
        }

        // Parse success
        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Invalid JSON: {}", e))?;

        let data = json.get("data").ok_or("No data in response")?;

        let id = data
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let attrs = data.get("attributes").ok_or("No attributes")?;
        let status_str = attrs
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("UNKNOWN")
            .to_string();
        let expiry = attrs
            .get("expiry")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        // Basic check
        if status_str != "ACTIVE" {
            return Err(format!("License is {}", status_str));
        }

        Ok(LicenseInfo {
            id,
            key: key.to_string(),
            status: status_str,
            expiry,
        })
    }

    /// Activate the current machine
    pub async fn activate_machine(
        &self,
        license_id: &str,
        fingerprint: &str,
        name: &str,
        auth_token: &str, // Bearer token usually needed for activation if not using key
    ) -> Result<MachineInfo, String> {
        let url = format!(
            "https://api.keygen.sh/v1/accounts/{}/machines",
            self.config.account_id
        );

        let body = serde_json::json!({
            "data": {
                "type": "machines",
                "attributes": {
                    "fingerprint": fingerprint,
                    "platform": std::env::consts::OS,
                    "name": name
                },
                "relationships": {
                    "license": {
                        "data": {
                            "type": "licenses",
                            "id": license_id
                        }
                    }
                }
            }
        });

        let resp = self
            .client
            .post(&url)
            .bearer_auth(auth_token)
            .json(&body)
            .header("Content-Type", "application/vnd.api+json")
            .header("Accept", "application/vnd.api+json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();

        if status.as_u16() == 422 {
            // Already activated? Or limit reached?
            // If MACHINE_LIMIT_EXCEEDED, we might want to suggest deactivating others.
            if let Ok(err_json) = serde_json::from_str::<KeygenErrorResponse>(&text) {
                if let Some(first) = err_json.errors.first() {
                    return Err(format!("Activation Error: {}", first.code));
                }
            }
        }

        if !status.is_success() {
            return Err(format!("Activation failed: {}", text));
        }

        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Invalid JSON: {}", e))?;

        let data = json.get("data").ok_or("No data")?;
        let id = data
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        Ok(MachineInfo {
            id,
            fingerprint: fingerprint.to_string(),
            name: name.to_string(),
        })
    }

    /// Send a heartbeat to keep the machine active
    pub async fn send_heartbeat(&self, machine_id: &str, auth_token: &str) -> Result<(), String> {
        let url = format!(
            "https://api.keygen.sh/v1/accounts/{}/machines/{}/actions/ping-heartbeat",
            self.config.account_id, machine_id
        );

        let resp = self
            .client
            .post(&url)
            .bearer_auth(auth_token)
            .header("Content-Type", "application/vnd.api+json")
            .header("Accept", "application/vnd.api+json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !resp.status().is_success() {
            // If 404, machine might have been deleted (zombie). Re-activation needed by caller.
            if resp.status() == reqwest::StatusCode::NOT_FOUND {
                return Err("MACHINE_NOT_FOUND".into());
            }
            return Err(format!("Heartbeat failed: {}", resp.status()));
        }

        Ok(())
    }
}
