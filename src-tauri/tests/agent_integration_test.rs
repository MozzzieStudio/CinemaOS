use cinema_os_core_lib::ai::actions::AgentAction;
use cinema_os_core_lib::ai::workflow_generator::{
    generate_workflow, WorkflowRequest, WorkflowType,
};

#[test]
fn test_agent_action_to_workflow() {
    // 1. Simulate AgentAction::GenerateImage
    let action = AgentAction::GenerateImage {
        prompt: "A cyberpunk city at night, neon lights".to_string(),
        model: "sdxl".to_string(),
        width: 1920,
        height: 1080,
        token_ids: vec![],
    };

    // 2. Validate translation to WorkflowRequest
    if let AgentAction::GenerateImage {
        prompt,
        model,
        width,
        height,
        token_ids,
    } = action
    {
        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToImage,
            prompt: prompt.clone(),
            negative_prompt: None,
            model: model.clone(),
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

        // 3. Generate Workflow
        let workflow = generate_workflow(&request);

        // 4. Validate Result
        assert!(workflow.workflow_json.len() > 0);
        // Verify typical nodes exist
        assert!(
            workflow.workflow_json.contains("KSampler")
                || workflow.workflow_json.contains("CheckpointLoaderSimple")
        );
        // Check estimated credits
        assert!(workflow.estimated_credits >= 0.0);
    } else {
        panic!("Action type mismatch");
    }
}

#[test]
fn test_video_action_to_workflow() {
    let action = AgentAction::GenerateVideo {
        prompt: "A car chase in a cyberpunk city".to_string(),
        model: "kling-v2".to_string(),
        duration_seconds: 5.0,
        reference_image: None,
        token_ids: vec![],
    };

    if let AgentAction::GenerateVideo {
        prompt,
        model,
        reference_image,
        token_ids,
        ..
    } = action
    {
        let request = WorkflowRequest {
            workflow_type: WorkflowType::TextToVideo,
            prompt: prompt.clone(),
            negative_prompt: None,
            model: model.clone(),
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
        assert!(workflow.workflow_json.len() > 0);
    }
}
