use std::path::PathBuf;

/// Get path to a resource file/directory
///
/// In development, resolves relative to the crate root.
/// In production, resolves relative to the resource directory.
pub fn get_resource_path(name: &str) -> Option<PathBuf> {
    // Check dev environment first
    let dev_path = PathBuf::from(name);
    if dev_path.exists() {
        return Some(dev_path);
    }

    // Check Tauri resource path (stub for now, usually handled by tauri::api::path)
    // In a real tauri app we'd need the AppHandle, but for this utility
    // we might just check common locations.
    #[cfg(debug_assertions)]
    {
        // Try looking in src-tauri root
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let path = root.join(name);
        if path.exists() {
            return Some(path);
        }
    }

    None
}
