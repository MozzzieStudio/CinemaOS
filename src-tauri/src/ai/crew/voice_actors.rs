//! Voice Actors - TTS and dialogue performance specialist
//!
//! Uses Gemini 2.5 Flash for voice direction.
//! Supports ElevenLabs v3, Flash v2.5, Turbo v2.5, and Gemini TTS.

use crate::ai::actions::AudioActionType;
use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentAction, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025 with latest TTS models
const VOICE_ACTORS_SYSTEM_PROMPT: &str = r#"You are a Voice Director specializing in AI voice synthesis.

# Your Expertise
- Voice casting and direction
- Emotional delivery guidance
- Accent and dialect coaching
- Pacing, timing, and emphasis
- AI TTS model selection

# Available TTS Models (December 2025)
| Model | Provider | Latency | Best For |
|-------|----------|---------|----------|
| Eleven v3 | ElevenLabs | ~200ms | Most expressive, 70+ languages |
| Eleven Flash v2.5 | ElevenLabs | ~75ms | Low latency, real-time |
| Eleven Turbo v2.5 | ElevenLabs | ~250ms | Cost-effective, 50% cheaper |
| Gemini 2.5 Pro TTS | Google | ~150ms | Native multilingual |
| MiniMax Speech-02 HD | Fal.ai | ~180ms | Alternative high quality |
| Dia TTS | Fal.ai | ~200ms | Voice cloning capable |

# Native Audio in Video
- **Kling v2.6** - Generates video with dialogue (Chinese/English)
- **Veo 3.1** - Native audio including speech
- Use TTS when you need *specific* voice control

# Your Task
Help create compelling voice performances:
1. **Voice selection** - Characteristics (pitch, timber, accent)
2. **Emotional tone** - Happy, sad, angry, scared, etc.
3. **Delivery notes** - Pauses, emphasis, speed changes
4. **Model recommendation** - Best TTS for the use case
5. **SSML/markup** - Prosody tags if supported

# Communication Style
- Focus on emotional truth in performance
- Reference voice characteristics precisely
- Consider character context from Vault
- Provide specific voice recommendations
"#;

pub struct VoiceActors {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl VoiceActors {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Gemini, // Gemini 2.5 Flash for speed
            llm_model: Some("gemini-2.5-flash".to_string()),
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
                LLMProvider::Gemini => "gemini-2.5-flash".to_string(),
                LLMProvider::OpenAI => "gpt-4o".to_string(),
                LLMProvider::Anthropic => "claude-sonnet-4-5".to_string(),
                LLMProvider::Ollama => "llama3.1:8b".to_string(),
                LLMProvider::LlamaStack => "llama3.2-3b".to_string(),
                LLMProvider::VertexAI => "gemini-1.5-pro-001".to_string(),
            })
    }
}

impl Default for VoiceActors {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for VoiceActors {
    fn name(&self) -> &str {
        "Voice Actors"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::VoiceActing
    }
    fn description(&self) -> &str {
        "TTS and dialogue - ElevenLabs v3, Gemini TTS"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(VOICE_ACTORS_SYSTEM_PROMPT, &context);

        let user_message = format!(
            "User needs voice/TTS for:\n\n\"{}\"\n\n\
            Provide voice direction:\n\
            1. **Voice characteristics** - Gender, age, accent, pitch\n\
            2. **Emotional delivery** - Mood and feeling\n\
            3. **Performance notes** - Pacing, emphasis, pauses\n\
            4. **Recommended model** - Best TTS (Eleven v3 for quality, Flash for speed)\n\
            5. **Ready prompt** - Text formatted for TTS with delivery notes",
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

        // Suggest TTS actions with different models
        let actions = vec![
            AgentAction::GenerateAudio {
                prompt: message.to_string(),
                audio_type: AudioActionType::Voice,
                model: "eleven-v3".to_string(),
                duration_seconds: None,
            },
            AgentAction::GenerateAudio {
                prompt: message.to_string(),
                audio_type: AudioActionType::Voice,
                model: "gemini-flash".to_string(),
                duration_seconds: None,
            },
        ];

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!(
                "**🎙️ Voice Direction**\n\n{}\n\n---\n*Ready to generate with ElevenLabs v3 (quality) or Flash v2.5 (low latency)*",
                response.content
            ),
            actions,
            cost: Some(0.002),
            metadata: AgentMetadata {
                model: self.get_model_name(),
                processing_time_ms: start_time.elapsed().as_millis() as u64,
                tokens: response.usage.map(|u| crate::ai::TokenUsage {
                    prompt: u.prompt_tokens,
                    completion: u.completion_tokens,
                    total: u.total_tokens,
                }),
                location: if matches!(self.llm_provider, LLMProvider::Ollama | LLMProvider::LlamaStack) {
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
            LLMProvider::Gemini => 0.001, // Gemini 2.5 Flash very cheap
            LLMProvider::OpenAI => 0.01,
            LLMProvider::Anthropic => 0.015,
            LLMProvider::VertexAI => 0.005,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = VoiceActors::new();
        assert_eq!(agent.name(), "Voice Actors");
        assert_eq!(agent.capability(), AgentCapability::VoiceActing);
    }

    #[test]
    fn test_default_model() {
        let agent = VoiceActors::new();
        assert_eq!(agent.get_model_name(), "gemini-2.5-flash");
    }
}
