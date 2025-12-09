pub mod ai;
pub mod commands;
pub mod errors;
pub mod graphics;
pub mod installer;
pub mod pagination;
pub mod sync;
pub mod vault;

use crate::pagination::{PaginationResult, ScriptElement};

#[tauri::command]
fn calculate_pagination(elements: Vec<ScriptElement>) -> PaginationResult {
    pagination::paginate_script(elements)
}

#[cfg(test)]
mod tests;

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
            commands::load_script,
            commands::get_characters,
            commands::chat_with_agent,
            calculate_pagination,
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
            commands::files::export_pdf_dialog,
            // ComfyUI commands
            commands::comfyui::comfyui_ping,
            commands::comfyui::comfyui_status,
            commands::comfyui::comfyui_get_models,
            commands::comfyui::comfyui_execute,
            commands::comfyui::comfyui_get_history,
            commands::comfyui::comfyui_get_image,
            // Installer commands
            commands::installer::get_install_state,
            commands::installer::is_system_ready,
            commands::installer::run_installation,
            commands::installer::start_comfyui,
            commands::installer::stop_comfyui,
            commands::installer::is_comfyui_running,
            // Hardware detection
            commands::installer::get_hardware_info,
            commands::installer::get_all_model_recommendations,
            commands::installer::get_recommended_models_for_hardware,
            commands::installer::get_runnable_models_for_hardware,
            // Model downloads
            commands::installer::get_available_model_sources,
            commands::installer::check_model_downloaded,
            commands::installer::get_downloaded_model_ids,
            commands::installer::download_model_by_id,
            commands::installer::check_ollama_installed,
            commands::installer::get_ollama_model_list,
            commands::installer::pull_ollama_model,
            // Workflow generation
            commands::workflow::generate_comfyui_workflow,
            commands::workflow::generate_workflow_from_agent,
            // Agent chat (full context + actions)
            commands::agents::agent_chat_full,
            commands::agents::execute_agent_action,
            commands::agents::execute_agent_actions,
            commands::agents::route_message_to_agent,
            commands::agents::get_agent_roles
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
