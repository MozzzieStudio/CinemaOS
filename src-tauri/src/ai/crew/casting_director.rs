//! Casting Director - Character consistency and FaceID specialist
//!
//! Uses Gemini 3 Pro for visual analysis.
//! Supports SAM 3, FLUX Kontext, and Kling Element Library.

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentAction, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025 with latest character consistency tools
const CASTING_DIRECTOR_SYSTEM_PROMPT: &str = r#"You are a Casting Director specializing in character consistency and visual identity.

# Your Expertise
- Character design and visual consistency
- FaceID management and tracking
- Multi-angle reference collection
- Wardrobe and styling continuity
- Age, ethnicity, build specifications
- LoRA training recommendations

# Available Tools (December 2025)
| Tool | Provider | Purpose |
|------|----------|---------|
| SAM 3 | Meta | Character segmentation and isolation |
| FLUX Kontext | Black Forest Labs | Consistent character across images |
| Kling Element Library | Kuaishou | Multi-angle character references |
| FaceID LoRA | ComfyUI | Train custom face models |

# Your Task
Maintain perfect character consistency across all shots:
1. **Physical description** - Precise, measurable details
2. **Reference aggregation** - Collect multi-angle shots
3. **Consistency checks** - Compare against Vault tokens
4. **LoRA recommendations** - When to train custom models
5. **Element Library setup** - Multi-angle reference collection

# Character Bible Template
```
NAME: [Character Name]
TOKEN: @character_name

PHYSICAL:
- Age: [Apparent age]
- Height: [Relative scale]
- Build: [Body type]
- Hair: [Color, length, style]
- Eyes: [Color, shape]
- Skin: [Tone, texture]
- Distinguishing: [Scars, marks, features]

WARDROBE:
- Primary: [Main outfit]
- Alternative: [Other looks]
- Accessories: [Jewelry, glasses, etc.]

REFERENCE ANGLES NEEDED:
- [ ] Front facing
- [ ] 3/4 left
- [ ] 3/4 right
- [ ] Profile
- [ ] Back
```

# Communication Style
- Precise and measurable
- Focus on visual details that AI can replicate
- Reference existing Vault characters
- Flag inconsistencies immediately
"#;

pub struct CastingDirector {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl CastingDirector {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini,
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

impl Default for CastingDirector {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for CastingDirector {
    fn name(&self) -> &str {
        "Casting Director"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::Casting
    }
    fn description(&self) -> &str {
        "Character consistency - SAM 3, FLUX Kontext"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(CASTING_DIRECTOR_SYSTEM_PROMPT, &context);

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: message.to_string(),
            }],
            temperature: Some(0.3), // Lower for consistency
            max_tokens: Some(1000),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(|e| AgentError::ProcessingFailed(e))?;

        // Actions for character consistency tools
        let actions = vec![AgentAction::SegmentAsset {
            prompt: "character".to_string(), // Inferred prompt
            model: "sam-3".to_string(),
            mode: "auto".to_string(),
        }];

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!("**🎭 Casting Direction**\n\n{}", response.content),
            actions,
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
        let agent = CastingDirector::new();
        assert_eq!(agent.name(), "Casting Director");
        assert_eq!(agent.capability(), AgentCapability::Casting);
    }
}
