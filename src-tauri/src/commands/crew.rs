//! Tauri commands for AI Crew interaction

use crate::ai::actions::AgentAction;
use crate::ai::crew::MainAgent;
use crate::ai::{model_selection::ModelSelection, Agent, AgentContext, UserPreferences};
use serde::{Deserialize, Serialize};

/// Request for crew chat
#[derive(Debug, Clone, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CrewChatRequest {
    pub message: String,
    pub prefer_local: bool,
    pub max_credits: f32,
    /// Optional model selection (user choice)
    pub model_selection: Option<ModelSelection>,
    /// System context
    pub context: Option<AgentContext>,
}

/// Response from crew
#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CrewChatResponse {
    pub agent: String,
    pub content: String,
    pub actions: Vec<AgentAction>,
    pub cost: f32,
    pub model: String,
    pub provider: String,
}

/// Chat with the AI Crew via Main Agent
#[tauri::command]
#[specta::specta]
pub async fn chat_with_crew(request: CrewChatRequest) -> Result<CrewChatResponse, String> {
    let main_agent = MainAgent::new();

    let context = request.context.unwrap_or_else(|| AgentContext {
        script: None,
        canvas: None,
        timeline: None,
        vault: None,
        mode: "default".to_string(),
        project_name: None,
        preferences: Some(UserPreferences {
            prefer_local: request.prefer_local,
            max_credits_per_request: request.max_credits,
            preferred_models: request
                .model_selection
                .map(|ms| ms.model.unwrap_or_else(|| format!("{}:auto", ms.provider)))
                .into_iter()
                .collect(),
        }),
    });

    let response = main_agent
        .route(&request.message, context)
        .await
        .map_err(|e| e.to_string())?;

    // Extract provider from metadata
    let provider = match response.metadata.location {
        crate::ai::ProcessingLocation::Local => "local".to_string(),
        crate::ai::ProcessingLocation::Cloud => {
            // Try to infer provider from model name
            if response.metadata.model.contains("gemini") {
                "gemini".to_string()
            } else if response.metadata.model.contains("gpt") {
                "openai".to_string()
            } else if response.metadata.model.contains("claude") {
                "anthropic".to_string()
            } else {
                "cloud".to_string()
            }
        }
    };

    Ok(CrewChatResponse {
        agent: response.agent,
        content: response.content,
        actions: response.actions.clone(),
        cost: response.cost.unwrap_or(0.0),
        model: response.metadata.model,
        provider,
    })
}

/// Get list of available agents
#[tauri::command]
#[specta::specta]
pub fn get_crew_agents() -> Vec<String> {
    let main_agent = MainAgent::new();
    main_agent
        .get_all_agents()
        .iter()
        .map(|agent| agent.name().to_string())
        .collect()
}

/// Get available LLM providers and models
#[tauri::command]
#[specta::specta]
pub fn get_available_models() -> Vec<ModelOption> {
    vec![
        // Google
        ModelOption {
            provider: "gemini".to_string(),
            model_id: "gemini-2.5-flash".to_string(),
            name: "Gemini 2.5 Flash".to_string(),
            cost_per_1k_tokens: 0.000075,
            local: false,
        },
        ModelOption {
            provider: "gemini".to_string(),
            model_id: "gemini-3-pro".to_string(),
            name: "Gemini 3 Pro".to_string(),
            cost_per_1k_tokens: 0.00125,
            local: false,
        },
        // OpenAI
        ModelOption {
            provider: "openai".to_string(),
            model_id: "gpt-4o".to_string(),
            name: "GPT-4o".to_string(),
            cost_per_1k_tokens: 0.0025,
            local: false,
        },
        // Anthropic
        ModelOption {
            provider: "anthropic".to_string(),
            model_id: "claude-sonnet-4-5".to_string(),
            name: "Claude Sonnet 4.5".to_string(),
            cost_per_1k_tokens: 0.003,
            local: false,
        },
        ModelOption {
            provider: "anthropic".to_string(),
            model_id: "claude-opus-4-5".to_string(),
            name: "Claude Opus 4.5".to_string(),
            cost_per_1k_tokens: 0.015,
            local: false,
        },
        // Local (Ollama)
        ModelOption {
            provider: "ollama".to_string(),
            model_id: "llama4:maverick".to_string(),
            name: "Llama 4 Maverick (Local)".to_string(),
            cost_per_1k_tokens: 0.0,
            local: true,
        },
        ModelOption {
            provider: "ollama".to_string(),
            model_id: "llama3.1:8b".to_string(),
            name: "Llama 3.1 8B (Local)".to_string(),
            cost_per_1k_tokens: 0.0,
            local: true,
        },
    ]
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ModelOption {
    pub provider: String,
    pub model_id: String,
    pub name: String,
    pub cost_per_1k_tokens: f32,
    pub local: bool,
}
