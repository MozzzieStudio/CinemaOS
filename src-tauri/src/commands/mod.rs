//! Tauri Commands Module
//!
//! Exports all Tauri commands for use in lib.rs

pub mod ai;
pub mod comfyui;
pub mod files;
pub mod tokens;

// Re-export existing vault commands
use crate::vault::{
    self,
    models::{Character, Project, Script},
};
use surrealdb::engine::any::Any;
use surrealdb::Surreal;

// Helper to get the DB instance
async fn get_db() -> Result<Surreal<Any>, String> {
    vault::get_db()
        .await
        .ok_or_else(|| "Vault not initialized".to_string())
}

#[tauri::command]
pub async fn create_project(title: String, author: String) -> Result<Project, String> {
    let db = get_db().await?;

    let created: Option<Project> = db
        .create("project")
        .content(Project {
            id: None,
            title,
            author,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
        })
        .await
        .map_err(|e| e.to_string())?;

    created.ok_or_else(|| "Failed to create project".to_string())
}

#[tauri::command]
pub async fn get_projects() -> Result<Vec<Project>, String> {
    let db = get_db().await?;
    let projects: Vec<Project> = db.select("project").await.map_err(|e| e.to_string())?;
    Ok(projects)
}

#[tauri::command]
pub async fn save_script(script: Script) -> Result<Script, String> {
    let db = get_db().await?;

    let id = script.id.clone();

    let saved: Option<Script> = if let Some(id) = id {
        let mut result = db
            .query("UPDATE $id CONTENT $content")
            .bind(("id", id))
            .bind(("content", script))
            .await
            .map_err(|e| e.to_string())?;
        result.take(0).map_err(|e| e.to_string())?
    } else {
        db.create("script")
            .content(script)
            .await
            .map_err(|e| e.to_string())?
    };

    saved.ok_or_else(|| "Failed to save script".to_string())
}

#[tauri::command]
pub async fn load_script(project_id: String) -> Result<Option<Script>, String> {
    let db = get_db().await?;

    let mut result = db
        .query("SELECT * FROM script WHERE project_id = type::thing($pid)")
        .bind(("pid", project_id))
        .await
        .map_err(|e| e.to_string())?;

    let script: Option<Script> = result.take(0).map_err(|e| e.to_string())?;

    Ok(script)
}

#[tauri::command]
pub async fn get_characters(project_id: String) -> Result<Vec<Character>, String> {
    let db = get_db().await?;

    let mut result = db
        .query("SELECT * FROM character WHERE project_id = type::thing($pid)")
        .bind(("pid", project_id))
        .await
        .map_err(|e| e.to_string())?;

    let characters: Vec<Character> = result.take(0).map_err(|e| e.to_string())?;

    Ok(characters)
}

#[tauri::command]
pub async fn chat_with_agent(
    agent_name: String,
    message: String,
    _context: Option<String>,
) -> Result<String, String> {
    // TODO: Integrate with new AI router
    // For now, return a placeholder
    Ok(format!("Agent {} received: {}", agent_name, message))
}
