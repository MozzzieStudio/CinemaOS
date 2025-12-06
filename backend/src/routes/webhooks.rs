//! Webhook handlers for Fal.ai callbacks

use axum::Json;
use serde::{Deserialize, Serialize};

/// Fal.ai webhook payload
#[derive(Debug, Deserialize)]
pub struct FalWebhookPayload {
    pub request_id: String,
    pub status: String,
    pub logs: Option<Vec<String>>,
    pub output: Option<serde_json::Value>,
}

/// Webhook response
#[derive(Debug, Serialize)]
pub struct WebhookResponse {
    pub received: bool,
}

/// Handle Fal.ai webhook
pub async fn fal_webhook(
    Json(payload): Json<FalWebhookPayload>,
) -> Json<WebhookResponse> {
    tracing::info!(
        request_id = %payload.request_id,
        status = %payload.status,
        "Received Fal.ai webhook"
    );

    // TODO: 
    // 1. Look up the original request in database
    // 2. Update the generation status
    // 3. Notify the user via Pub/Sub or WebSocket

    Json(WebhookResponse { received: true })
}
