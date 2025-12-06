//! Vault API - HTTP endpoints for Python custom nodes
//!
//! Provides REST API for:
//! - Token CRUD (characters, locations, props)
//! - Asset upload/download
//! - Credit usage tracking

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenData {
    pub id: String,
    pub name: String,
    pub token_type: String,
    pub description: Option<String>,
    pub visuals: Vec<Visual>,
    pub style_prompt: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Visual {
    pub id: String,
    pub path: String,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetUpload {
    pub filename: String,
    pub data: String, // base64
    pub token_type: Option<String>,
    pub token_name: Option<String>,
    pub description: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetResponse {
    pub id: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreditUsage {
    pub credits: f32,
    pub model: String,
    pub project_id: Option<String>,
    pub timestamp: String,
    pub node_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreditBalance {
    pub balance: f32,
    pub used_this_session: f32,
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Default)]
pub struct VaultState {
    tokens: HashMap<String, TokenData>,
    assets: HashMap<String, String>, // id -> path
    credit_balance: f32,
    credit_used: f32,
}

pub type SharedState = Arc<RwLock<VaultState>>;

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

async fn get_token(
    Path((token_type, token_name)): Path<(String, String)>,
    State(state): State<SharedState>,
) -> Result<Json<TokenData>, StatusCode> {
    let state = state.read().await;
    let key = format!("{}:{}", token_type, token_name);

    state
        .tokens
        .get(&key)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

async fn list_tokens(
    Path(token_type): Path<String>,
    State(state): State<SharedState>,
) -> Json<Vec<TokenData>> {
    let state = state.read().await;
    let tokens: Vec<TokenData> = state
        .tokens
        .values()
        .filter(|t| t.token_type == token_type)
        .cloned()
        .collect();
    Json(tokens)
}

async fn create_token(
    State(state): State<SharedState>,
    Json(token): Json<TokenData>,
) -> Result<Json<TokenData>, StatusCode> {
    let mut state = state.write().await;
    let key = format!("{}:{}", token.token_type, token.name);
    state.tokens.insert(key, token.clone());
    Ok(Json(token))
}

async fn upload_asset(
    State(state): State<SharedState>,
    Json(upload): Json<AssetUpload>,
) -> Result<Json<AssetResponse>, StatusCode> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    use std::path::PathBuf;

    // Decode base64
    let data = STANDARD
        .decode(&upload.data)
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    // Generate ID and path
    let id = uuid::Uuid::new_v4().to_string()[..8].to_string();
    let assets_dir = dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("CinemaOS")
        .join("assets");

    std::fs::create_dir_all(&assets_dir).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let path = assets_dir.join(&upload.filename);
    std::fs::write(&path, &data).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let path_str = path.to_string_lossy().to_string();

    // Store reference
    let mut state = state.write().await;
    state.assets.insert(id.clone(), path_str.clone());

    Ok(Json(AssetResponse { id, path: path_str }))
}

async fn track_credits(
    State(state): State<SharedState>,
    Json(usage): Json<CreditUsage>,
) -> Json<CreditBalance> {
    let mut state = state.write().await;
    state.credit_used += usage.credits;
    state.credit_balance -= usage.credits;

    Json(CreditBalance {
        balance: state.credit_balance,
        used_this_session: state.credit_used,
    })
}

async fn get_credit_balance(State(state): State<SharedState>) -> Json<CreditBalance> {
    let state = state.read().await;
    Json(CreditBalance {
        balance: state.credit_balance,
        used_this_session: state.credit_used,
    })
}

async fn health_check() -> &'static str {
    "OK"
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

pub fn create_router(state: SharedState) -> Router {
    Router::new()
        // Health
        .route("/health", get(health_check))
        // Tokens
        .route("/api/tokens/:token_type", get(list_tokens))
        .route("/api/tokens/:token_type/:token_name", get(get_token))
        .route("/api/tokens", post(create_token))
        // Assets
        .route("/api/assets/upload", post(upload_asset))
        // Credits
        .route("/api/credits/usage", post(track_credits))
        .route("/api/credits/balance", get(get_credit_balance))
        .with_state(state)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════════════

pub async fn start_vault_api(port: u16) -> Result<(), String> {
    let state = Arc::new(RwLock::new(VaultState {
        tokens: HashMap::new(),
        assets: HashMap::new(),
        credit_balance: 100.0, // Default starting credits
        credit_used: 0.0,
    }));

    let app = create_router(state);

    let addr = format!("127.0.0.1:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| format!("Failed to bind: {}", e))?;

    tracing::info!("Vault API listening on http://{}", addr);

    axum::serve(listener, app)
        .await
        .map_err(|e| format!("Server error: {}", e))
}
