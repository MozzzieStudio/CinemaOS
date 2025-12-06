//! Fal.ai client for Flux, Kling, and other models

use crate::config::Config;
use anyhow::Result;
use serde::{Deserialize, Serialize};

/// Fal.ai client
#[derive(Clone)]
pub struct FalClient {
    api_key: String,
    http_client: reqwest::Client,
}

/// Image generation request
#[derive(Debug, Serialize)]
pub struct FalImageRequest {
    pub prompt: String,
    pub model: String,
    pub image_size: Option<String>,
    pub num_images: Option<u32>,
}

/// Video generation request
#[derive(Debug, Serialize)]
pub struct FalVideoRequest {
    pub prompt: String,
    pub model: String,
    pub duration: Option<f32>,
    pub image_url: Option<String>, // For image-to-video
}

/// Generation response
#[derive(Debug, Deserialize)]
pub struct FalResponse {
    pub request_id: String,
    pub status: String,
    pub output: Option<FalOutput>,
}

/// Generation output
#[derive(Debug, Deserialize)]
pub struct FalOutput {
    pub images: Option<Vec<FalImage>>,
    pub video: Option<FalVideo>,
}

#[derive(Debug, Deserialize)]
pub struct FalImage {
    pub url: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Deserialize)]
pub struct FalVideo {
    pub url: String,
}

impl FalClient {
    /// Create a new Fal.ai client
    pub fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            api_key: config.fal_api_key.clone(),
            http_client: reqwest::Client::new(),
        })
    }

    /// Generate image with Flux
    pub async fn generate_image(&self, request: FalImageRequest) -> Result<FalResponse> {
        let model_endpoint = match request.model.as_str() {
            "flux-pro" => "fal-ai/flux-pro/v1.1",
            "flux-dev" => "fal-ai/flux/dev",
            "flux-schnell" => "fal-ai/flux/schnell",
            _ => "fal-ai/flux/schnell", // Default to fast model
        };

        let url = format!("https://fal.run/{}", model_endpoint);

        let body = serde_json::json!({
            "prompt": request.prompt,
            "image_size": request.image_size.unwrap_or_else(|| "landscape_16_9".to_string()),
            "num_images": request.num_images.unwrap_or(1),
            "enable_safety_checker": true
        });

        let response = self.http_client
            .post(&url)
            .header("Authorization", format!("Key {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let result: FalResponse = response.json().await?;
        Ok(result)
    }

    /// Generate video with Kling
    pub async fn generate_video(&self, request: FalVideoRequest) -> Result<FalResponse> {
        let model_endpoint = match request.model.as_str() {
            "kling-pro" => "fal-ai/kling-video/v1.6/pro/image-to-video",
            "kling-standard" => "fal-ai/kling-video/v1.6/standard/image-to-video",
            _ => "fal-ai/kling-video/v1.6/standard/image-to-video",
        };

        let url = format!("https://fal.run/{}", model_endpoint);

        let mut body = serde_json::json!({
            "prompt": request.prompt,
            "duration": request.duration.unwrap_or(5.0),
        });

        if let Some(image_url) = &request.image_url {
            body["image_url"] = serde_json::json!(image_url);
        }

        let response = self.http_client
            .post(&url)
            .header("Authorization", format!("Key {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let result: FalResponse = response.json().await?;
        Ok(result)
    }

    /// Submit async job (for long-running tasks)
    pub async fn submit_async(&self, endpoint: &str, body: serde_json::Value) -> Result<String> {
        let url = format!("https://queue.fal.run/{}", endpoint);

        let response = self.http_client
            .post(&url)
            .header("Authorization", format!("Key {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let result: serde_json::Value = response.json().await?;
        let request_id = result["request_id"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("No request_id in response"))?;

        Ok(request_id.to_string())
    }

    /// Check job status
    pub async fn get_status(&self, endpoint: &str, request_id: &str) -> Result<FalResponse> {
        let url = format!("https://queue.fal.run/{}/requests/{}/status", endpoint, request_id);

        let response = self.http_client
            .get(&url)
            .header("Authorization", format!("Key {}", self.api_key))
            .send()
            .await?;

        let result: FalResponse = response.json().await?;
        Ok(result)
    }

    /// Get job result
    pub async fn get_result(&self, endpoint: &str, request_id: &str) -> Result<FalResponse> {
        let url = format!("https://queue.fal.run/{}/requests/{}", endpoint, request_id);

        let response = self.http_client
            .get(&url)
            .header("Authorization", format!("Key {}", self.api_key))
            .send()
            .await?;

        let result: FalResponse = response.json().await?;
        Ok(result)
    }
}
