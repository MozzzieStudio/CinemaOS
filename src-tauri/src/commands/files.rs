//! File I/O Commands
//!
//! Native file dialog operations for Open/Save/Export

use std::fs;
use tauri::AppHandle;

/// Open a file using native dialog
#[tauri::command]
#[specta::specta]
pub async fn open_file_dialog(app: AppHandle) -> Result<Option<(String, String)>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("Script Files", &["fdx", "txt", "fountain"])
        .add_filter("All Files", &["*"])
        .blocking_pick_file();

    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            let content =
                fs::read_to_string(&path_str).map_err(|e| format!("Failed to read file: {}", e))?;
            Ok(Some((path_str, content)))
        }
        None => Ok(None), // User cancelled
    }
}

/// Save content to a file using native dialog
#[tauri::command]
#[specta::specta]
pub async fn save_file_dialog(
    app: AppHandle,
    content: String,
    default_name: Option<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut dialog = app
        .dialog()
        .file()
        .add_filter("Final Draft", &["fdx"])
        .add_filter("Fountain", &["fountain"])
        .add_filter("Plain Text", &["txt"]);

    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }

    let file_path = dialog.blocking_save_file();

    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            fs::write(&path_str, &content).map_err(|e| format!("Failed to write file: {}", e))?;
            Ok(Some(path_str))
        }
        None => Ok(None), // User cancelled
    }
}

/// Save content to a specific path (for Ctrl+S when path is known)
#[tauri::command]
#[specta::specta]
pub async fn save_file_to_path(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file: {}", e))
}

/// Export PDF using native save dialog
#[tauri::command]
#[specta::specta]
pub async fn export_pdf_dialog(
    app: AppHandle,
    pdf_bytes: Vec<u8>,
    default_name: Option<String>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut dialog = app.dialog().file().add_filter("PDF Document", &["pdf"]);

    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }

    let file_path = dialog.blocking_save_file();

    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            fs::write(&path_str, &pdf_bytes).map_err(|e| format!("Failed to write PDF: {}", e))?;
            Ok(Some(path_str))
        }
        None => Ok(None),
    }
}
