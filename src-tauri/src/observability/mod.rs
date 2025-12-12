//! Observability Module
//!
//! Error tracking, metrics, and monitoring

pub mod sentry;

pub use sentry::{
    add_breadcrumb, capture_error, capture_message, clear_user, init_sentry, set_user,
};
