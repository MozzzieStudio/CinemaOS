//! Credits management endpoints

use crate::{AppState, auth::ClerkAuth};
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

/// Credits balance response
#[derive(Debug, Serialize)]
pub struct CreditsResponse {
    pub credits: i64,
    pub user_id: String,
}

/// Topup request
#[derive(Debug, Deserialize)]
pub struct TopupRequest {
    pub amount: i64,
    pub payment_intent_id: String,
}

/// Topup response
#[derive(Debug, Serialize)]
pub struct TopupResponse {
    pub success: bool,
    pub new_balance: i64,
}

/// Get current credits
pub async fn get_credits(
    State(state): State<AppState>,
    auth: ClerkAuth,
) -> Result<Json<CreditsResponse>, axum::http::StatusCode> {
    let user = auth.0;
    
    let db_user = state.firestore
        .get_or_create_user(&user.user_id, user.email.as_deref())
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(CreditsResponse {
        credits: db_user.credits,
        user_id: db_user.id,
    }))
}

/// Handle credit topup (after Stripe payment)
pub async fn topup_handler(
    State(state): State<AppState>,
    auth: ClerkAuth,
    Json(request): Json<TopupRequest>,
) -> Result<Json<TopupResponse>, axum::http::StatusCode> {
    let user = auth.0;
    
    // TODO: Verify payment_intent_id with Stripe
    // For now, just add credits
    
    state.firestore
        .add_credits(&user.user_id, request.amount, &format!("topup_{}", request.payment_intent_id))
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    let db_user = state.firestore
        .get_user(&user.user_id)
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(axum::http::StatusCode::NOT_FOUND)?;

    Ok(Json(TopupResponse {
        success: true,
        new_balance: db_user.credits,
    }))
}
