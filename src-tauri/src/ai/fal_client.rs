//! Fal.ai Serverless Client
//!
//! Handles Cloud Bursting execution via Fal.ai's Queue API.
//! Follows the "Submit -> Poll -> Result" pattern.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::time::Duration;
use tokio::time::sleep;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FalQueueResponse {
    pub request_id: String,
    pub response_url: Option<String>,
    pub status_url: Option<String>,
    pub cancel_url: Option<String>,
    pub logs: Option<Vec<String>>,
    pub metrics: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FalStatusResponse {
    pub status: String, // "IN_QUEUE", "IN_PROGRESS", "COMPLETED", "FAILED"
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FalResult {
    pub images: Option<Vec<FalImage>>,
    pub video: Option<FalVideo>,
    pub audio: Option<FalAudio>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FalImage {
    pub url: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub content_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FalVideo {
    pub url: String,
    pub content_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FalAudio {
    pub url: String,
    pub content_type: Option<String>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

pub struct FalClient {
    api_key: String,
    client: reqwest::Client,
}

impl FalClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }

    /// Submit a request to the queue (Non-blocking)
    pub async fn submit(
        &self,
        endpoint: &str,
        payload: serde_json::Value,
    ) -> Result<FalQueueResponse, String> {
        let url = format!("https://queue.fal.run/{}", endpoint);

        let resp = self
            .client
            .post(&url)
            .header("Authorization", format!("Key {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Fal API Request Failed: {}", e))?;

        if !resp.status().is_success() {
            let error_text = resp.text().await.unwrap_or_else(|_| "Unknown error".into());
            return Err(format!("Fal API Error: {}", error_text));
        }

        resp.json::<FalQueueResponse>()
            .await
            .map_err(|e| format!("Failed to parse queue response: {}", e))
    }

    /// Poll for results with exponential backoff
    pub async fn poll(&self, request_id: &str, timeout_secs: u64) -> Result<FalResult, String> {
        let status_url = format!("https://queue.fal.run/requests/{}/status", request_id);
        let result_url = format!("https://queue.fal.run/requests/{}", request_id);

        let start_time = std::time::Instant::now();
        let mut attempt = 0;

        loop {
            // Check Timeout
            if start_time.elapsed().as_secs() > timeout_secs {
                return Err("Fal Polling Timed Out".into());
            }

            // Check Status
            let status_resp = self
                .client
                .get(&status_url)
                .header("Authorization", format!("Key {}", self.api_key))
                .header("Content-Type", "application/json")
                .send()
                .await
                .map_err(|e| format!("Status Check Failed: {}", e))?;

            let status_data: FalStatusResponse = status_resp
                .json()
                .await
                .map_err(|e| format!("Failed to parse status: {}", e))?;

            match status_data.status.as_str() {
                "COMPLETED" => break, // Success! Break loop to fetch result.
                "FAILED" => return Err(status_data.error.unwrap_or("Unknown Fal Error".into())),
                "IN_QUEUE" | "IN_PROGRESS" => {
                    // Calculating backoff: 500ms * 1.5 ^ attempt (capped at 5s)
                    let backoff_ms = (500.0 * 1.5f64.powi(attempt)).min(5000.0) as u64;
                    sleep(Duration::from_millis(backoff_ms)).await;
                    attempt += 1;
                    continue;
                }
                _ => return Err(format!("Unknown status: {}", status_data.status)),
            }
        }

        // Fetch Final Result
        let result_resp = self
            .client
            .get(&result_url)
            .header("Authorization", format!("Key {}", self.api_key))
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| format!("Result Fetch Failed: {}", e))?;

        result_resp
            .json::<FalResult>()
            .await
            .map_err(|e| format!("Failed to parse result: {}", e))
    }
}
