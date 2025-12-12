//! Sentry (Observability) Integration
//!
//! Error tracking and performance monitoring

use sentry::IntoDsn;
use tracing::info;

/// Initialize Sentry
pub fn init_sentry() -> sentry::ClientInitGuard {
    // Get DSN from environment
    let dsn = std::env::var("SENTRY_DSN")
        .ok()
        .and_then(|s| s.into_dsn().ok())
        .flatten();

    let guard = sentry::init((
        dsn,
        sentry::ClientOptions {
            release: sentry::release_name!(),
            environment: Some(
                std::env::var("SENTRY_ENVIRONMENT")
                    .unwrap_or_else(|_| "development".into())
                    .into(),
            ),
            traces_sample_rate: 0.2, // 20% of transactions
            attach_stacktrace: true,
            send_default_pii: false, // Privacy-first
            ..Default::default()
        },
    ));

    if guard.is_enabled() {
        info!("✅ Sentry initialized");
    } else {
        info!("ℹ️ Sentry disabled (no DSN)");
    }

    guard
}

/// Set user context for Sentry
pub fn set_user(user_id: impl Into<String>) {
    sentry::configure_scope(|scope| {
        scope.set_user(Some(sentry::User {
            id: Some(user_id.into()),
            ..Default::default()
        }));
    });
}

/// Clear user context
pub fn clear_user() {
    sentry::configure_scope(|scope| {
        scope.set_user(None);
    });
}

/// Add breadcrumb for debugging
pub fn add_breadcrumb(message: impl Into<String>, category: impl Into<String>) {
    sentry::add_breadcrumb(sentry::Breadcrumb {
        message: Some(message.into()),
        category: Some(category.into()),
        level: sentry::Level::Info,
        ..Default::default()
    });
}

/// Capture error manually
pub fn capture_error(error: &dyn std::error::Error) {
    sentry::capture_error(error);
}

/// Capture message manually
pub fn capture_message(message: impl Into<String>, level: sentry::Level) {
    sentry::capture_message(&message.into(), level);
}
