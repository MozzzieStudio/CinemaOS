//! CinemaOS Backend API
//! 
//! Production backend for AI services proxy with Cloud Run, Vertex AI, and Fal.ai.

mod config;
mod auth;
mod db;
mod providers;
mod routes;
mod queue;
mod observability;

use axum::{
    Router,
    routing::{get, post},
    http::Method,
};
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    tracing::info!("Starting CinemaOS API server...");

    // Load config
    let config = config::Config::from_env()?;
    let state = AppState::new(config).await?;

    // Build router
    let app = Router::new()
        // Health check
        .route("/health", get(routes::health::health_check))
        // Chat (streaming)
        .route("/api/chat", post(routes::chat::chat_handler))
        // Image generation
        .route("/api/generate/image", post(routes::generate::image_handler))
        // Video generation
        .route("/api/generate/video", post(routes::generate::video_handler))
        // Credits
        .route("/api/credits", get(routes::credits::get_credits))
        .route("/api/credits/topup", post(routes::credits::topup_handler))
        // Webhooks
        .route("/api/webhook/fal", post(routes::webhooks::fal_webhook))
        // Middleware
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Get port from environment (Cloud Run sets PORT)
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()?;
    
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    pub config: config::Config,
    pub firestore: db::firestore::FirestoreClient,
    pub storage: db::storage::StorageClient,
    pub vertex: providers::vertex::VertexClient,
    pub fal: providers::fal::FalClient,
}

impl AppState {
    pub async fn new(config: config::Config) -> anyhow::Result<Self> {
        let firestore = db::firestore::FirestoreClient::new(&config).await?;
        let storage = db::storage::StorageClient::new(&config).await?;
        let vertex = providers::vertex::VertexClient::new(&config)?;
        let fal = providers::fal::FalClient::new(&config)?;

        Ok(Self {
            config,
            firestore,
            storage,
            vertex,
            fal,
        })
    }
}
