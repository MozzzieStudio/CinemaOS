pub mod models;
pub mod tokens;

use once_cell::sync::Lazy;
use std::sync::Arc;
use surrealdb::engine::any::Any;
use surrealdb::Surreal;
use tokio::sync::Mutex;

// Global database instance using Any engine
pub static DB: Lazy<Arc<Mutex<Option<Surreal<Any>>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

pub async fn init() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the Surreal client
    let db: Surreal<Any> = Surreal::init();

    // Connect using the rocksdb scheme
    // Ensure the path is absolute or relative to the executable
    let db_path = "rocksdb://cinema_os.db";
    db.connect(db_path).await?;

    // Select a namespace and database
    db.use_ns("cinema_os").use_db("production").await?;

    let mut global_db = DB.lock().await;
    *global_db = Some(db);

    println!("✅ Vault Initialized: SurrealDB connected at {}", db_path);

    Ok(())
}

pub async fn get_db() -> Option<Surreal<Any>> {
    let global_db = DB.lock().await;
    global_db.clone()
}
