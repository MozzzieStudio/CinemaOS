//! Settings Commands
//!
//! Handles secure storage of API keys and application settings.

use keyring::Entry;

#[tauri::command]
#[specta::specta]
pub fn save_api_key(service: String, key: String) -> Result<(), String> {
    let entry = Entry::new("cinemaos", &service).map_err(|e| e.to_string())?;
    entry.set_password(&key).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn get_api_key_status(service: String) -> bool {
    let entry = match Entry::new("cinemaos", &service) {
        Ok(e) => e,
        Err(_) => return false,
    };

    match entry.get_password() {
        Ok(pwd) => !pwd.is_empty(),
        Err(_) => false,
    }
}

#[tauri::command]
#[specta::specta]
pub fn delete_api_key(service: String) -> Result<(), String> {
    let entry = Entry::new("cinemaos", &service).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())?;
    Ok(())
}
