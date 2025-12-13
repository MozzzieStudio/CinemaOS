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

impl Default for SyncEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl SyncEngine {
    pub fn new() -> Self {
        Self {
            doc: LoroDoc::new(),
        }
    }

    pub fn save_to_disk(&self, path: &str) -> std::io::Result<()> {
        let bytes = self.doc.export(loro::ExportMode::Snapshot).unwrap();
        std::fs::write(path, bytes)
    }

    pub fn load_from_disk(&mut self, path: &str) -> std::io::Result<()> {
        if let Ok(bytes) = std::fs::read(path) {
            self.doc
                .import(&bytes)
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        }
        Ok(())
    }

    pub async fn sync_with_cloud(&self) {
        // Placeholder for SurrealDB sync
        println!("Syncing with cloud...");
    }
}

pub async fn init() -> Result<(), Box<dyn std::error::Error>> {
    let engine = SyncEngine::new();

    let mut global_engine = SYNC_ENGINE.lock().await;
    *global_engine = Some(engine);

    println!("✅ Sync Engine Initialized: Loro CRDT ready");

    Ok(())
}
