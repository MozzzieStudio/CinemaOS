//! ComfyUI Client - Process Management and WebSocket Communication
//!
//! Handles:
//! - Starting/stopping local ComfyUI process
//! - WebSocket connection for workflow execution
//! - Progress tracking and result parsing

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tokio_tungstenite::{connect_async, tungstenite::Message};

// ═══════════════════════════════════════════════════════════════════════════════
// CONNECTION STATE
// ═══════════════════════════════════════════════════════════════════════════════

/// ComfyUI connection status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
    Error(String),
}

/// ComfyUI client configuration
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ComfyUIConfig {
    /// Host address (default: 127.0.0.1)
    pub host: String,
    /// Port (default: 8188)
    pub port: u16,
    /// Use HTTPS/WSS
    pub use_ssl: bool,
}

impl Default for ComfyUIConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".into(),
            port: 8188,
            use_ssl: false,
        }
    }
}

impl ComfyUIConfig {
    pub fn ws_url(&self) -> String {
        let protocol = if self.use_ssl { "wss" } else { "ws" };
        format!("{}://{}:{}/ws", protocol, self.host, self.port)
    }

    pub fn http_url(&self) -> String {
        let protocol = if self.use_ssl { "https" } else { "http" };
        format!("{}://{}:{}", protocol, self.host, self.port)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

/// Progress update from ComfyUI
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProgressUpdate {
    pub execution_id: String,
    pub node_id: String,
    pub progress: f32,
    pub status: String,
}

/// Execution result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ExecutionResult {
    pub execution_id: String,
    pub success: bool,
    /// Output data as JSON string (for specta compatibility)
    pub outputs_json: String,
    pub error: Option<String>,
}

/// Output data per node (internal use)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputData {
    pub node_id: String,
    pub output_type: String,
    pub data: serde_json::Value,
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMFYUI CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

/// The main ComfyUI client
pub struct ComfyUIClient {
    config: ComfyUIConfig,
    status: Arc<RwLock<ConnectionStatus>>,
    http_client: reqwest::Client,
}

impl ComfyUIClient {
    /// Create a new ComfyUI client
    pub fn new(config: ComfyUIConfig) -> Self {
        Self {
            config,
            status: Arc::new(RwLock::new(ConnectionStatus::Disconnected)),
            http_client: reqwest::Client::new(),
        }
    }

    /// Create with default config (localhost:8188)
    pub fn default_local() -> Self {
        Self::new(ComfyUIConfig::default())
    }

    /// Get current connection status
    pub async fn status(&self) -> ConnectionStatus {
        self.status.read().await.clone()
    }

    /// Check if ComfyUI server is reachable
    pub async fn ping(&self) -> Result<bool, String> {
        let url = format!("{}/system_stats", self.config.http_url());

        match self.http_client.get(&url).send().await {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(e) => Err(format!("Failed to ping ComfyUI: {}", e)),
        }
    }

