//! Scriptwriter - Screenplay, dialogue, and plot specialist
//!
//! Uses Claude Opus 4.5 for creative writing excellence.
//! Supports Llama 4 Maverick for local/open-source option.

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025 with latest LLM models
const SCRIPTWRITER_SYSTEM_PROMPT: &str = r#"You are an expert Screenwriter specializing in Hollywood-standard scripts.

# Your Expertise
- Screenplay structure (3-act, Hero's Journey, Save the Cat, etc.)
- Dialogue that reveals character and advances plot
- Visual storytelling and "show don't tell"
- Industry-standard formatting (Courier 12pt, proper margins)
- Genre conventions across drama, comedy, thriller, sci-fi, etc.

# Your Task
Help the user write compelling scripts:
1. **Scene development** - Action, dialogue, transitions
2. **Dialogue polishing** - Character voice, subtext, rhythm
3. **Character consistency** - Based on Vault tokens
4. **Plot structure** - Beats, turning points, climax
5. **Beat sheets** - Scene-by-scene breakdowns

# Output Format
- Use industry-standard screenplay format
- SCENE HEADING (INT./EXT. LOCATION - TIME)
- Action lines: Visual, concise, present tense
- Character names: CENTERED, ALL CAPS
- Dialogue: Naturalistic, character-specific
- Parentheticals: Sparingly, for essential direction

# Style
- Cinematic and visual language
- Economy of words (1 page ≈ 1 minute)
- "Show, don't tell" - visual storytelling
- Subtext in dialogue - what's NOT said matters
"#;

pub struct Scriptwriter {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl Scriptwriter {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Anthropic, // Claude Opus 4.5 best for creative writing
            llm_model: Some("claude-opus-4-5".to_string()),
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
                LLMProvider::Anthropic => "claude-opus-4-5".to_string(),
                LLMProvider::OpenAI => "gpt-4o".to_string(),
                LLMProvider::Gemini => "gemini-3-pro".to_string(),
                LLMProvider::Ollama => "llama4:maverick".to_string(),
                LLMProvider::LlamaStack => "llama3.2-3b".to_string(),
                LLMProvider::VertexAI => "gemini-1.5-pro-001".to_string(),
            })
    }
}

impl Default for Scriptwriter {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for Scriptwriter {
    fn name(&self) -> &str {
        "Scriptwriter"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::Scriptwriting
    }
    fn description(&self) -> &str {
        "Screenplay and dialogue specialist - Claude Opus 4.5"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(SCRIPTWRITER_SYSTEM_PROMPT, &context);

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: message.to_string(),
            }],
            temperature: Some(0.8), // Higher for creativity
            max_tokens: Some(2000),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(AgentError::ProcessingFailed)?;

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!("**✍️ Screenplay**\n\n{}", response.content),
            actions: vec![],
            cost: Some(0.02), // Claude Opus 4.5 pricing
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
            LLMProvider::Ollama => 0.0, // Local/free
            LLMProvider::LlamaStack => 0.0,
            LLMProvider::Gemini => 0.005,   // Gemini 3 Pro
            LLMProvider::OpenAI => 0.02,    // GPT-4o
            LLMProvider::Anthropic => 0.03, // Claude Opus 4.5
            LLMProvider::VertexAI => 0.005, // Vertex AI Gemini
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = Scriptwriter::new();
        assert_eq!(agent.name(), "Scriptwriter");
        assert_eq!(agent.capability(), AgentCapability::Scriptwriting);
    }

    #[test]
    fn test_default_model() {
        let agent = Scriptwriter::new();
        assert_eq!(agent.get_model_name(), "claude-opus-4-5");
    }
}
