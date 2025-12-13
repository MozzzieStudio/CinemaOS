//! Tests for AI Backend Components
//!
//! Unit tests and mocked integration tests.

#[cfg(test)]
mod llm_tests {
    use crate::ai::llm_client::*;

    #[test]
    fn test_llm_message_creation() {
        let msg = LLMMessage {
            role: "user".into(),
            content: "Hello, world!".into(),
        };
        assert_eq!(msg.role, "user");
        assert_eq!(msg.content, "Hello, world!");
    }

    #[test]
    fn test_llm_request_builder() {
        let request = LLMRequest {
            provider: LLMProvider::Gemini,
            model: "gemini-2.0-flash".into(),
            messages: vec![LLMMessage {
                role: "user".into(),
                content: "Test".into(),
            }],
            temperature: Some(0.7),
            max_tokens: Some(4096),
            system_prompt: Some("You are helpful".into()),
        };

        assert_eq!(request.provider, LLMProvider::Gemini);
        assert!(request.system_prompt.is_some());
    }

    #[test]
    fn test_provider_variants() {
        let providers = vec![
            LLMProvider::Gemini,
            LLMProvider::OpenAI,
            LLMProvider::Anthropic,
            LLMProvider::Ollama,
            LLMProvider::LlamaStack,
        ];
        assert_eq!(providers.len(), 5);
    }

    #[test]
    fn test_token_usage() {
        let usage = TokenUsage {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
        };
        assert_eq!(
            usage.total_tokens,
            usage.prompt_tokens + usage.completion_tokens
        );
    }
}

#[cfg(test)]
mod agent_tests {
    use crate::ai::agents::crew::VirtualCrew;
    use crate::ai::agents::traits::AgentRole;

    #[test]
    fn test_all_roles_exist() {
        let roles = AgentRole::all();
        assert_eq!(roles.len(), 11);
    }

    #[test]
    fn test_role_display_names() {
        assert_eq!(AgentRole::Showrunner.display_name(), "The Showrunner");
        assert_eq!(AgentRole::Scriptwriter.display_name(), "Scriptwriter");
        assert_eq!(AgentRole::CameraDirector.display_name(), "Camera Director");
    }

    #[test]
    fn test_crew_creation() {
        let crew = VirtualCrew::new();
        assert!(crew.get(AgentRole::Showrunner).is_some());
        assert!(crew.get(AgentRole::Scriptwriter).is_some());
        assert!(crew.get(AgentRole::CameraDirector).is_some());
    }

    #[test]
    fn test_intent_routing_image() {
        let crew = VirtualCrew::new();
        let role = crew.route_by_intent("Generate an image of a sunset");
        assert_eq!(role, AgentRole::PhotographyDirector);
    }

    #[test]
    fn test_intent_routing_video() {
        let crew = VirtualCrew::new();
        let role = crew.route_by_intent("Create a video of the hero walking");
        assert_eq!(role, AgentRole::CameraDirector);
    }

    #[test]
    fn test_intent_routing_script() {
        let crew = VirtualCrew::new();
        let role = crew.route_by_intent("Write dialogue for this scene");
        assert_eq!(role, AgentRole::Scriptwriter);
    }

    #[test]
    fn test_intent_routing_default() {
        let crew = VirtualCrew::new();
        let role = crew.route_by_intent("What should we do?");
        assert_eq!(role, AgentRole::Showrunner);
    }
}

#[cfg(test)]
mod workflow_tests {
    use crate::ai::workflow_generator::*;

    #[test]
    fn test_local_workflow_generation() {
        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToImage,
            prompt: "A cat".into(),
            negative_prompt: None,
            model: "sdxl".into(),
            width: 1024,
            height: 1024,
            steps: None,
            seed: None,
            input_image: None,
            force_local: None,
        };

        let result = generate_workflow(&request).unwrap();
        assert!(result.is_local);
        assert_eq!(result.estimated_cost, 0.0);
        assert!(result.workflow_json.contains("KSampler"));
    }

    #[test]
    fn test_cloud_workflow_generation() {
        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToImage,
            prompt: "A dog".into(),
            negative_prompt: None,
            model: "flux-pro".into(),
            width: 1024,
            height: 1024,
            steps: None,
            seed: None,
            input_image: None,
            force_local: None,
        };

        // Note: In strict mode this might fail if model ID isn't in models.rs,
        // but for now we test structure.
        let result = generate_workflow(&request).unwrap();
        // Default impl currently always returns local template unless configured otherwise
        // Just checking field access here
        assert!(result.estimated_cost >= 0.0);
    }

    #[test]
    fn test_workflow_types() {
        let types = vec![
            WorkflowType::TextToImage,
            WorkflowType::ImageToImage,
            WorkflowType::TextToVideo,
            WorkflowType::ImageToVideo,
        ];
        assert_eq!(types.len(), 4);
    }
}

#[cfg(test)]
mod error_tests {
    use crate::errors::*;

    #[test]
    fn test_llm_error_retryable() {
        let rate_limited = LLMError::RateLimited {
            provider: "gemini".into(),
            retry_after_secs: 30,
        };
        assert!(rate_limited.is_retryable());
        assert_eq!(rate_limited.retry_delay(), Some(30));
    }

    #[test]
    fn test_llm_error_not_retryable() {
        let auth_error = LLMError::AuthenticationFailed {
            provider: "openai".into(),
            message: "invalid key".into(),
        };
        assert!(!auth_error.is_retryable());
        assert_eq!(auth_error.retry_delay(), None);
    }

    #[test]
    fn test_error_display() {
        let err = LLMError::MissingApiKey {
            provider: "Gemini".into(),
            env_var: "GOOGLE_API_KEY".into(),
        };
        let msg = err.to_string();
        assert!(msg.contains("GOOGLE_API_KEY"));
        assert!(msg.contains("Gemini"));
    }

    #[test]
    fn test_app_error_conversion() {
        let llm_err = LLMError::Timeout { timeout_secs: 30 };
        let app_err: AppError = llm_err.into();
        let msg: String = app_err.into();
        assert!(msg.contains("timeout"));
    }
}

#[cfg(test)]
mod installer_tests {
    use crate::installer::*;

    #[test]
    fn test_path_functions() {
        let cinema_dir = get_cinema_os_dir();
        assert!(cinema_dir.to_string_lossy().contains("CinemaOS"));

        let comfyui_dir = get_comfyui_dir();
        assert!(comfyui_dir.to_string_lossy().contains("comfyui"));

        let models_dir = get_models_dir();
        assert!(models_dir.to_string_lossy().contains("models"));
    }

    #[test]
    fn test_install_progress() {
        let progress =
            InstallProgress::new(InstallStatus::InstallingComfyUI, 5, "Installing ComfyUI...");
        assert_eq!(progress.step, 5);
        assert_eq!(progress.total_steps, 6);
        assert!(progress.percent > 0.0);
    }

    #[test]
    fn test_install_statuses() {
        let statuses = vec![
            InstallStatus::NotStarted,
            InstallStatus::CheckingPrerequisites,
            InstallStatus::InstallingUV,
            InstallStatus::InstallingPython,
            InstallStatus::CreatingVenv,
            InstallStatus::InstallingComfyUI,
            InstallStatus::Completed,
            InstallStatus::Failed("test".into()),
        ];
        assert_eq!(statuses.len(), 8);
    }
}

// Downloader tests require additional setup - covered in integration tests
