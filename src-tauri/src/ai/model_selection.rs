//! Model selection types for user control

use crate::ai::llm_client::LLMProvider;
use serde::{Deserialize, Serialize};

/// User's model selection for an agent
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ModelSelection {
    pub provider: String,      // "gemini", "openai", "anthropic", "ollama"
    pub model: Option<String>, // Specific model or auto
}

impl ModelSelection {
    pub fn to_llm_provider(&self) -> LLMProvider {
        match self.provider.to_lowercase().as_str() {
            "openai" => LLMProvider::OpenAI,
            "anthropic" => LLMProvider::Anthropic,
            "ollama" => LLMProvider::Ollama,
            _ => LLMProvider::Gemini, // Default
        }
    }
}

impl Default for ModelSelection {
    fn default() -> Self {
        Self {
            provider: "gemini".to_string(),
            model: None,
        }
    }
}
