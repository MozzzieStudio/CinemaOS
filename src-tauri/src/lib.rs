pub mod ai;
pub mod commands;
pub mod graphics;
pub mod sync;
pub mod vault;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            // Initialize the Vault (SurrealDB) in the background
            tauri::async_runtime::spawn(async {
                if let Err(e) = vault::init().await {
                    eprintln!("❌ Failed to initialize Vault: {}", e);
                }
            });

            // Initialize the Sync Engine (Loro) in the background
            tauri::async_runtime::spawn(async {
                if let Err(e) = sync::init().await {
                    eprintln!("❌ Failed to initialize Sync Engine: {}", e);
                }
            });

            // Initialize Graphics Engine (Bevy)
            graphics::init();

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::create_project,
            commands::get_projects,
            commands::save_script,
            commands::load_script,
            commands::get_characters,
            commands::chat_with_agent,
            // AI Model Matrix commands
            commands::ai::get_models,
            commands::ai::get_models_for_task,
            commands::ai::get_free_models,
            commands::ai::get_hardware_capabilities,
            commands::ai::route_request,
            commands::ai::get_available_local_models,
            // Token/Vault commands
            commands::tokens::create_token,
            commands::tokens::get_tokens,
            commands::tokens::get_tokens_by_type,
            commands::tokens::update_token,
            commands::tokens::delete_token,
            commands::tokens::add_token_visual,
            commands::tokens::set_token_lora,
            commands::tokens::get_token_contexts,
            commands::tokens::extract_tokens_from_script,
            commands::tokens::save_extracted_tokens,
            // File I/O commands
            commands::files::open_file_dialog,
            commands::files::save_file_dialog,
            commands::files::save_file_to_path,
            commands::files::export_pdf_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
