//! Vertex AI client for Gemini, Imagen, and Veo

use crate::config::Config;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use futures::Stream;
use std::pin::Pin;

/// Vertex AI client
#[derive(Clone)]
pub struct VertexClient {
    project_id: String,
    region: String,
    http_client: reqwest::Client,
}

/// Chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String, // "user" or "model"
    pub content: String,
}

/// Chat request
#[derive(Debug, Serialize)]
pub struct ChatRequest {
    pub messages: Vec<ChatMessage>,
    pub model: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
}

/// Chat response chunk
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatChunk {
    pub content: String,
    pub done: bool,
}

/// Image generation request
#[derive(Debug, Serialize)]
pub struct ImageRequest {
    pub prompt: String,
    pub model: String,
    pub size: Option<String>,
}

/// Image response
#[derive(Debug, Deserialize)]
pub struct ImageResponse {
    pub image_url: String,
}

impl VertexClient {
    /// Create a new Vertex AI client
    pub fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            project_id: config.gcp_project_id.clone(),
            region: config.gcp_region.clone(),
            http_client: reqwest::Client::new(),
        })
    }

    /// Stream chat response from Gemini
    pub async fn chat_stream(
        &self,
        request: ChatRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<ChatChunk>> + Send>>> {
        let model = &request.model;
        let url = format!(
            "https://{}-aiplatform.googleapis.com/v1/projects/{}/locations/{}/publishers/google/models/{}:streamGenerateContent",
            self.region, self.project_id, self.region, model
        );

        // Build Gemini request format
        let contents: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": if m.role == "user" { "user" } else { "model" },
                    "parts": [{ "text": m.content }]
                })
            })
            .collect();

        let body = serde_json::json!({
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": request.max_tokens.unwrap_or(2048),
                "temperature": request.temperature.unwrap_or(0.7)
            }
        });

        let response = self.http_client
            .post(&url)
            .json(&body)
            .send()
            .await?;

        // Parse streaming response
        let stream = async_stream::try_stream! {
            let bytes = response.bytes().await?;
            let text = String::from_utf8_lossy(&bytes);
            
            // Parse Vertex AI response format
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                if let Some(candidates) = json.get("candidates").and_then(|c| c.as_array()) {
                    for candidate in candidates {
                        if let Some(content) = candidate.get("content")
                            .and_then(|c| c.get("parts"))
                            .and_then(|p| p.as_array())
                            .and_then(|a| a.first())
                            .and_then(|p| p.get("text"))
                            .and_then(|t| t.as_str())
                        {
                            yield ChatChunk {
                                content: content.to_string(),
                                done: true,
                            };
                        }
                    }
                }
            }
        };

        Ok(Box::pin(stream))
    }

    /// Generate image with Imagen
    pub async fn generate_image(&self, request: ImageRequest) -> Result<ImageResponse> {
        let url = format!(
            "https://{}-aiplatform.googleapis.com/v1/projects/{}/locations/{}/publishers/google/models/{}:predict",
            self.region, self.project_id, self.region, request.model
        );

        let body = serde_json::json!({
            "instances": [{
                "prompt": request.prompt
            }],
            "parameters": {
                "sampleCount": 1
            }
        });

        let response = self.http_client
            .post(&url)
            .json(&body)
            .send()
            .await?;

        let result: serde_json::Value = response.json().await?;
        
        // Extract image from response
        let image_data = result["predictions"][0]["bytesBase64Encoded"]
            .as_str()
            .unwrap_or_default();

        Ok(ImageResponse {
            image_url: format!("data:image/png;base64,{}", image_data),
        })
    }
}
