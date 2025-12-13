//! Music & SFX Director - Score, foley, and sound design specialist
//!
//! Uses Claude Opus 4.5 for creative sound design.
//! Supports Lyria 2, Suno, Beatoven, and ElevenLabs SFX.

use crate::ai::actions::AudioActionType;
use crate::ai::{
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    templates::inject_context,
    Agent, AgentAction, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;
use std::time::Instant;

/// Updated December 2025 with latest audio models
const MUSIC_SFX_SYSTEM_PROMPT: &str = r#"You are a Music & Sound Design Director for film production.

# Your Expertise
- Film scoring and composition
- Sound effects design and foley
- Audio mood and atmosphere creation
- AI music model prompting

# Available Audio Models (December 2025)
| Model | Provider | Type | Best For |
|-------|----------|------|----------|
| Lyria 2 | Google DeepMind | Music | High-fidelity instrumental (48kHz stereo) |
| Lyria RealTime | Google DeepMind | Music | Live/interactive scoring |
| Suno | Suno.com | Music | Full songs with vocals, any genre |
| Beatoven | Fal.ai | Music | Royalty-free background music |
| Beatoven SFX | Fal.ai | SFX | Sound effects generation |
| ElevenLabs SFX | ElevenLabs | SFX | Premium sound effects |

# Video Models with Native Audio
- **Veo 3.1** - Generates video + audio (dialogue, SFX, ambient)
- **Sora 2** - Native audio support
- **Kling v2.6** - Native audio with dialogue/SFX

# Your Task
Help create immersive soundscapes by providing:
1. **Musical direction** - Genre, instrumentation, tempo, mood
2. **Composer references** - Hans Zimmer, John Williams, etc.
3. **SFX descriptions** - Detailed foley and effects notes
4. **Mixing guidance** - Layering, panning, dynamics
5. **Model recommendation** - Best AI model for the task
6. **Prompt engineering** - Optimized prompts for chosen model

# Communication Style
- Musical and atmospheric language
- Reference iconic composers and scores
- Describe sonic textures (warm, cold, gritty, ethereal)
- Consider emotional arc of the scene
- Use music theory terminology when helpful
"#;

pub struct MusicSFXDirector {
    llm_provider: LLMProvider,
    llm_model: Option<String>,
}

impl MusicSFXDirector {
    pub fn new() -> Self {
        Self {
            llm_provider: LLMProvider::Anthropic, // Claude Opus 4.5 for creative
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
                LLMProvider::Gemini => "gemini-3-pro".to_string(),
                LLMProvider::OpenAI => "gpt-4o".to_string(),
                LLMProvider::Ollama => "llama3.1:8b".to_string(),
                LLMProvider::LlamaStack => "llama3.2-3b".to_string(),
                LLMProvider::VertexAI => "gemini-1.5-pro-001".to_string(),
            })
    }
}

impl Default for MusicSFXDirector {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for MusicSFXDirector {
    fn name(&self) -> &str {
        "Music & SFX Director"
    }
    fn capability(&self) -> AgentCapability {
        AgentCapability::MusicSFX
    }
    fn description(&self) -> &str {
        "Score, foley, and sound design - Lyria 2, Suno, Beatoven"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let start_time = Instant::now();
        let llm = get_llm_client();

        let system_prompt = inject_context(MUSIC_SFX_SYSTEM_PROMPT, &context);

        let user_message = format!(
            "User needs audio/music for:\n\n\"{}\"\n\n\
            Provide comprehensive sound design direction:\n\
            1. **Musical style** - Genre, instruments, tempo, key\n\
            2. **Mood/emotion** - Feeling to evoke\n\
            3. **Reference tracks** - Similar existing music\n\
            4. **SFX list** - Sound effects needed\n\
            5. **Recommended model** - Lyria 2, Suno, or Beatoven\n\
            6. **Generation prompt** - Ready-to-use prompt for chosen model",
            message
        );

        let request = LLMRequest {
            provider: self.llm_provider.clone(),
            model: self.llm_model.clone().unwrap_or_default(),
            messages: vec![LLMMessage {
                role: "user".to_string(),
                content: user_message,
            }],
            temperature: Some(0.8), // Creative
            max_tokens: Some(1000),
            system_prompt: Some(system_prompt),
        };

        let response = llm
            .chat(request)
            .await
            .map_err(AgentError::ProcessingFailed)?;

        // Suggest audio generation actions
        let actions = vec![
            AgentAction::GenerateAudio {
                prompt: message.to_string(),
                audio_type: AudioActionType::Music,
                model: "beatoven".to_string(),
                duration_seconds: Some(30.0),
            },
            AgentAction::GenerateAudio {
                prompt: message.to_string(),
                audio_type: AudioActionType::SoundEffect,
                model: "beatoven-sfx".to_string(),
                duration_seconds: None,
            },
        ];

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content: format!(
                "**🎵 Sound Design Direction**\n\n{}\n\n---\n*Ready to generate with Beatoven (royalty-free) or Suno (full songs)*",
                response.content
            ),
            actions,
            cost: Some(0.015),
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
            LLMProvider::Gemini => 0.005,
            LLMProvider::OpenAI => 0.015,
            LLMProvider::Anthropic => 0.02, // Claude Opus 4.5
            LLMProvider::VertexAI => 0.005, // Vertex AI
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = MusicSFXDirector::new();
        assert_eq!(agent.name(), "Music & SFX Director");
        assert_eq!(agent.capability(), AgentCapability::MusicSFX);
    }

    #[test]
    fn test_default_model() {
        let agent = MusicSFXDirector::new();
        assert_eq!(agent.get_model_name(), "claude-opus-4-5");
    }
}
