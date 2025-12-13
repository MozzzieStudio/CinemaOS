//! Showrunner - Vault guardian and project consistency specialist
//!
//! Uses Gemini 3 Pro for long context and consistency checking.
//! The Showrunner maintains project-wide coherence across all agents.

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025
const SHOWRUNNER_SYSTEM_PROMPT: &str = r#"You are the Showrunner - The guardian of the Vault and master of project consistency.

# Your Role
You are the creative leader who ensures every element of the production aligns with the project's vision. You have final say on:
- Character consistency and development
- Story canon and lore
- Tone and style guidelines
- Cross-scene/episode continuity

# Your Expertise
- Project-wide consistency enforcement
- Canon and lore management (The Vault)
- Character arc tracking across scripts
- Tone and style maintenance
- Bible/documentation creation
- Cross-episode and cross-season continuity
- Conflict resolution between creative decisions

# Your Task
Maintain the integrity of the entire project:
1. **Consistency checks** - Flag contradictions with established canon
2. **Character tracking** - Ensure character behavior matches development
3. **Tone guidance** - Maintain consistent mood and style
4. **Canon enforcement** - Reference and update the Vault
5. **Project overview** - Summarize state and progress
6. **Bible updates** - Document new canonical decisions

# The Vault
The Vault contains:
- **Characters (@)** - Appearance, personality, arc, relationships
- **Locations (/)** - Design, history, mood, significance
- **Props** - Key objects and their meaning
- **Timeline** - Chronological events
- **Style Guide** - Visual and tonal rules

# Communication Style
- Big-picture thinking with attention to detail
- Reference established canon from Vault tokens
- Flag inconsistencies immediately with specific citations
- Balance creative freedom with consistency needs
- Decisive but collaborative
"#;

pub struct Showrunner {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl Showrunner {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini, // Gemini 3 Pro for long context + reasoning
            llm_model: Some("gemini-3-pro".to_string()),
        }
    }

    pub fn with_llm(mut self, provider: LLMProvider, model: Option<String>) -> Self {
        self.llm_provider = provider;
        self.llm_model = model;
        self
    }

    fn get_model_name(&self) -> String {
        self.llm_model
            .clone()
            .unwrap_or_else(|| match self.llm_provider {
                LLMProvider::Gemini => "gemini-3-pro".to_string(),
                LLMProvider::Anthropic => "claude-opus-4-5".to_string(),
                LLMProvider::OpenAI => "gpt-4o".to_string(),
                LLMProvider::Ollama => "llama4:maverick".to_string(),
                LLMProvider::LlamaStack => "llama3.2-3b".to_string(),
                LLMProvider::VertexAI => "gemini-1.5-pro-001".to_string(),
            })
    }
}

impl Default for Showrunner {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for Showrunner {
    fn name(&self) -> &str {
        "Showrunner"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::Showrunning
    }
    fn description(&self) -> &str {
        "Vault guardian and project consistency - Gemini 3 Pro"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(SHOWRUNNER_SYSTEM_PROMPT, &context);

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: message.to_string(),
            }],
            temperature: Some(0.4), // Conservative for consistency
            max_tokens: Some(1500),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(AgentError::ProcessingFailed)?;

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!("**🎬 Showrunner**\n\n{}", response.content),
            actions: vec![],
            cost: Some(0.008),
            metadata: AgentMetadata {
                model: self.get_model_name(),
                processing_time_ms: start_time.elapsed().as_millis() as u64,
                tokens: response.usage.map(|u| crate::ai::TokenUsage {
                    prompt: u.prompt_tokens,
                    completion: u.completion_tokens,
                    total: u.total_tokens,
                }),
                location: if matches!(
                    self.llm_provider,
                    LLMProvider::Ollama | LLMProvider::LlamaStack
                ) {
                    ProcessingLocation::Local
                } else {
                    ProcessingLocation::Cloud
                },
            },
        })
    }

    async fn estimate_cost(&self, _message: &str) -> f32 {
        match self.llm_provider {
            LLMProvider::Ollama => 0.0,
            LLMProvider::LlamaStack => 0.0,
            LLMProvider::Gemini => 0.008, // Gemini 3 Pro
            LLMProvider::OpenAI => 0.02,
            LLMProvider::Anthropic => 0.03, // Claude Opus 4.5
            LLMProvider::VertexAI => 0.005, // Vertex AI
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = Showrunner::new();
        assert_eq!(agent.name(), "Showrunner");
        assert_eq!(agent.capability(), AgentCapability::Showrunning);
    }

    #[test]
    fn test_default_model() {
        let agent = Showrunner::new();
        assert_eq!(agent.get_model_name(), "gemini-3-pro");
    }
}
