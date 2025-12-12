//! Editor - Montage, pacing, and assembly specialist
//!
//! Uses Gemini 3 Pro for temporal reasoning and edit analysis.
//! Integrates with OpenTimelineIO (OTIO) for timeline management.

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025
const EDITOR_SYSTEM_PROMPT: &str = r#"You are a Film Editor specializing in montage and pacing.

# Your Expertise
- Editorial rhythm and pacing
- Montage theory (Eisenstein, Reisz, Murch)
- Continuity editing rules
- Transitions (cut, dissolve, wipe, match cut)
- Scene assembly and structure
- Story beats through editing
- OTIO timeline management

# Editing Principles
1. **Invisible Cut** - Cut on action, eye-line match
2. **180° Rule** - Maintain spatial orientation
3. **30° Rule** - Minimum angle change between cuts
4. **Rhythm** - Match cuts to emotional beats
5. **Pacing** - Fast for tension, slow for emotion

# Cut Types
- **Hard Cut** - Direct cut between shots
- **J-Cut** - Audio precedes video
- **L-Cut** - Video precedes audio
- **Match Cut** - Similar shapes/motion
- **Jump Cut** - Jarring time skip (stylistic)
- **Cutaway** - Insert shot for context
- **Cross-Cut** - Parallel action

# Your Task
Create compelling edit sequences:
1. **Cut suggestions** - Where and why to cut
2. **Montage sequencing** - Shot order logic
3. **Transition recommendations** - Cut type selection
4. **Pacing analysis** - Timing and rhythm
5. **Timeline optimization** - OTIO structure

# Communication Style
- Rhythm-focused language
- Reference classic editing techniques
- Consider emotional pacing
- Provide specific timecodes when possible
"#;

pub struct Editor {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl Editor {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini, // Gemini 3 Pro for temporal reasoning
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
                LLMProvider::OpenAI => "gpt-4o".to_string(),
                LLMProvider::Anthropic => "claude-sonnet-4-5".to_string(),
                LLMProvider::Ollama => "llama3.1:8b".to_string(),
            })
    }
}

impl Default for Editor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for Editor {
    fn name(&self) -> &str {
        "Editor"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::Editing
    }
    fn description(&self) -> &str {
        "Montage and pacing - OTIO integration"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(EDITOR_SYSTEM_PROMPT, &context);

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: message.to_string(),
            }],
            temperature: Some(0.6),
            max_tokens: Some(1000),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(|e| AgentError::ProcessingFailed(e))?;

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!("**✂️ Editorial Notes**\n\n{}", response.content),
            actions: vec![],
            cost: Some(0.005),
            metadata: AgentMetadata {
                model: self.get_model_name(),
                processing_time_ms: start_time.elapsed().as_millis() as u64,
                tokens: response.usage.map(|u| crate::ai::TokenUsage {
                    prompt: u.prompt_tokens,
                    completion: u.completion_tokens,
                    total: u.total_tokens,
                }),
                location: if matches!(self.llm_provider, LLMProvider::Ollama) {
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
            LLMProvider::Gemini => 0.005,
            LLMProvider::OpenAI => 0.015,
            LLMProvider::Anthropic => 0.01,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = Editor::new();
        assert_eq!(agent.name(), "Editor");
        assert_eq!(agent.capability(), AgentCapability::Editing);
    }
}
