//! ComfyUI WebSocket client
//!
//! Handles communication with ComfyUI API via WebSocket and HTTP.

use crate::errors::AppError;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// ComfyUI client
pub struct ComfyUIClient {
    base_url: String,
}

impl ComfyUIClient {
    /// Create new client
    pub fn new(host: &str, port: u16) -> Self {
        Self {
            base_url: format!("http://{}:{}", host, port),
        }
    }

    /// Queue a workflow for execution
    pub async fn queue_prompt(&self, workflow: Value) -> Result<QueueResponse, AppError> {
        let client = reqwest::Client::new();
        let url = format!("{}/prompt", self.base_url);

        let response = client
            .post(&url)
            .json(&serde_json::json!({ "prompt": workflow }))
            .send()
            .await
            .map_err(|e| AppError::ApiRequest(format!("Failed to queue prompt: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ApiRequest(format!(
                "Queue request failed with status: {}",
                response.status()
            )));
        }

        response
            .json()
            .await
            .map_err(|e| AppError::ApiResponse(format!("Failed to parse response: {}", e)))
    }

    /// Get workflow execution history
    pub async fn get_history(&self, prompt_id: &str) -> Result<HistoryResponse, AppError> {
        let client = reqwest::Client::new();
        let url = format!("{}/history/{}", self.base_url, prompt_id);

        let response = client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::ApiRequest(format!("Failed to get history: {}", e)))?;

        response
            .json()
            .await
            .map_err(|e| AppError::ApiResponse(format!("Failed to parse history: {}", e)))
    }

    /// Get system stats
    pub async fn get_system_stats(&self) -> Result<SystemStats, AppError> {
        let client = reqwest::Client::new();
        let url = format!("{}/system_stats", self.base_url);

        let response = client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::ApiRequest(format!("Failed to get stats: {}", e)))?;

        response
            .json()
            .await
            .map_err(|e| AppError::ApiResponse(format!("Failed to parse stats: {}", e)))
    }
}

/// Queue response from ComfyUI
#[derive(Debug, Serialize, Deserialize)]
pub struct QueueResponse {
    pub prompt_id: String,
    pub number: u32,
    pub node_errors: Option<Value>,
}

/// History response
#[derive(Debug, Serialize, Deserialize)]
pub struct HistoryResponse {
    #[serde(flatten)]
    pub data: std::collections::HashMap<String, HistoryEntry>,
}

/// Single history entry
#[derive(Debug, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub prompt: Value,
    pub outputs: std::collections::HashMap<String, OutputNode>,
}

/// Output node  
#[derive(Debug, Serialize, Deserialize)]
pub struct OutputNode {
    pub images: Option<Vec<ImageOutput>>,
}

/// Image output
#[derive(Debug, Serialize, Deserialize)]
pub struct ImageOutput {
    pub filename: String,
    pub subfolder: String,
    #[serde(rename = "type")]
    pub output_type: String,
}

/// System stats
#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub system: System,
    pub devices: Vec<Device>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct System {
    pub os: String,
    pub python_version: String,
    pub embedded_python: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Device {
    pub name: String,
    #[serde(rename = "type")]
    pub device_type: String,
    pub index: u32,
    pub vram_total: Option<u64>,
    pub vram_free: Option<u64>,
    pub torch_vram_total: Option<u64>,
    pub torch_vram_free: Option<u64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let client = ComfyUIClient::new("127.0.0.1", 8188);
        assert_eq!(client.base_url, "http://127.0.0.1:8188");
    }
}
