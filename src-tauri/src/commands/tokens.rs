//! Token Commands — CRUD and AI Extraction for Vault Tokens
//!
//! Commands:
//! - create_token, get_tokens, update_token, delete_token
//! - extract_tokens_from_script (AI-powered)
//! - get_token_context (for prompt enhancement)

use crate::vault::{
    self,
    tokens::{ExtractedTokens, Token, TokenContext, TokenType},
};
use surrealdb::engine::any::Any;
use surrealdb::Surreal;

// Helper to get DB
async fn get_db() -> Result<Surreal<Any>, String> {
    vault::get_db()
        .await
        .ok_or_else(|| "Vault not initialized".to_string())
}

/// Create a new token in the Vault
#[tauri::command]
pub async fn create_token(
    project_id: String,
    token_type: TokenType,
    name: String,
    description: String,
) -> Result<Token, String> {
    let db = get_db().await?;

    let token = Token::new(project_id, token_type, name, description);

    let created: Option<Token> = db
        .create("token")
        .content(token)
        .await
        .map_err(|e| e.to_string())?;

    created.ok_or_else(|| "Failed to create token".to_string())
}

/// Get all tokens for a project
#[tauri::command]
pub async fn get_tokens(project_id: String) -> Result<Vec<Token>, String> {
    let db = get_db().await?;

    let mut result = db
        .query("SELECT * FROM token WHERE project_id = $pid ORDER BY token_type, name")
        .bind(("pid", project_id))
        .await
        .map_err(|e| e.to_string())?;

    let tokens: Vec<Token> = result.take(0).map_err(|e| e.to_string())?;
    Ok(tokens)
}

/// Get tokens by type
#[tauri::command]
pub async fn get_tokens_by_type(
    project_id: String,
    token_type: TokenType,
) -> Result<Vec<Token>, String> {
    let db = get_db().await?;

    let type_str = format!("{:?}", token_type);

    let mut result = db
        .query("SELECT * FROM token WHERE project_id = $pid AND token_type = $ttype ORDER BY name")
        .bind(("pid", project_id))
        .bind(("ttype", type_str))
        .await
        .map_err(|e| e.to_string())?;

    let tokens: Vec<Token> = result.take(0).map_err(|e| e.to_string())?;
    Ok(tokens)
}

/// Update a token
#[tauri::command]
pub async fn update_token(token: Token) -> Result<Token, String> {
    let db = get_db().await?;

    let id = token.id.clone().ok_or("Token ID required for update")?;

    let mut updated_token = token;
    updated_token.updated_at = chrono::Utc::now().to_rfc3339();

    let mut result = db
        .query("UPDATE $id CONTENT $content RETURN AFTER")
        .bind(("id", id))
        .bind(("content", updated_token))
        .await
        .map_err(|e| e.to_string())?;

    let saved: Option<Token> = result.take(0).map_err(|e| e.to_string())?;
    saved.ok_or_else(|| "Failed to update token".to_string())
}

