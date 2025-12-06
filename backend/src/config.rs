//! Configuration module for CinemaOS API

use serde::Deserialize;

/// Application configuration loaded from environment variables
#[derive(Clone, Debug, Deserialize)]
pub struct Config {
    /// GCP Project ID
    pub gcp_project_id: String,

    /// GCP Region (e.g., europe-west1)
    pub gcp_region: String,

    /// Firestore database ID (usually "(default)")
    pub firestore_database: String,

    /// Cloud Storage bucket for assets
    pub storage_bucket: String,

    /// Fal.ai API key
    pub fal_api_key: String,

    /// Clerk public key for JWT validation
    pub clerk_public_key: String,

    /// Stripe secret key (optional, for payments)
    pub stripe_secret_key: Option<String>,

    /// Environment (development, staging, production)
    pub environment: Environment,
}

#[derive(Clone, Debug, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    #[default]
    Development,
    Staging,
    Production,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> anyhow::Result<Self> {
        // Load .env file in development
        let _ = dotenvy::dotenv();

        Ok(Self {
            gcp_project_id: std::env::var("GCP_PROJECT_ID")
                .unwrap_or_else(|_| "gen-lang-client-0893445302".to_string()),
            gcp_region: std::env::var("GCP_REGION").unwrap_or_else(|_| "europe-west1".to_string()),
            firestore_database: std::env::var("FIRESTORE_DATABASE")
                .unwrap_or_else(|_| "(default)".to_string()),
            storage_bucket: std::env::var("STORAGE_BUCKET")
                .unwrap_or_else(|_| "cinemaos-assets".to_string()),
            fal_api_key: std::env::var("FAL_API_KEY").expect("FAL_API_KEY must be set"),
            clerk_public_key: std::env::var("CLERK_PUBLIC_KEY").unwrap_or_default(),
            stripe_secret_key: std::env::var("STRIPE_SECRET_KEY").ok(),
            environment: match std::env::var("ENVIRONMENT").as_deref() {
                Ok("production") => Environment::Production,
                Ok("staging") => Environment::Staging,
                _ => Environment::Development,
            },
        })
    }

    /// Check if running in production
    pub fn is_production(&self) -> bool {
        matches!(self.environment, Environment::Production)
    }
}
