//! AI Router - Routes requests to local or cloud providers
//!
//! The router handles:
//! 1. Checking if local execution is possible
//! 2. Routing to the appropriate cloud provider if needed
//! 3. Tracking credit usage

use crate::ai::{
    local::{
        can_run_locally, get_local_provider, HardwareCapabilities,
    },
    models::{get_all_models, ModelDefinition, ModelLocation},
    providers::get_provider_for_model,
};
use serde::{Deserialize, Serialize};
use specta::Type;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum RouterError {
    #[error("Model not found: {0}")]
    ModelNotFound(String),
    #[error("Insufficient credits: need {required}, have {available}")]
    InsufficientCredits { required: f64, available: f64 },
    #[error("Local execution not available: {0}")]
    LocalNotAvailable(String),
    #[error("Provider error: {0}")]
    ProviderError(String),
}

/// Result of routing a request
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RoutingResult {
    pub model_id: String,
    pub model_name: String,
    pub execution_type: ExecutionType,
    pub estimated_cost: Option<f64>,
    pub provider: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum ExecutionType {
    Local { provider: String },
    Cloud { provider: String },
}

/// Route a model request
pub fn route_model_request(
    model_id: &str,
    hw: &HardwareCapabilities,
    prefer_local: bool,
) -> Result<RoutingResult, RouterError> {
    // Find the model
    let model = get_all_models()
        .into_iter()
        .find(|m| m.id == model_id)
        .ok_or_else(|| RouterError::ModelNotFound(model_id.to_string()))?;

    // Check if we can run locally
    let can_local = model.location == ModelLocation::Local && can_run_locally(model_id, hw);

    // Determine execution type
    let execution_type = if can_local && prefer_local {
        let local_provider = get_local_provider(model_id);
        ExecutionType::Local {
            provider: format!("{:?}", local_provider),
        }
    } else if model.location == ModelLocation::Cloud || !can_local {
        let cloud_provider = get_provider_for_model(model_id);
        ExecutionType::Cloud {
            provider: format!("{:?}", cloud_provider),
        }
    } else {
        // Local model but user doesn't prefer local
        let cloud_provider = get_provider_for_model(model_id);
        ExecutionType::Cloud {
            provider: format!("{:?}", cloud_provider),
        }
    };

    Ok(RoutingResult {
        model_id: model.id.clone(),
        model_name: model.name.clone(),
        execution_type,
        estimated_cost: model.cost_per_unit,
        provider: Some(model.provider.clone()),
    })
}

/// Get recommended models for a task type
pub fn get_recommended_models(
    task_type: &str,
    hw: &HardwareCapabilities,
) -> Vec<(ModelDefinition, bool)> {
    use crate::ai::models::ModelCapability;

    let capability = match task_type {
        "text" | "script" | "dialogue" => ModelCapability::TextGeneration,
        "image" | "concept_art" => ModelCapability::TextToImage,
        "video" | "shot" => ModelCapability::TextToVideo,
        "voice" | "tts" => ModelCapability::TextToSpeech,
        "transcription" | "stt" => ModelCapability::SpeechToText,
        "music" | "sfx" => ModelCapability::AudioGeneration,
        "segment" | "mask" => ModelCapability::Segmentation,
        _ => ModelCapability::TextGeneration,
    };

    get_all_models()
        .into_iter()
        .filter(|m| m.capabilities.contains(&capability))
        .map(|m| {
            let can_local = m.location == ModelLocation::Local && can_run_locally(&m.id, hw);
            (m, can_local)
        })
        .collect()
}
