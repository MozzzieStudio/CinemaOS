//! Photography Director - Image generation specialist
//!
//! Enhances user prompts with cinematic details and generates images via ComfyUI

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::{inject_context, PHOTOGRAPHY_SYSTEM_PROMPT},
    Agent, AgentAction, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

pub struct PhotographyDirector {
    /// User-selected LLM provider (default: Gemini)
    llm_provider: LLMProvider,
    /// User-selected model name (default: auto)
    llm_model: Option<String>,
}

impl PhotographyDirector {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini,
            llm_model: None,
        }
    }

    /// Set LLM provider and model (user choice)
    pub fn with_llm(mut self, provider: LLMProvider, model: Option<String>) -> Self {
        self.llm_provider = provider;
        self.llm_model = model;
        self
    }

    /// Enhance user prompt with cinematic details
    async fn enhance_prompt(
        &self,
        user_prompt: &str,
        context: &AgentContext,
    ) -> Result<String, String> {
        let llm = get_llm_client();

        // Build system prompt with context
        let system_prompt = inject_context(PHOTOGRAPHY_SYSTEM_PROMPT, context);

        //  Build user message
        let user_message = format!(
            "User wants to generate an image with this description:\n\n\"{}\"\n\n\
            Enhance this into a detailed, cinematic image prompt. Include:\n\
            - Specific lighting (golden hour, rim light, etc.)\n\
            - Camera specification (lens, focal length)\n\
            - Composition details (rule of thirds, framing)\n\
            - Artistic references if relevant\n\n\
            Output ONLY the enhanced prompt, no explanations.",
            user_prompt
        );

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: user_message,
            }],
            temperature: Some(0.7),
            max_tokens: Some(500),
            system_prompt: Some(system_prompt),
        };

        let response = llm.chat(request).await?;
        Ok(response.content.trim().to_string())
    }
}

impl Default for PhotographyDirector {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for PhotographyDirector {
    fn name(&self) -> &str {
        "Photography Director"
    }

    fn capability(&self) -> AgentCapability {
        AgentCapability::Photography
    }

    fn description(&self) -> &str {
        "Image generation specialist - enhances prompts and generates cinematic stills"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();

        // Enhance prompt using LLM
        let enhanced_prompt = self.enhance_prompt(message, &context).await.map_err(|e| {
            AgentError::ProcessingFailed(format!("Failed to enhance prompt: {}", e))
        })?;

        // Build response with enhanced prompt and action
        let response_content = format!(
            "I've enhanced your image request with cinematic details:\n\n\
            **Original**: {}\n\n\
            **Enhanced Prompt**: {}\n\n\
            I can now generate this image via ComfyUI. Would you like me to proceed?",
            message, enhanced_prompt
        );

        // Suggest action to generate image
        let actions = vec![AgentAction::GenerateImage {
            prompt: enhanced_prompt,
            model: "auto".to_string(),
            width: 1024,
            height: 1024,
            token_ids: vec![],
        }];

        let processing_time = start_time.elapsed().as_millis() as u64;

        // Determine model used (December 2025)
        let model_name = match self.llm_provider {
            LLMProvider::Gemini => self
                .llm_model
                .clone()
                .unwrap_or_else(|| "gemini-2.5-flash".to_string()),
            LLMProvider::OpenAI => self
                .llm_model
                .clone()
                .unwrap_or_else(|| "gpt-4o".to_string()),
            LLMProvider::Anthropic => self
                .llm_model
                .clone()
                .unwrap_or_else(|| "claude-sonnet-4-5".to_string()),
            LLMProvider::Ollama => self
                .llm_model
                .clone()
                .unwrap_or_else(|| "llama3.1:8b".to_string()),
            LLMProvider::LlamaStack => self
                .llm_model
                .clone()
                .unwrap_or_else(|| "llama3.2-3b".to_string()),
            LLMProvider::VertexAI => self
                .llm_model
                .clone()
                .unwrap_or_else(|| "gemini-1.5-pro-001".to_string()),
        };

        let location = match self.llm_provider {
            LLMProvider::Ollama | LLMProvider::LlamaStack => ProcessingLocation::Local,
            _ => ProcessingLocation::Cloud,
        };

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: response_content,
            actions,
            cost: Some(0.001), // Approximate cost for prompt enhancement
            metadata: AgentMetadata {
                model: model_name,
                processing_time_ms: processing_time,
                tokens: None,
                location,
            },
        })
    }

    async fn estimate_cost(&self, _message: &str) -> f32 {
        // LLM call + potential image generation
        match self.llm_provider {
            LLMProvider::Ollama => 0.0, // Local is free
            LLMProvider::LlamaStack => 0.0,
            LLMProvider::Gemini => 0.001, // Gemini Flash is very cheap
            LLMProvider::OpenAI => 0.01,  // GPT-4o
            LLMProvider::Anthropic => 0.015, // Claude
            LLMProvider::VertexAI => 0.005, // Vertex AI
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = PhotographyDirector::new();
        assert_eq!(agent.name(), "Photography Director");
        assert_eq!(agent.capability(), AgentCapability::Photography);
    }

    #[test]
    fn test_with_llm() {
        let agent =
            PhotographyDirector::new().with_llm(LLMProvider::OpenAI, Some("gpt-4o".to_string()));

        assert_eq!(agent.llm_provider, LLMProvider::OpenAI);
        assert_eq!(agent.llm_model, Some("gpt-4o".to_string()));
    }
}
