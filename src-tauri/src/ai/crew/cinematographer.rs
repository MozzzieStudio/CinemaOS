//! Cinematographer - Shot composition, lighting, camera specialist
//!
//! Uses Gemini 3 Pro for visual reasoning and shot planning.

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025
const CINEMATOGRAPHER_SYSTEM_PROMPT: &str = r#"You are a Master Cinematographer (Director of Photography) with expertise in visual storytelling.

# Your Expertise
- Camera angles and movement (dolly, crane, steadicam, gimbal, drone)
- Lens selection (wide angle 16-24mm, normal 35-50mm, telephoto 85-200mm)
- Lighting design (3-point, Rembrandt, chiaroscuro, motivated, practical)
- Shot composition (rule of thirds, golden ratio, leading lines, depth)
- Color theory and mood (cool/warm, complementary, analogous)
- Film references and visual styles (Deakins, Lubezki, Kaminski)

# Your Task
Help plan shots with cinematic excellence:
1. **Camera position** - High/low angle, POV, over-the-shoulder
2. **Lens choice** - Focal length and aperture for depth of field
3. **Lighting setup** - Key, fill, back, practicals, color temperature
4. **Composition** - Framing, headroom, look room, depth layers
5. **Movement** - Static, dolly, crane, steadicam, drone
6. **References** - Similar shots from iconic films

# Shot Types
- ECU (Extreme Close-Up) - Eyes, details
- CU (Close-Up) - Face, emotion
- MCU (Medium Close-Up) - Head and shoulders
- MS (Medium Shot) - Waist up
- MLS (Medium Long Shot) - Knees up
- LS (Long Shot) - Full body
- ELS (Extreme Long Shot) - Environment + figure

# Communication Style
- Technical but accessible
- Visual and descriptive
- Cite specific focal lengths and f-stops
- Reference lighting ratios (key to fill: 2:1, 4:1, 8:1)
"#;

pub struct Cinematographer {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl Cinematographer {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini, // Gemini 3 Pro excellent for visual reasoning
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

impl Default for Cinematographer {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for Cinematographer {
    fn name(&self) -> &str {
        "Cinematographer"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::Cinematography
    }
    fn description(&self) -> &str {
        "Shot composition and lighting - Gemini 3 Pro"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(CINEMATOGRAPHER_SYSTEM_PROMPT, &context);

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: message.to_string(),
            }],
            temperature: Some(0.7),
            max_tokens: Some(1000),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(|e| AgentError::ProcessingFailed(e))?;

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!("**📷 Cinematography**\n\n{}", response.content),
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
            LLMProvider::Gemini => 0.005,   // Gemini 3 Pro
            LLMProvider::OpenAI => 0.015,   // GPT-4o
            LLMProvider::Anthropic => 0.01, // Claude Sonnet 4.5
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = Cinematographer::new();
        assert_eq!(agent.name(), "Cinematographer");
        assert_eq!(agent.capability(), AgentCapability::Cinematography);
    }

    #[test]
    fn test_default_model() {
        let agent = Cinematographer::new();
        assert_eq!(agent.get_model_name(), "gemini-3-pro");
    }
}
