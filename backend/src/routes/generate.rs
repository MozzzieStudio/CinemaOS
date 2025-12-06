//! Generation endpoints for image and video

use crate::{AppState, auth::ClerkAuth, providers::fal::{FalImageRequest, FalVideoRequest}};
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

/// Image generation request
#[derive(Debug, Deserialize)]
pub struct ImageGenRequest {
    pub prompt: String,
    pub model: Option<String>,
    pub size: Option<String>,
}

/// Video generation request
#[derive(Debug, Deserialize)]
pub struct VideoGenRequest {
    pub prompt: String,
    pub model: Option<String>,
    pub duration: Option<f32>,
    pub image_url: Option<String>,
}

/// Generation response
#[derive(Debug, Serialize)]
pub struct GenerationResponse {
    pub request_id: String,
    pub status: String,
    pub url: Option<String>,
    pub credits_used: i64,
}

/// Error response
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// Image generation handler
pub async fn image_handler(
    State(state): State<AppState>,
    auth: ClerkAuth,
    Json(request): Json<ImageGenRequest>,
) -> Result<Json<GenerationResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    let user = auth.0;
    
    // Get user and check credits
    let db_user = state.firestore
        .get_or_create_user(&user.user_id, user.email.as_deref())
        .await
        .map_err(|e| (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    let cost = 5; // 5 credits per image
    if db_user.credits < cost {
        return Err((
            axum::http::StatusCode::PAYMENT_REQUIRED,
            Json(ErrorResponse { error: "Insufficient credits".to_string() })
        ));
    }

    // Generate image
    let fal_request = FalImageRequest {
        prompt: request.prompt,
        model: request.model.unwrap_or_else(|| "flux-schnell".to_string()),
        image_size: request.size,
        num_images: Some(1),
    };

    let result = state.fal
        .generate_image(fal_request)
        .await
        .map_err(|e| (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    // Deduct credits on success
    state.firestore
        .deduct_credits(&user.user_id, cost, "image_generation")
        .await
        .map_err(|e| (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    // Extract URL from result
    let url = result.output
        .and_then(|o| o.images)
        .and_then(|imgs| imgs.first().map(|i| i.url.clone()));

    Ok(Json(GenerationResponse {
        request_id: result.request_id,
        status: result.status,
        url,
        credits_used: cost,
    }))
}

/// Video generation handler
pub async fn video_handler(
    State(state): State<AppState>,
    auth: ClerkAuth,
    Json(request): Json<VideoGenRequest>,
) -> Result<Json<GenerationResponse>, (axum::http::StatusCode, Json<ErrorResponse>)> {
    let user = auth.0;
    
    // Get user and check credits
    let db_user = state.firestore
        .get_or_create_user(&user.user_id, user.email.as_deref())
        .await
        .map_err(|e| (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    let duration = request.duration.unwrap_or(5.0);
    let cost = (duration * 10.0) as i64; // 10 credits per second
    
    if db_user.credits < cost {
        return Err((
            axum::http::StatusCode::PAYMENT_REQUIRED,
            Json(ErrorResponse { error: "Insufficient credits".to_string() })
        ));
    }

    // Generate video
    let fal_request = FalVideoRequest {
        prompt: request.prompt,
        model: request.model.unwrap_or_else(|| "kling-standard".to_string()),
        duration: Some(duration),
        image_url: request.image_url,
    };

    let result = state.fal
        .generate_video(fal_request)
        .await
        .map_err(|e| (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    // Deduct credits on success
    state.firestore
        .deduct_credits(&user.user_id, cost, "video_generation")
        .await
        .map_err(|e| (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse { error: e.to_string() })
        ))?;

    // Extract URL from result
    let url = result.output
        .and_then(|o| o.video)
        .map(|v| v.url);

    Ok(Json(GenerationResponse {
        request_id: result.request_id,
        status: result.status,
        url,
        credits_used: cost,
    }))
}