    /// Get available models from ComfyUI
    pub async fn get_models(&self) -> Result<Vec<String>, String> {
        let url = format!("{}/object_info", self.config.http_url());

        let resp = self
            .http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to get models: {}", e))?;

        let data: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        // Extract checkpoint names from CheckpointLoaderSimple
        let models = data
            .get("CheckpointLoaderSimple")
            .and_then(|n| n.get("input"))
            .and_then(|n| n.get("required"))
            .and_then(|n| n.get("ckpt_name"))
            .and_then(|n| n.get(0))
            .and_then(|n| n.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();

        Ok(models)
    }

    /// Execute a workflow and return results
    pub async fn execute(
        &self,
        prompt: serde_json::Value,
        progress_tx: Option<mpsc::Sender<ProgressUpdate>>,
    ) -> Result<ExecutionResult, String> {
        let client_id = uuid::Uuid::new_v4().to_string();

        // Update status
        *self.status.write().await = ConnectionStatus::Connecting;

        // Connect to WebSocket
        let ws_url = format!("{}?clientId={}", self.config.ws_url(), client_id);

        let (ws_stream, _) = connect_async(&ws_url)
            .await
            .map_err(|e| format!("WebSocket connection failed: {}", e))?;

        let (_write, mut read) = ws_stream.split();

        *self.status.write().await = ConnectionStatus::Connected;

        // Queue the prompt
        let queue_url = format!("{}/prompt", self.config.http_url());
        let queue_body = serde_json::json!({
            "prompt": prompt,
            "client_id": client_id
        });

        let queue_resp = self
            .http_client
            .post(&queue_url)
            .json(&queue_body)
            .send()
            .await
            .map_err(|e| format!("Failed to queue prompt: {}", e))?;

        let queue_data: serde_json::Value = queue_resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse queue response: {}", e))?;

        let prompt_id = queue_data
            .get("prompt_id")
            .and_then(|v| v.as_str())
            .ok_or("No prompt_id in response")?
            .to_string();

        // Listen for progress and completion
        let mut outputs: HashMap<String, OutputData> = HashMap::new();
        let mut error: Option<String> = None;

        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                        let msg_type = data.get("type").and_then(|v| v.as_str()).unwrap_or("");

                        match msg_type {
                            "progress" => {
                                if let Some(tx) = &progress_tx {
                                    let update = ProgressUpdate {
                                        execution_id: prompt_id.clone(),
                                        node_id: data
                                            .get("data")
                                            .and_then(|d| d.get("node"))
                                            .and_then(|v| v.as_str())
                                            .unwrap_or("")
                                            .to_string(),
                                        progress: data
                                            .get("data")
                                            .and_then(|d| d.get("value"))
                                            .and_then(|v| v.as_f64())
                                            .unwrap_or(0.0)
                                            as f32,
                                        status: "running".into(),
                                    };
                                    let _ = tx.send(update).await;
                                }
                            }
                            "executed" => {
                                // Node completed, extract output
                                if let Some(output_data) =
                                    data.get("data").and_then(|d| d.get("output"))
                                {
                                    let node_id = data
                                        .get("data")
                                        .and_then(|d| d.get("node"))
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("")
                                        .to_string();

                                    outputs.insert(
                                        node_id.clone(),
                                        OutputData {
                                            node_id,
                                            output_type: "image".into(),
                                            data: output_data.clone(),
                                        },
                                    );
                                }
                            }
                            "execution_error" => {
                                error = Some(
                                    data.get("data")
                                        .and_then(|d| d.get("exception_message"))
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("Unknown error")
                                        .to_string(),
                                );
                                break;
                            }
                            "execution_complete" | "execution_cached" => {
                                let completed_id = data
                                    .get("data")
                                    .and_then(|d| d.get("prompt_id"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("");

                                if completed_id == prompt_id {
                                    break;
                                }
                            }
                            _ => {}
                        }
                    }
                }
                Ok(Message::Close(_)) => break,
                Err(e) => {
                    error = Some(format!("WebSocket error: {}", e));
                    break;
                }
                _ => {}
            }
        }

        *self.status.write().await = ConnectionStatus::Disconnected;

        // Convert outputs to JSON string for specta compatibility
        let outputs_json = serde_json::to_string(&outputs).unwrap_or_default();

        Ok(ExecutionResult {
            execution_id: prompt_id,
            success: error.is_none(),
            outputs_json,
            error,
        })
    }

    /// Get history of executions
    pub async fn get_history(&self, prompt_id: &str) -> Result<serde_json::Value, String> {
        let url = format!("{}/history/{}", self.config.http_url(), prompt_id);

        let resp = self
            .http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to get history: {}", e))?;

        resp.json()
            .await
            .map_err(|e| format!("Failed to parse history: {}", e))
    }

    /// Get a generated image
    pub async fn get_image(
        &self,
        filename: &str,
        subfolder: &str,
        folder_type: &str,
    ) -> Result<Vec<u8>, String> {
        let url = format!(
            "{}/view?filename={}&subfolder={}&type={}",
            self.config.http_url(),
            filename,
            subfolder,
            folder_type
        );

        let resp = self
            .http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to get image: {}", e))?;

        resp.bytes()
            .await
            .map(|b| b.to_vec())
            .map_err(|e| format!("Failed to read image bytes: {}", e))
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL CLIENT (Singleton)
// ═══════════════════════════════════════════════════════════════════════════════

use std::sync::OnceLock;

static COMFYUI_CLIENT: OnceLock<ComfyUIClient> = OnceLock::new();

/// Get or create the global ComfyUI client
pub fn get_client() -> &'static ComfyUIClient {
    COMFYUI_CLIENT.get_or_init(ComfyUIClient::default_local)
}

/// Initialize with custom config
pub fn init_client(config: ComfyUIConfig) -> &'static ComfyUIClient {
    COMFYUI_CLIENT.get_or_init(|| ComfyUIClient::new(config))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_urls() {
        let config = ComfyUIConfig::default();
        assert_eq!(config.ws_url(), "ws://127.0.0.1:8188/ws");
        assert_eq!(config.http_url(), "http://127.0.0.1:8188");
    }

    #[test]
    fn test_ssl_urls() {
        let config = ComfyUIConfig {
            host: "comfy.cloud".into(),
            port: 443,
            use_ssl: true,
        };
        assert_eq!(config.ws_url(), "wss://comfy.cloud:443/ws");
        assert_eq!(config.http_url(), "https://comfy.cloud:443");
    }
}
