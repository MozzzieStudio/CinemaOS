//! Agent Commands - Context-aware agent chat with action execution
//!
//! Replaces the basic agent_chat with full context and action support.

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::ai::{
    actions::{parse_actions_from_response, ActionExecutor, ActionResult, AgentAction},
    agent_executor::{get_agent_executor, ChatMessage},
    context::AgentContext,
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/// Full agent chat request with rich context
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FullAgentRequest {
    /// Agent role (showrunner, scriptwriter, etc.)
    pub agent_role: String,
    /// User's message
    pub message: String,
    /// Rich context from the software
    pub context: Option<AgentContext>,
    /// Conversation history
    pub history: Vec<ChatMessage>,
    /// LLM provider override
    pub provider: Option<String>,
    /// Model override
    pub model: Option<String>,
    /// Auto-execute actions?
    pub auto_execute: bool,
}

/// Full agent response with actions
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FullAgentResponse {
    /// Agent's text response
    pub message: String,
    /// Which agent responded
    pub agent_role: String,
    /// Model used
    pub model_used: String,
    /// Detected actions from response
    pub actions: Vec<AgentAction>,
    /// Execution results (if auto_execute was true)
    pub action_results: Vec<ActionResult>,
    /// Token usage
    pub tokens_used: Option<u32>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAURI COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Chat with an agent with full context support
#[tauri::command]
#[specta::specta]
pub async fn agent_chat_full(request: FullAgentRequest) -> Result<FullAgentResponse, String> {
    // Build context string
    let context_str = request
        .context
        .as_ref()
        .map(|c| c.to_prompt_context())
        .filter(|s| !s.is_empty());

    // Call the agent executor
    let executor = get_agent_executor();
    let chat_request = crate::ai::agent_executor::AgentChatRequest {
        agent_role: request.agent_role.clone(),
        message: request.message,
        context: context_str,
        history: request.history,
        provider: request.provider,
        model: request.model,
    };

    let response = executor.chat(chat_request).await?;

    // Parse actions from response
    let actions = parse_actions_from_response(&response.message);

    // Execute actions if requested
    let action_results = if request.auto_execute && !actions.is_empty() {
        let mut results = Vec::new();
        for action in &actions {
            let result = ActionExecutor::execute(action.clone()).await;
            results.push(result);
        }
        results
    } else {
        Vec::new()
    };

    Ok(FullAgentResponse {
        message: response.message,
        agent_role: request.agent_role,
        model_used: response.model_used,
        actions,
        action_results,
        tokens_used: response.tokens_used,
    })
}

/// Execute a single action
#[tauri::command]
#[specta::specta]
pub async fn execute_agent_action(action: AgentAction) -> Result<ActionResult, String> {
    Ok(ActionExecutor::execute(action).await)
}

/// Execute multiple actions
#[tauri::command]
#[specta::specta]
pub async fn execute_agent_actions(actions: Vec<AgentAction>) -> Result<Vec<ActionResult>, String> {
    let mut results = Vec::new();
    for action in actions {
        results.push(ActionExecutor::execute(action).await);
    }
    Ok(results)
}

/// Route a message to the best agent
#[tauri::command]
#[specta::specta]
pub fn route_message_to_agent(message: String) -> String {
    let executor = get_agent_executor();
    let role = executor.route_request(&message);
    format!("{:?}", role).to_lowercase()
}

/// Get list of agent roles
#[tauri::command]
#[specta::specta]
pub fn get_agent_roles() -> Vec<String> {
    vec![
        "showrunner".into(),
        "scriptwriter".into(),
        "cinematographer".into(),
        "casting_director".into(),
        "art_director".into(),
        "voice_actors".into(),
        "music_sfx_director".into(),
        "photography_director".into(),
        "camera_director".into(),
        "editor".into(),
        "colorist".into(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::context::ScriptContext;

    #[test]
    fn test_request_with_context() {
        let request = FullAgentRequest {
            agent_role: "scriptwriter".into(),
            message: "Improve this dialogue".into(),
            context: Some(AgentContext {
                script: Some(ScriptContext {
                    full_text: "JOHN: Hello".into(),
                    selection: Some("Hello".into()),
                    cursor_line: Some(1),
                    current_scene: None,
                    scene_characters: vec!["JOHN".into()],
                    current_element: Some("dialogue".into()),
                }),
                canvas: None,
                timeline: None,
                vault: None,
                mode: "writer".into(),
                project_name: Some("Test".into()),
            }),
            history: vec![],
            provider: None,
            model: None,
            auto_execute: false,
        };

        assert_eq!(request.agent_role, "scriptwriter");
        assert!(request.context.is_some());
    }
}
