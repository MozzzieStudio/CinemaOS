//! Agent Executor - Connects Agents to LLM and ComfyUI
//!
//! Handles the full agent execution loop:
//! 1. User request → Agent
//! 2. Agent + Context → LLM call
//! 3. LLM response → Parse action
//! 4. If generation needed → Create workflow → Execute ComfyUI
//! 5. Return result to user

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::ai::{
    agents::{
        crew::VirtualCrew,
        prompts::get_system_prompt,
        traits::{Agent, AgentRole},
    },
    llm_client::{get_llm_client, LLMMessage, LLMProvider, LLMRequest},
    workflow_generator::{generate_workflow, WorkflowRequest, WorkflowType},
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT EXECUTION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentChatRequest {
    pub agent_role: String,
    pub message: String,
    pub context: Option<String>,
    pub history: Vec<ChatMessage>,
    pub provider: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentChatResponse {
    pub message: String,
    pub action: Option<AgentActionResult>,
    pub agent_role: String,
    pub model_used: String,
    pub tokens_used: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentActionResult {
    pub action_type: String, // "generate_image", "generate_video", "delegate", etc.
    pub workflow_json: Option<String>,
    pub execution_id: Option<String>,
    pub estimated_credits: Option<f32>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

pub struct AgentExecutor {
    crew: VirtualCrew,
}

impl AgentExecutor {
    pub fn new() -> Self {
        Self {
            crew: VirtualCrew::new(),
        }
    }

    /// Execute an agent chat request
    pub async fn chat(&self, request: AgentChatRequest) -> Result<AgentChatResponse, String> {
        // 1. Parse agent role
        let role = self.parse_role(&request.agent_role)?;

        // 2. Get system prompt for this agent
        let system_prompt = get_system_prompt(role).to_string();

        // 3. Build conversation history
        let mut messages: Vec<LLMMessage> = request
            .history
            .iter()
            .map(|m| LLMMessage {
                role: m.role.clone(),
                content: m.content.clone(),
            })
            .collect();

        // Add context if provided
        let user_message = if let Some(ctx) = &request.context {
            format!("Context:\n{}\n\nUser request:\n{}", ctx, request.message)
        } else {
            request.message.clone()
        };

        messages.push(LLMMessage {
            role: "user".into(),
            content: user_message,
        });

        // 4. Determine provider and model
        let (provider, model) = self.get_provider_and_model(&role, &request);

        // 5. Call LLM
        let llm_request = LLMRequest {
            provider,
            model: model.clone(),
            messages,
            temperature: Some(0.7),
            max_tokens: Some(4096),
            system_prompt: Some(system_prompt),
        };

        let llm_response = get_llm_client().chat(llm_request).await?;

        // 6. Parse response for actions
        let action = self.parse_action(&role, &llm_response.content);

        Ok(AgentChatResponse {
            message: llm_response.content,
            action,
            agent_role: request.agent_role,
            model_used: model,
            tokens_used: llm_response.usage.map(|u| u.total_tokens),
        })
    }

    /// Route a user request to the appropriate agent
    pub fn route_request(&self, user_input: &str) -> AgentRole {
        self.crew.route_by_intent(user_input)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    fn parse_role(&self, role_str: &str) -> Result<AgentRole, String> {
        match role_str.to_lowercase().as_str() {
            "showrunner" => Ok(AgentRole::Showrunner),
            "scriptwriter" => Ok(AgentRole::Scriptwriter),
            "cinematographer" => Ok(AgentRole::Cinematographer),
            "casting_director" | "casting" => Ok(AgentRole::CastingDirector),
            "art_director" | "art" => Ok(AgentRole::ArtDirector),
            "voice_actor" | "voice" => Ok(AgentRole::VoiceActors),
            "music_director" | "music" => Ok(AgentRole::MusicSfxDirector),
            "photography_director" | "photo" | "image" => Ok(AgentRole::PhotographyDirector),
            "camera_director" | "camera" | "video" => Ok(AgentRole::CameraDirector),
            "editor" => Ok(AgentRole::Editor),
            "colorist" => Ok(AgentRole::Colorist),
            _ => Err(format!("Unknown agent role: {}", role_str)),
        }
    }

    fn get_provider_and_model(
        &self,
        role: &AgentRole,
        request: &AgentChatRequest,
    ) -> (LLMProvider, String) {
        // Use user-specified provider/model if provided
        if let (Some(provider_str), Some(model)) = (&request.provider, &request.model) {
            let provider = match provider_str.to_lowercase().as_str() {
                "gemini" | "google" => LLMProvider::Gemini,
                "openai" | "gpt" => LLMProvider::OpenAI,
                "anthropic" | "claude" => LLMProvider::Anthropic,
                "ollama" | "local" => LLMProvider::Ollama,
                _ => LLMProvider::Gemini,
            };
            return (provider, model.clone());
        }

        // Default based on role
        let default_model = self
            .crew
            .get(*role)
            .map(|m| m.default_model().to_string())
            .unwrap_or_else(|| "gemini-2.0-flash".to_string());

        // Determine provider from model name
        let provider = if default_model.contains("gemini") || default_model.contains("gemma") {
            LLMProvider::Gemini
        } else if default_model.contains("gpt") {
            LLMProvider::OpenAI
        } else if default_model.contains("claude") {
            LLMProvider::Anthropic
        } else if default_model.contains("llama") {
            LLMProvider::Ollama
        } else {
            LLMProvider::Gemini
        };

        (provider, default_model)
    }

    fn parse_action(&self, role: &AgentRole, response: &str) -> Option<AgentActionResult> {
        // Check if response indicates a generation action
        let lower = response.to_lowercase();

        // Photography Director → Image generation
        if matches!(role, AgentRole::PhotographyDirector) {
            if lower.contains("generating") || lower.contains("creating image") {
                return Some(self.create_image_action(response));
            }
        }

        // Camera Director → Video generation
        if matches!(role, AgentRole::CameraDirector) {
            if lower.contains("generating") || lower.contains("creating video") {
                return Some(self.create_video_action(response));
            }
        }

        // Check for JSON workflow in response
        if response.contains("\"class_type\"") {
            return Some(AgentActionResult {
                action_type: "execute_workflow".into(),
                workflow_json: Some(response.to_string()),
                execution_id: None,
                estimated_credits: None,
            });
        }

        None
    }

    fn create_image_action(&self, response: &str) -> AgentActionResult {
        // Extract prompt from response (simplified)
        let prompt = response.to_string();

        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToImage,
            prompt,
            negative_prompt: None,
            model: "flux-schnell".into(),
            width: 1024,
            height: 1024,
            steps: None,
            cfg_scale: None,
            seed: None,
            input_image: None,
            token_context: None,
        };

        let workflow = generate_workflow(&request);

        AgentActionResult {
            action_type: "generate_image".into(),
            workflow_json: Some(workflow.workflow_json),
            execution_id: None,
            estimated_credits: Some(workflow.estimated_credits),
        }
    }

    fn create_video_action(&self, response: &str) -> AgentActionResult {
        let prompt = response.to_string();

        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToVideo,
            prompt,
            negative_prompt: None,
            model: "kling".into(),
            width: 1280,
            height: 720,
            steps: None,
            cfg_scale: None,
            seed: None,
            input_image: None,
            token_context: None,
        };

        let workflow = generate_workflow(&request);

        AgentActionResult {
            action_type: "generate_video".into(),
            workflow_json: Some(workflow.workflow_json),
            execution_id: None,
            estimated_credits: Some(workflow.estimated_credits),
        }
    }
}

impl Default for AgentExecutor {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

use once_cell::sync::Lazy;

static AGENT_EXECUTOR: Lazy<AgentExecutor> = Lazy::new(AgentExecutor::new);

pub fn get_agent_executor() -> &'static AgentExecutor {
    &AGENT_EXECUTOR
}
