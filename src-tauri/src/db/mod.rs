pub mod graph;
// pub mod vector; // Future: Vector Search
// pub mod realtime; // Future: Live Queries

use once_cell::sync::Lazy;
use std::sync::Arc;
use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tokio::sync::Mutex;

// Global DB Instance (Lazy Static)
pub static DB: Lazy<Surreal<Db>> = Lazy::new(Surreal::init);
