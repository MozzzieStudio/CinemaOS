//! Camera Director - Video generation specialist
//!
//! Uses Gemini 3 Pro for video understanding and prompt enhancement.
//! Supports Veo 3.1, Sora 2 Pro, and Kling v2.6 (all with native audio).

use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentAction, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025 with latest video models
const CAMERA_DIRECTOR_SYSTEM_PROMPT: &str = r#"You are a Camera/Video Director specializing in AI video generation.

# Your Expertise
- Video generation prompting for state-of-the-art models
- Camera movement choreography (dolly, crane, steadicam, handheld)
- Action blocking and temporal consistency
- Multi-shot sequences and continuity management

# Available Video Models (December 2025)
| Model | Provider | Native Audio | Best For |
|-------|----------|--------------|----------|
| Veo 3.1 | Google DeepMind | ✅ Yes | Photorealistic, complex motion |
| Sora 2 Pro | OpenAI | ✅ Yes | Creative, artistic, stylized |
| Kling v2.6 | Kuaishou | ✅ Yes | Cinematic, dialogue scenes |
| Kling v2.5 Turbo | Kuaishou | ❌ No | Fast preview, drafts |
| LTX Video 13B | Lightricks | ❌ No | Local/free, long videos |
| Wan 2.2 | Alibaba | ❌ No | Local/free, I2V with LoRA |

# Your Task
Help create compelling video content by providing:
1. **Enhanced video prompts** - Detailed, model-optimized descriptions
2. **Camera movement** - Pan, tilt, dolly, crane, steadicam, drone
3. **Action description** - Character movements, expressions, interactions
4. **Temporal flow** - Beginning, middle, end of the shot
5. **Duration recommendation** - Optimal length for the content
6. **Model selection** - Best model based on requirements:
   - Need dialogue/SFX? → Veo 3.1 or Kling v2.6 (native audio)
   - Creative/stylized? → Sora 2 Pro
   - Fast preview? → Kling v2.5 Turbo
   - Running locally? → LTX Video or Wan 2.2

# Communication Style
- Cinematic language with technical precision
- Frame-by-frame thinking
- Continuity-aware across shots
- Model-specific optimizations
"#;

pub struct CameraDirector {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl CameraDirector {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini, // Gemini 3 Pro for video understanding
            llm_model: Some("gemini-3-pro".to_string()),
        }
    }

    pub fn with_llm(mut self, provider: LLMProvider, model: Option<String>) -> Self {
        self.llm_provider = provider;
        self.llm_model = model;
        self
    }

    /// Get the default model name for this provider
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

impl Default for CameraDirector {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for CameraDirector {
    fn name(&self) -> &str {
        "Camera Director"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::VideoDirection
    }
    fn description(&self) -> &str {
        "Video generation and camera movement specialist - Veo 3.1, Sora 2, Kling v2.6"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(CAMERA_DIRECTOR_SYSTEM_PROMPT, &context);

        let user_message = format!(
            "User wants to generate a video:\n\n\"{}\"\n\n\
            Create a detailed video generation prompt. Include:\n\
            1. **Enhanced prompt** - Vivid, detailed description\n\
            2. **Camera movement** - Specific camera choreography\n\
            3. **Action description** - What happens in the shot\n\
            4. **Audio notes** - Dialogue, SFX, or ambient sounds needed\n\
            5. **Duration** - Recommended length (5-10 seconds typical)\n\
            6. **Recommended model** - Which model and why\n\n\
            Format your response with clear sections and the final prompt ready for generation.",
            message
        );

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: user_message,
            }],
            temperature: Some(0.7),
            max_tokens: Some(800),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(AgentError::ProcessingFailed)?;

        // Suggest video generation action with best model
        let actions = vec![
            AgentAction::GenerateVideo {
                prompt: response.content.clone(),
                model: "veo-3.1".to_string(),
                duration_seconds: 5.0,
                reference_image: None,
                token_ids: vec![],
            },
            AgentAction::GenerateVideo {
                prompt: response.content.clone(),
                model: "kling-v2.5-turbo".to_string(),
                duration_seconds: 5.0,
                reference_image: None,
                token_ids: vec![],
            },
        ];

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!(
                "**🎬 Video Direction**\n\n{}\n\n---\n*Ready to generate with Veo 3.1 (quality) or Kling v2.5 Turbo (fast preview)*",
                response.content
            ),
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
            LLMProvider::Gemini => 0.005,   // Gemini 3 Pro
            LLMProvider::OpenAI => 0.015,   // GPT-4o
            LLMProvider::Anthropic => 0.02, // Claude
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = CameraDirector::new();
        assert_eq!(agent.name(), "Camera Director");
        assert_eq!(agent.capability(), AgentCapability::VideoDirection);
    }

    #[test]
    fn test_default_model() {
        let agent = CameraDirector::new();
        assert_eq!(agent.get_model_name(), "gemini-3-pro");
    }
}
