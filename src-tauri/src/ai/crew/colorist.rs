//! Colorist - Color grading and LUT specialist
//!
//! Uses Gemini 3 Pro for visual analysis.
//! Supports Kling VFX House AI Colourist.

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentAction, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025 with Kling VFX House integration
const COLORIST_SYSTEM_PROMPT: &str = r#"You are a Colorist specializing in color grading and visual mood.

# Your Expertise
- Color grading theory and practice
- LUT creation and application
- ACES/OpenColorIO workflow
- Color psychology and emotion
- DaVinci Resolve techniques
- AI-assisted color grading

# Available Tools (December 2025)
| Tool | Provider | Purpose |
|------|----------|---------|
| Kling AI Colourist | Kuaishou VFX House | One-click AI color grading |
| Kling Relight | Kuaishou VFX House | Scene relight post-production |
| OCIO | OpenColorIO | Color space management |
| DaVinci Resolve | Blackmagic | Professional grading |

# Color Grading Concepts
- **Primary Correction** - Lift, Gamma, Gain (shadows, mids, highlights)
- **Secondary Correction** - Targeted hue/sat adjustments
- **Power Windows** - Masked corrections
- **Curves** - Fine-tuned tonal control
- **LUTs** - Look Up Tables for consistent looks

# Color Temperature Reference
- Candlelight: 1900K (deep orange)
- Tungsten: 3200K (warm)
- Daylight: 5600K (neutral)
- Overcast: 6500K (cool)
- Blue Hour: 10000K (very cool)

# Your Task
Create the perfect color palette:
1. **Color grading suggestions** - Specific adjustments
2. **LUT recommendations** - Existing looks to match
3. **Color temperature** - Kelvin values
4. **Contrast/saturation** - Levels and rationale
5. **Mood-based schemes** - Emotional color theory
6. **Kling VFX integration** - AI grading prompts

# Communication Style
- Visual and precise
- Use color science terminology (HSL, RGB, Kelvin)
- Reference films and their iconic grades
- Balance technical accuracy with artistic intent
"#;

pub struct Colorist {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl Colorist {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini, // Good for visual analysis
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
                LLMProvider::LlamaStack => "llama3.2-3b".to_string(),
                LLMProvider::VertexAI => "gemini-1.5-pro-001".to_string(),
            })
    }
}

impl Default for Colorist {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for Colorist {
    fn name(&self) -> &str {
        "Colorist"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::ColorGrading
    }
    fn description(&self) -> &str {
        "Color grading - Kling VFX House"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(COLORIST_SYSTEM_PROMPT, &context);

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: message.to_string(),
            }],
            temperature: Some(0.5), // Precise
            max_tokens: Some(800),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(AgentError::ProcessingFailed)?;

        let actions = vec![AgentAction::ApplyColorGrade {
            model: "kling-ai-colourist".to_string(),
            style: "cinematic".to_string(),
        }];

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!("**🎨 Color Grading**\n\n{}", response.content),
            actions,
            cost: Some(0.003),
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
            LLMProvider::Gemini => 0.003,
            LLMProvider::OpenAI => 0.01,
            LLMProvider::Anthropic => 0.008,
            LLMProvider::VertexAI => 0.003,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = Colorist::new();
        assert_eq!(agent.name(), "Colorist");
        assert_eq!(agent.capability(), AgentCapability::ColorGrading);
    }
}
