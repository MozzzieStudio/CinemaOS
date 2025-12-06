//! Clerk JWT authentication

use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};

/// Authenticated user extracted from JWT
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthenticatedUser {
    /// Clerk user ID
    pub user_id: String,
    /// User email (if available)
    pub email: Option<String>,
}

/// JWT claims from Clerk
#[derive(Debug, Deserialize)]
struct ClerkClaims {
    sub: String,
    email: Option<String>,
    #[allow(dead_code)]
    exp: usize,
    #[allow(dead_code)]
    iat: usize,
}

/// Clerk authentication extractor
pub struct ClerkAuth(pub AuthenticatedUser);

#[axum::async_trait]
impl<S> FromRequestParts<S> for ClerkAuth
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Get Authorization header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or(AuthError::MissingToken)?;

        // Extract Bearer token
        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AuthError::InvalidToken)?;

        // In development, allow a test token
        if cfg!(debug_assertions) && token == "dev-token" {
            return Ok(ClerkAuth(AuthenticatedUser {
                user_id: "dev-user".to_string(),
                email: Some("dev@cinemaos.com".to_string()),
            }));
        }

        // Get public key from environment
        let public_key = std::env::var("CLERK_PUBLIC_KEY")
            .map_err(|_| AuthError::ConfigError)?;

        // Decode and validate JWT
        let token_data = decode::<ClerkClaims>(
            token,
            &DecodingKey::from_rsa_pem(public_key.as_bytes())
                .map_err(|_| AuthError::InvalidKey)?,
            &Validation::new(Algorithm::RS256),
        )
        .map_err(|_| AuthError::InvalidToken)?;

        Ok(ClerkAuth(AuthenticatedUser {
            user_id: token_data.claims.sub,
            email: token_data.claims.email,
        }))
    }
}

/// Authentication errors
#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidToken,
    InvalidKey,
    ConfigError,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authorization token"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
            AuthError::InvalidKey => (StatusCode::INTERNAL_SERVER_ERROR, "Key configuration error"),
            AuthError::ConfigError => (StatusCode::INTERNAL_SERVER_ERROR, "Server configuration error"),
        };

        (status, message).into_response()
    }
}
