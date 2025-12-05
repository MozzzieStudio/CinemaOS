use loro::LoroDoc;
use once_cell::sync::Lazy;
use std::sync::Arc;
use tokio::sync::Mutex;

// Global Sync Engine instance
pub static SYNC_ENGINE: Lazy<Arc<Mutex<Option<SyncEngine>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

pub struct SyncEngine {
    pub doc: LoroDoc,
}

impl SyncEngine {
    pub fn new() -> Self {
        Self {
            doc: LoroDoc::new(),
        }
    }
}

pub async fn init() -> Result<(), Box<dyn std::error::Error>> {
    let engine = SyncEngine::new();

    let mut global_engine = SYNC_ENGINE.lock().await;
    *global_engine = Some(engine);

    println!("✅ Sync Engine Initialized: Loro CRDT ready");

    Ok(())
}

pub async fn get_engine() -> Option<Arc<Mutex<SyncEngine>>> {
    // This is a bit tricky with the double mutex, simplifying for now
    // Ideally we'd return a clone of the engine if it was Arc'd itself
    // For now, let's just expose the global
    None
}
