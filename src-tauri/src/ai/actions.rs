//! Agent Actions - Actions that agents can trigger in the software
//!
//! Defines executable actions and the action executor.

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::ai::workflow_generator::{generate_workflow, WorkflowRequest, WorkflowType};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/// Actions an agent can request to be executed
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum AgentAction {
    /// Generate an image using ComfyUI
    GenerateImage {
        prompt: String,
        model: String,
        width: u32,
        height: u32,
        /// Token IDs to include for consistency
        token_ids: Vec<String>,
    },

    /// Generate a video
    GenerateVideo {
        prompt: String,
        model: String,
        duration_seconds: f32,
        /// Reference image path
        reference_image: Option<String>,
        token_ids: Vec<String>,
    },

    /// Generate audio (voice, music, sfx)
    GenerateAudio {
        prompt: String,
        audio_type: AudioActionType,
        model: String,
        duration_seconds: Option<f32>,
    },

    /// Update the script content
    UpdateScript {
        /// Full replacement or patch
        mode: ScriptUpdateMode,
        /// The new content
        content: String,
        /// Target line range (for patch mode)
        line_start: Option<u32>,
        line_end: Option<u32>,
    },

    /// Add a node to the canvas
    AddToCanvas {
        node_type: CanvasNodeType,
        content: String,
        position: Option<(f32, f32)>,
        /// Link to token ID
        token_id: Option<String>,
    },

    /// Create/update a token in the Vault
    UpdateVault {
        token_type: String,
        token_name: String,
        description: String,
        /// Base64 reference image
        reference_image: Option<String>,
    },

    /// Delegate to another agent
    Delegate {
        target_agent: String,
        message: String,
    },

    /// Show a message/suggestion to the user
    ShowMessage {
        title: String,
        content: String,
        suggestions: Vec<String>,
    },

    /// Execute a raw ComfyUI workflow
    ExecuteWorkflow { workflow_json: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum AudioActionType {
    Voice,
    Music,
    SoundEffect,
    Ambient,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum ScriptUpdateMode {
    /// Replace entire script
    Replace,
    /// Insert at cursor
    Insert,
    /// Replace selection
    ReplaceSelection,
    /// Patch specific lines
    Patch,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum CanvasNodeType {
    Image,
    Video,
    Character,
    Location,
    Prop,
    Note,
    Reference,
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION RESULT
// ═══════════════════════════════════════════════════════════════════════════════

/// Result of executing an action
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ActionResult {
    pub success: bool,
    pub action_type: String,
    /// Execution ID for async operations (like ComfyUI generation)
    pub execution_id: Option<String>,
    /// Result data as JSON string (parse on frontend)
    pub data: Option<String>,
    /// Error message if failed
    pub error: Option<String>,
    /// Estimated cost in credits
    pub credits_used: Option<f32>,
}

impl ActionResult {
    pub fn success(action_type: &str) -> Self {
        Self {
            success: true,
            action_type: action_type.into(),
            execution_id: None,
            data: None,
            error: None,
            credits_used: None,
        }
    }

    pub fn error(action_type: &str, error: &str) -> Self {
        Self {
            success: false,
            action_type: action_type.into(),
            execution_id: None,
            data: None,
            error: Some(error.into()),
            credits_used: None,
        }
    }

    pub fn with_execution_id(mut self, id: String) -> Self {
        self.execution_id = Some(id);
        self
    }

    pub fn with_data(mut self, data: serde_json::Value) -> Self {
        self.data = Some(data.to_string());
        self
    }

    pub fn with_credits(mut self, credits: f32) -> Self {
        self.credits_used = Some(credits);
        self
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

/// Executes agent actions in the software
pub struct ActionExecutor;

impl ActionExecutor {
    /// Execute an action and return the result
    pub async fn execute(action: AgentAction) -> ActionResult {
        match action {
            AgentAction::GenerateImage {
                prompt,
                model,
                width,
                height,
                token_ids,
            } => Self::execute_generate_image(prompt, model, width, height, token_ids).await,

            AgentAction::GenerateVideo {
                prompt,
                model,
                duration_seconds,
                reference_image,
                token_ids,
            } => {
                Self::execute_generate_video(
                    prompt,
                    model,
                    duration_seconds,
                    reference_image,
                    token_ids,
                )
                .await
            }

            AgentAction::UpdateScript {
                mode,
                content,
                line_start,
                line_end,
            } => {
                // Script updates are handled by the frontend
                // Return the data for the frontend to apply
                ActionResult::success("update_script").with_data(serde_json::json!({
                    "mode": mode,
                    "content": content,
                    "line_start": line_start,
                    "line_end": line_end
                }))
            }

            AgentAction::AddToCanvas {
                node_type,
                content,
                position,
                token_id,
            } => {
                // Canvas updates are handled by the frontend
                ActionResult::success("add_to_canvas").with_data(serde_json::json!({
                    "node_type": node_type,
                    "content": content,
                    "position": position,
                    "token_id": token_id
                }))
            }

            AgentAction::UpdateVault {
                token_type,
                token_name,
                description,
                reference_image,
            } => {
                Self::execute_vault_update(token_type, token_name, description, reference_image)
                    .await
            }

            AgentAction::Delegate {
                target_agent,
                message,
            } => {
                // Delegation is handled by the agent executor
                ActionResult::success("delegate").with_data(serde_json::json!({
                    "target_agent": target_agent,
                    "message": message
                }))
            }

            AgentAction::ShowMessage {
                title,
                content,
                suggestions,
            } => ActionResult::success("show_message").with_data(serde_json::json!({
                "title": title,
                "content": content,
                "suggestions": suggestions
            })),

            AgentAction::ExecuteWorkflow { workflow_json } => {
                Self::execute_comfyui_workflow(workflow_json).await
            }

            AgentAction::GenerateAudio {
                prompt,
                audio_type,
                model,
                duration_seconds,
            } => {
                // Audio generation placeholder
                ActionResult::success("generate_audio").with_data(serde_json::json!({
                    "prompt": prompt,
                    "audio_type": audio_type,
                    "model": model,
                    "duration": duration_seconds
                }))
            }
        }
    }

    async fn execute_generate_image(
        prompt: String,
        model: String,
        width: u32,
        height: u32,
        token_ids: Vec<String>,
    ) -> ActionResult {
        // Create workflow request
        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToImage,
            prompt,
            negative_prompt: None,
            model,
            width,
            height,
            steps: None,
            cfg_scale: None,
            seed: None,
            input_image: None,
            token_context: if token_ids.is_empty() {
                None
            } else {
                Some(token_ids.join(","))
            },
        };

        let workflow = generate_workflow(&request);

        // Return workflow for frontend to execute via ComfyUI commands
        ActionResult::success("generate_image")
            .with_execution_id(uuid::Uuid::new_v4().to_string())
            .with_credits(workflow.estimated_credits)
            .with_data(serde_json::json!({
                "is_local": workflow.is_local,
                "workflow": workflow.workflow_json,
                "status": "pending"
            }))
    }

    async fn execute_generate_video(
        prompt: String,
        model: String,
        _duration_seconds: f32,
        reference_image: Option<String>,
        token_ids: Vec<String>,
    ) -> ActionResult {
        let workflow_type = if reference_image.is_some() {
            WorkflowType::ImageToVideo
        } else {
            WorkflowType::TextToVideo
        };

        let request = WorkflowRequest {
            workflow_type,
            prompt,
            negative_prompt: None,
            model,
            width: 1280,
            height: 720,
            steps: None,
            cfg_scale: None,
            seed: None,
            input_image: reference_image,
            token_context: if token_ids.is_empty() {
                None
            } else {
                Some(token_ids.join(","))
            },
        };

        let workflow = generate_workflow(&request);

        // Return workflow for frontend to execute
        ActionResult::success("generate_video")
            .with_execution_id(uuid::Uuid::new_v4().to_string())
            .with_credits(workflow.estimated_credits)
            .with_data(serde_json::json!({
                "workflow": workflow.workflow_json,
                "status": "pending"
            }))
    }

    async fn execute_vault_update(
        token_type: String,
        token_name: String,
        description: String,
        _reference_image: Option<String>,
    ) -> ActionResult {
        // Return data for frontend to create token via existing commands
        ActionResult::success("update_vault").with_data(serde_json::json!({
            "token_type": token_type,
            "token_name": token_name,
            "description": description,
            "action": "create_token"
        }))
    }

    async fn execute_comfyui_workflow(workflow_json: String) -> ActionResult {
        // Return workflow for frontend to execute via comfyui_execute command
        ActionResult::success("execute_workflow")
            .with_execution_id(uuid::Uuid::new_v4().to_string())
            .with_data(serde_json::json!({
                "workflow": workflow_json,
                "status": "pending"
            }))
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSE ACTIONS FROM LLM RESPONSE
// ═══════════════════════════════════════════════════════════════════════════════

/// Parse actions from an LLM response
pub fn parse_actions_from_response(response: &str) -> Vec<AgentAction> {
    let mut actions = Vec::new();

    // Look for JSON action blocks
    if let Some(start) = response.find("```json") {
        if let Some(end) = response[start..].find("```\n") {
            let json_str = &response[start + 7..start + end];
            if let Ok(action) = serde_json::from_str::<AgentAction>(json_str) {
                actions.push(action);
            }
        }
    }

    // Look for specific patterns in the response
    let lower = response.to_lowercase();

    // Image generation pattern
    if lower.contains("generating image") || lower.contains("creating image") {
        if let Some(prompt) = extract_quoted_text(response) {
            actions.push(AgentAction::GenerateImage {
                prompt,
                model: "flux-schnell".into(),
                width: 1024,
                height: 1024,
                token_ids: Vec::new(),
            });
        }
    }

    // Video generation pattern
    if lower.contains("generating video") || lower.contains("creating video") {
        if let Some(prompt) = extract_quoted_text(response) {
            actions.push(AgentAction::GenerateVideo {
                prompt,
                model: "kling".into(),
                duration_seconds: 5.0,
                reference_image: None,
                token_ids: Vec::new(),
            });
        }
    }

    // Script update pattern
    if lower.contains("here's the revised") || lower.contains("updated script") {
        if let Some(content) = extract_script_block(response) {
            actions.push(AgentAction::UpdateScript {
                mode: ScriptUpdateMode::ReplaceSelection,
                content,
                line_start: None,
                line_end: None,
            });
        }
    }

    actions
}

fn extract_quoted_text(text: &str) -> Option<String> {
    // Find text between quotes
    if let Some(start) = text.find('"') {
        if let Some(end) = text[start + 1..].find('"') {
            return Some(text[start + 1..start + 1 + end].to_string());
        }
    }
    None
}

fn extract_script_block(text: &str) -> Option<String> {
    // Look for screenplay formatting
    if let Some(start) = text.find("INT.").or_else(|| text.find("EXT.")) {
        // Find until the next double newline or end
        let rest = &text[start..];
        let end = rest.find("\n\n\n").unwrap_or(rest.len());
        return Some(rest[..end].to_string());
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_action_result_builder() {
        let result = ActionResult::success("test")
            .with_execution_id("exec-123".into())
            .with_credits(0.5);

        assert!(result.success);
        assert_eq!(result.execution_id, Some("exec-123".into()));
        assert_eq!(result.credits_used, Some(0.5));
    }

    #[test]
    fn test_parse_image_action() {
        let response = r#"I'm generating image "A sunset over mountains" for you."#;
        let actions = parse_actions_from_response(response);
        // The pattern "generating image" + quoted text should match
        assert_eq!(actions.len(), 1);
        if let AgentAction::GenerateImage { prompt, .. } = &actions[0] {
            assert_eq!(prompt, "A sunset over mountains");
        } else {
            panic!("Expected GenerateImage action");
        }
    }
}