/// Delete a token
#[tauri::command]
pub async fn delete_token(token_id: String) -> Result<(), String> {
    let db = get_db().await?;

    db.query("DELETE $id")
        .bind(("id", token_id))
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Add a visual reference to a token
#[tauri::command]
pub async fn add_token_visual(token_id: String, visual_url: String) -> Result<Token, String> {
    let db = get_db().await?;

    let mut result = db
        .query("UPDATE $id SET visual_refs += $url, updated_at = $now RETURN AFTER")
        .bind(("id", token_id))
        .bind(("url", visual_url))
        .bind(("now", chrono::Utc::now().to_rfc3339()))
        .await
        .map_err(|e| e.to_string())?;

    let updated: Option<Token> = result.take(0).map_err(|e| e.to_string())?;
    updated.ok_or_else(|| "Failed to add visual reference".to_string())
}

/// Set LoRA ID for a token (for generation consistency)
#[tauri::command]
pub async fn set_token_lora(token_id: String, lora_id: String) -> Result<Token, String> {
    let db = get_db().await?;

    let mut result = db
        .query("UPDATE $id SET lora_id = $lora, updated_at = $now RETURN AFTER")
        .bind(("id", token_id))
        .bind(("lora", lora_id))
        .bind(("now", chrono::Utc::now().to_rfc3339()))
        .await
        .map_err(|e| e.to_string())?;

    let updated: Option<Token> = result.take(0).map_err(|e| e.to_string())?;
    updated.ok_or_else(|| "Failed to set LoRA ID".to_string())
}

/// Get token context for prompt enhancement in Studio
#[tauri::command]
pub async fn get_token_contexts(token_ids: Vec<String>) -> Result<Vec<TokenContext>, String> {
    let db = get_db().await?;

    let mut contexts = Vec::new();

    for id in token_ids {
        let mut result = db
            .query("SELECT * FROM $id")
            .bind(("id", id))
            .await
            .map_err(|e| e.to_string())?;

        if let Ok(Some(token)) = result.take::<Option<Token>>(0) {
            contexts.push(TokenContext::from(token));
        }
    }

    Ok(contexts)
}

/// Extract tokens from script using AI (placeholder - needs ComfyUI integration)
#[tauri::command]
pub async fn extract_tokens_from_script(
    _project_id: String,
    script_content: String,
) -> Result<ExtractedTokens, String> {
    // TODO: Integrate with AI (Fast Path → Gemini/Claude)
    // For now, return a basic regex-based extraction

    use crate::vault::tokens::ExtractedEntity;

    let mut characters = Vec::new();
    let mut locations = Vec::new();

    // Simple extraction: look for CHARACTER: patterns and INT./EXT. patterns
    for line in script_content.lines() {
        let trimmed = line.trim();

        // Character detection (ALL CAPS name followed by dialogue)
        if trimmed
            .chars()
            .all(|c| c.is_uppercase() || c.is_whitespace())
            && trimmed.len() > 2
            && trimmed.len() < 30
            && !trimmed.starts_with("INT")
            && !trimmed.starts_with("EXT")
        {
            let name = trimmed.to_string();
            if !characters.iter().any(|c: &ExtractedEntity| c.name == name) {
                characters.push(ExtractedEntity {
                    name: name.clone(),
                    description: format!("Character: {}", name),
                    mentions: 1,
                    first_appearance: "Script".into(),
                });
            }
        }

        // Location detection (INT. or EXT.)
        if trimmed.starts_with("INT.") || trimmed.starts_with("EXT.") {
            let location = trimmed
                .replace("INT.", "")
                .replace("EXT.", "")
                .split('-')
                .next()
                .unwrap_or("")
                .trim()
                .to_string();

            if !location.is_empty()
                && !locations
                    .iter()
                    .any(|l: &ExtractedEntity| l.name == location)
            {
                locations.push(ExtractedEntity {
                    name: location.clone(),
                    description: format!("Location: {}", location),
                    mentions: 1,
                    first_appearance: trimmed.to_string(),
                });
            }
        }
    }

    Ok(ExtractedTokens {
        characters,
        locations,
        props: Vec::new(), // TODO: AI extraction for props
    })
}

/// Save extracted tokens to Vault (user confirms first)
#[tauri::command]
pub async fn save_extracted_tokens(
    project_id: String,
    extracted: ExtractedTokens,
) -> Result<Vec<Token>, String> {
    let db = get_db().await?;
    let mut saved_tokens = Vec::new();

    // Save characters
    for entity in extracted.characters {
        let token = Token::new(
            project_id.clone(),
            TokenType::Character,
            entity.name,
            entity.description,
        );

        if let Ok(Some(created)) = db.create::<Option<Token>>("token").content(token).await {
            saved_tokens.push(created);
        }
    }

    // Save locations
    for entity in extracted.locations {
        let token = Token::new(
            project_id.clone(),
            TokenType::Location,
            entity.name,
            entity.description,
        );

        if let Ok(Some(created)) = db.create::<Option<Token>>("token").content(token).await {
            saved_tokens.push(created);
        }
    }

    // Save props
    for entity in extracted.props {
        let token = Token::new(
            project_id.clone(),
            TokenType::Prop,
            entity.name,
            entity.description,
        );

        if let Ok(Some(created)) = db.create::<Option<Token>>("token").content(token).await {
            saved_tokens.push(created);
        }
    }

    Ok(saved_tokens)
}
