//! LLM Client - API calls to Gemini, OpenAI, Anthropic
//!
//! Provides unified interface for LLM inference across providers.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::env;

// ═══════════════════════════════════════════════════════════════════════════════
// LLM PROVIDER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum LLMProvider {
    Gemini,
    OpenAI,
    Anthropic,
    Ollama,     // Local
    LlamaStack, // Local (Meta Standard)
    VertexAI,   // GCP Enterprise
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LLMMessage {
    pub role: String, // "user", "assistant", "system"
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LLMRequest {
    pub provider: LLMProvider,
    pub model: String,
    pub messages: Vec<LLMMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LLMResponse {
    pub content: String,
    pub model: String,
    pub usage: Option<TokenUsage>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

// ═══════════════════════════════════════════════════════════════════════════════
// LLM CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

pub struct LLMClient {
    http: Client,
}

impl LLMClient {
    pub fn new() -> Self {
        Self {
            http: Client::new(),
        }
    }

    /// Send a request to an LLM provider
    pub async fn chat(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        match request.provider {
            LLMProvider::Gemini => self.chat_gemini(request).await,
            LLMProvider::OpenAI => self.chat_openai(request).await,
            LLMProvider::Anthropic => self.chat_anthropic(request).await,
            LLMProvider::Ollama => self.chat_ollama(request).await,
            LLMProvider::LlamaStack => self.chat_llama_stack(request).await,
            LLMProvider::VertexAI => self.chat_vertex_ai(request).await,
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LLAMA STACK (Local)
    // ─────────────────────────────────────────────────────────────────────────

    async fn chat_llama_stack(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        let base_url =
            env::var("LLAMA_STACK_PORT").unwrap_or_else(|_| "http://localhost:5000".to_string());

        let model = if request.model.is_empty() {
            "llama3.2-3b"
        } else {
            &request.model
        };

        let mut messages: Vec<serde_json::Value> = Vec::new();

        if let Some(system) = &request.system_prompt {
            messages.push(serde_json::json!({
                "role": "system",
                "content": system
            }));
        }

        for m in &request.messages {
            messages.push(serde_json::json!({
                "role": m.role,
                "content": m.content
            }));
        }

        let body = serde_json::json!({
            "model": model,
            "messages": messages,
            "temperature": request.temperature.unwrap_or(0.7),
            "max_tokens": request.max_tokens.unwrap_or(4096),
            "stream": false
        });

        // Llama Stack usually exposes OpenAI-compatible /v1/chat/completions
        let url = format!("{}/v1/chat/completions", base_url);

        let response = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Llama Stack request failed: {}", e))?;

        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            return Err(format!("Llama Stack error {}: {}", status, text));
        }

        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Parse error: {}", e))?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json.get("usage").map(|u| TokenUsage {
            prompt_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
            total_tokens: u["total_tokens"].as_u64().unwrap_or(0) as u32,
        });

        Ok(LLMResponse {
            content,
            model: model.to_string(),
            usage,
            finish_reason: json["choices"][0]["finish_reason"]
                .as_str()
                .map(String::from),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GEMINI
    // ─────────────────────────────────────────────────────────────────────────

    async fn chat_gemini(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        let api_key = env::var("GOOGLE_API_KEY")
            .or_else(|_| env::var("GEMINI_API_KEY"))
            .map_err(|_| "GOOGLE_API_KEY not set")?;

        let model = if request.model.is_empty() {
            "gemini-2.0-flash"
        } else {
            &request.model
        };

        // Use v1beta for latest features, but consider moving to v1 for production stability
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, api_key
        );

        // Build Gemini request format
        let contents: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": if m.role == "assistant" { "model" } else { "user" },
                    "parts": [{"text": m.content}]
                })
            })
            .collect();

        let mut body = serde_json::json!({
            "contents": contents
        });

        // Add system instruction if provided
        if let Some(system) = &request.system_prompt {
            body["systemInstruction"] = serde_json::json!({
                "parts": [{"text": system}]
            });
        }

        // Add generation config
        body["generationConfig"] = serde_json::json!({
            "temperature": request.temperature.unwrap_or(0.7),
            "maxOutputTokens": request.max_tokens.unwrap_or(8192)
        });

        let response = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Gemini request failed: {}", e))?;

        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            return Err(format!("Gemini error {}: {}", status, text));
        }

        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Parse error: {}", e))?;

        let content = json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json.get("usageMetadata").map(|u| TokenUsage {
            prompt_tokens: u["promptTokenCount"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["candidatesTokenCount"].as_u64().unwrap_or(0) as u32,
            total_tokens: u["totalTokenCount"].as_u64().unwrap_or(0) as u32,
        });

        Ok(LLMResponse {
            content,
            model: model.to_string(),
            usage,
            finish_reason: json["candidates"][0]["finishReason"]
                .as_str()
                .map(String::from),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OPENAI
    // ─────────────────────────────────────────────────────────────────────────

    async fn chat_openai(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        let api_key = env::var("OPENAI_API_KEY").map_err(|_| "OPENAI_API_KEY not set")?;

        let model = if request.model.is_empty() {
            "gpt-4o"
        } else {
            &request.model
        };

        let mut messages: Vec<serde_json::Value> = Vec::new();

        // Add system message if provided
        if let Some(system) = &request.system_prompt {
            messages.push(serde_json::json!({
                "role": "system",
                "content": system
            }));
        }

        // Add conversation messages
        for m in &request.messages {
            messages.push(serde_json::json!({
                "role": m.role,
                "content": m.content
            }));
        }

        let body = serde_json::json!({
            "model": model,
            "messages": messages,
            "temperature": request.temperature.unwrap_or(0.7),
            "max_tokens": request.max_tokens.unwrap_or(4096)
        });

        let response = self
            .http
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("OpenAI request failed: {}", e))?;

        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            return Err(format!("OpenAI error {}: {}", status, text));
        }

        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Parse error: {}", e))?;

        let content = json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json.get("usage").map(|u| TokenUsage {
            prompt_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
            total_tokens: u["total_tokens"].as_u64().unwrap_or(0) as u32,
        });

        Ok(LLMResponse {
            content,
            model: model.to_string(),
            usage,
            finish_reason: json["choices"][0]["finish_reason"]
                .as_str()
                .map(String::from),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANTHROPIC
    // ─────────────────────────────────────────────────────────────────────────

    async fn chat_anthropic(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        let api_key = env::var("ANTHROPIC_API_KEY").map_err(|_| "ANTHROPIC_API_KEY not set")?;

        let model = if request.model.is_empty() {
            "claude-sonnet-4-20250514"
        } else {
            &request.model
        };

        let messages: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            })
            .collect();

        let mut body = serde_json::json!({
            "model": model,
            "messages": messages,
            "max_tokens": request.max_tokens.unwrap_or(4096)
        });

        if let Some(system) = &request.system_prompt {
            body["system"] = serde_json::json!(system);
        }

        let response = self
            .http
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Anthropic request failed: {}", e))?;

        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            return Err(format!("Anthropic error {}: {}", status, text));
        }

        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Parse error: {}", e))?;

        let content = json["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json.get("usage").map(|u| TokenUsage {
            prompt_tokens: u["input_tokens"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["output_tokens"].as_u64().unwrap_or(0) as u32,
            total_tokens: (u["input_tokens"].as_u64().unwrap_or(0)
                + u["output_tokens"].as_u64().unwrap_or(0)) as u32,
        });

        Ok(LLMResponse {
            content,
            model: model.to_string(),
            usage,
            finish_reason: json["stop_reason"].as_str().map(String::from),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OLLAMA (Local)
    // ─────────────────────────────────────────────────────────────────────────

    async fn chat_ollama(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        let base_url =
            env::var("OLLAMA_HOST").unwrap_or_else(|_| "http://localhost:11434".to_string());

        let model = if request.model.is_empty() {
            "llama3.1:8b"
        } else {
            &request.model
        };

        let messages: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": m.role,
                    "content": m.content
                })
            })
            .collect();

        let body = serde_json::json!({
            "model": model,
            "messages": messages,
            "stream": false,
            "options": {
                "temperature": request.temperature.unwrap_or(0.7)
            }
        });

        let response = self
            .http
            .post(format!("{}/api/chat", base_url))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Ollama request failed: {}", e))?;

        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            return Err(format!("Ollama error {}: {}", status, text));
        }

        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Parse error: {}", e))?;

        let content = json["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        Ok(LLMResponse {
            content,
            model: model.to_string(),
            usage: None,
            finish_reason: Some("stop".to_string()),
        })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VERTEX AI (GCP)
    // ─────────────────────────────────────────────────────────────────────────

    async fn chat_vertex_ai(&self, request: LLMRequest) -> Result<LLMResponse, String> {
        let access_token = env::var("GCP_ACCESS_TOKEN").map_err(|_| "GCP_ACCESS_TOKEN not set")?;
        let project_id = env::var("GCP_PROJECT_ID").map_err(|_| "GCP_PROJECT_ID not set")?;
        let region = env::var("GCP_REGION").unwrap_or_else(|_| "us-central1".to_string());

        let model = if request.model.is_empty() {
            "gemini-1.5-pro-001"
        } else {
            &request.model
        };

        let url = format!(
            "https://{}-aiplatform.googleapis.com/v1/projects/{}/locations/{}/publishers/google/models/{}:generateContent",
            region, project_id, region, model
        );

        // Vertex AI mimics Gemini format but auth is different
        let contents: Vec<serde_json::Value> = request
            .messages
            .iter()
            .map(|m| {
                serde_json::json!({
                    "role": if m.role == "assistant" { "model" } else { "user" },
                    "parts": [{"text": m.content}]
                })
            })
            .collect();

        let mut body = serde_json::json!({
            "contents": contents
        });

        if let Some(system) = &request.system_prompt {
            body["systemInstruction"] = serde_json::json!({
                "parts": [{"text": system}]
            });
        }

        body["generationConfig"] = serde_json::json!({
            "temperature": request.temperature.unwrap_or(0.7),
            "maxOutputTokens": request.max_tokens.unwrap_or(8192)
        });

        let response = self
            .http
            .post(&url)
            .header("Authorization", format!("Bearer {}", access_token))
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Vertex AI request failed: {}", e))?;

        let status = response.status();
        let text = response.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            return Err(format!("Vertex AI error {}: {}", status, text));
        }

        let json: serde_json::Value =
            serde_json::from_str(&text).map_err(|e| format!("Parse error: {}", e))?;

        let content = json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = json.get("usageMetadata").map(|u| TokenUsage {
            prompt_tokens: u["promptTokenCount"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["candidatesTokenCount"].as_u64().unwrap_or(0) as u32,
            total_tokens: u["totalTokenCount"].as_u64().unwrap_or(0) as u32,
        });

        Ok(LLMResponse {
            content,
            model: model.to_string(),
            usage,
            finish_reason: json["candidates"][0]["finishReason"]
                .as_str()
                .map(String::from),
        })
    }
}

impl Default for LLMClient {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

use once_cell::sync::Lazy;

static LLM_CLIENT: Lazy<LLMClient> = Lazy::new(LLMClient::new);

pub fn get_llm_client() -> &'static LLMClient {
    &LLM_CLIENT
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_creation() {
        let msg = LLMMessage {
            role: "user".into(),
            content: "Hello".into(),
        };
        assert_eq!(msg.role, "user");
    }
}
