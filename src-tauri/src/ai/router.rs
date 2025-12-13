//! AI Request Router
//!
//! Determines whether a request runs Locally or in the Cloud based on:
//! 1. Hardware Capabilities (VRAM)
//! 2. User Settings (Force Cloud)
//! 3. Model Logic (pricing, availability)

use crate::ai::models::ModelDefinition;
use crate::ai::models::{get_all_models, ModelCapability, ModelLocation, ModelPricing};

use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct RouterDecision {
    pub model_id: String,
    pub location: ModelLocation,
    pub estimated_cost: f64,
    pub reason: String,
}

/// Route a request to the best available model
pub fn route_model_request(
    task_type: ModelCapability,
    preferred_model_id: Option<String>,
    force_local: bool,
) -> Result<RouterDecision, String> {
    let all_models = get_all_models();

    // 1. If user prefers a specific model, try that first
    if let Some(id) = preferred_model_id {
        if let Some(model) = all_models.iter().find(|m| m.id == id) {
            // Check if asking for Local but model is Cloud-only
            if force_local && model.location == ModelLocation::Cloud {
                return Err(format!(
                    "Model {} is Cloud-only, but Force Local is enabled.",
                    id
                ));
            }

            return Ok(RouterDecision {
                model_id: model.id.clone(),
                location: model.location.clone(),
                estimated_cost: calculate_base_cost(&model.pricing),
                reason: "User Preference".into(),
            });
        }
    }

    // 2. Filter by Capability
    let capable_models: Vec<&ModelDefinition> = all_models
        .iter()
        .filter(|m| m.capabilities.contains(&task_type))
        .collect();

    if capable_models.is_empty() {
        return Err("No models found for this capability".into());
    }

    // 3. Selection Logic
    // If Force Local -> Pick best Local model
    if force_local {
        let local_model = capable_models
            .iter()
            .find(|m| m.location == ModelLocation::Local);

        match local_model {
            Some(m) => {
                return Ok(RouterDecision {
                    model_id: m.id.clone(),
                    location: ModelLocation::Local,
                    estimated_cost: 0.0,
                    reason: "Force Local Strategy".into(),
                })
            }
            None => return Err("No Local models available for this task type".into()),
        }
    }

    // Default: Pick the "Best" (First in list usually implies flagship in our models.rs sorting)
    // Or pick the cheapest? For now, let's pick the first one which is usually the 'Pro' model
    let best_model = capable_models.first().unwrap();

    Ok(RouterDecision {
        model_id: best_model.id.clone(),
        location: best_model.location.clone(),
        estimated_cost: calculate_base_cost(&best_model.pricing),
        reason: "Default Best Available".into(),
    })
}

fn calculate_base_cost(pricing: &ModelPricing) -> f64 {
    // Estimate cost based on unit type for a "standard" request
    match pricing.unit_type.as_str() {
        "image" => pricing.output_cost,        // Cost per image
        "second" => pricing.output_cost * 5.0, // Assume 5 seconds video
        "1M tokens" => (pricing.input_cost + pricing.output_cost) / 1000.0, // Cost per 1k tokens (rough estimate for request)
        "free" => 0.0,
        _ => 0.0,
    }
}
