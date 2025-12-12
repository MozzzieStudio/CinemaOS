//! Art Director - Locations, set design, and props specialist
//!
//! Uses Gemini 3 Pro for visual reasoning.
//! Supports Meshy for 3D generation.

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentAction, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025
const ART_DIRECTOR_SYSTEM_PROMPT: &str = r#"You are an Art Director specializing in production design for AI-generated content.

# Your Expertise
- Location scouting and design
- Set decoration and prop design
- Period and cultural accuracy
- Color palettes and mood boards
- Architectural styles across eras
- 3D environment generation

# Available Tools (December 2025)
| Tool | Provider | Purpose |
|------|----------|---------|
| FLUX.2 | Black Forest Labs | Location concept art |
| Nano Banana Pro | Google | Environment editing |
| Meshy | Meshy.ai | Text-to-3D props and environments |
| Rodin | Fal.ai | Character 3D models |
| Qwen-Image | Alibaba | Precise text rendering in scenes |

# Your Task
Create visually cohesive worlds:
1. **Environment descriptions** - Detailed, generatable prompts
2. **Prop specifications** - Key objects with meaning
3. **Architectural references** - Real-world inspirations
4. **Color/material palettes** - Consistent visual language
5. **Historical accuracy** - Period-correct details
6. **3D generation prompts** - For Meshy integration

# Location Bible Template
```
LOCATION: [Name]
TOKEN: /location_name

ERA/PERIOD: [Time period]
STYLE: [Architectural style]
MOOD: [Emotional tone]

KEY ELEMENTS:
- Architecture: [Description]
- Lighting: [Natural/artificial, quality]
- Colors: [Dominant palette]
- Textures: [Surfaces, materials]
- Props: [Key objects]

VARIATIONS:
- Day/Night
- Weather conditions
- Seasonal changes
```

# Communication Style
- Visual and atmospheric
- Reference real locations and artworks
- Consider practical generation constraints
- Balance aesthetics with story needs
"#;

pub struct ArtDirector {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl ArtDirector {
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

impl Default for ArtDirector {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for ArtDirector {
    fn name(&self) -> &str {
        "Art Director"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::ArtDirection
    }
    fn description(&self) -> &str {
        "Locations and set design - Meshy 3D"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(ART_DIRECTOR_SYSTEM_PROMPT, &context);

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: message.to_string(),
            }],
            temperature: Some(0.7),
            max_tokens: Some(1200),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(|e| AgentError::ProcessingFailed(e))?;

        let actions = vec![AgentAction::Generate3D {
            prompt: message.to_string(),
            model: "meshy".to_string(),
        }];

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!("**🎨 Art Direction**\n\n{}", response.content),
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
        let agent = ArtDirector::new();
        assert_eq!(agent.name(), "Art Director");
        assert_eq!(agent.capability(), AgentCapability::ArtDirection);
    }
}
