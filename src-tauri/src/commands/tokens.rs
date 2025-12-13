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
#[specta::specta]
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
#[specta::specta]
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
#[specta::specta]
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
#[specta::specta]
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
#[specta::specta]
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
#[specta::specta]
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
#[specta::specta]
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
#[specta::specta]
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
#[specta::specta]
pub async fn extract_tokens_from_script(
    _project_id: String,
    script_content: String,
) -> Result<ExtractedTokens, String> {
    // Improved extraction: NER-style regex-based
    // Fast path using regex patterns (future: integrate Gemini/Claude for deep analysis)

    use crate::vault::tokens::ExtractedEntity;
    use std::collections::HashMap;

    let mut characters: HashMap<String, ExtractedEntity> = HashMap::new();
    let mut locations: HashMap<String, ExtractedEntity> = HashMap::new();
    let mut props: HashMap<String, ExtractedEntity> = HashMap::new();

    let lines: Vec<&str> = script_content.lines().collect();

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Character detection (ALL CAPS name, 2-30 chars, followed by dialogue or parenthetical)
        if trimmed
            .chars()
            .all(|c| c.is_uppercase() || c.is_whitespace() || c == '.')
            && trimmed.len() > 1
            && trimmed.len() < 35
            && !trimmed.starts_with("INT")
            && !trimmed.starts_with("EXT")
            && !trimmed.starts_with("FADE")
            && !trimmed.ends_with(':')
        {
            let name = trimmed.replace('.', "").trim().to_string();
            if !name.is_empty() && name.split_whitespace().count() <= 3 {
                characters
                    .entry(name.clone())
                    .and_modify(|e| e.mentions += 1)
                    .or_insert(ExtractedEntity {
                        name: name.clone(),
                        description: "Character appearing in the script".to_string(),
                        mentions: 1,
                        first_appearance: format!("Line {}", i + 1),
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
                .split('.')
                .next()
                .unwrap_or("")
                .trim()
                .to_string();

            if !location.is_empty() {
                locations
                    .entry(location.clone())
                    .and_modify(|e| e.mentions += 1)
                    .or_insert(ExtractedEntity {
                        name: location.clone(),
                        description: "Location in the script".to_string(),
                        mentions: 1,
                        first_appearance: trimmed.to_string(),
                    });
            }
        }

        // Prop detection (simple heuristic: objects in action lines)
        // Look for common prop keywords in action lines
        if !trimmed.is_empty()
            && !trimmed
                .chars()
                .all(|c| c.is_uppercase() || c.is_whitespace())
            && !trimmed.starts_with("INT")
            && !trimmed.starts_with("EXT")
            && !trimmed.starts_with('(')
        {
            // Common prop indicators
            let prop_keywords = [
                "gun",
                "weapon",
                "phone",
                "car",
                "door",
                "key",
                "letter",
                "photo",
                "photograph",
                "ring",
                "watch",
                "briefcase",
                "suitcase",
                "laptop",
                "computer",
                "bottle",
                "glass",
                "knife",
                "sword",
                "camera",
                "book",
            ];

            for keyword in &prop_keywords {
                if trimmed.to_lowercase().contains(keyword) {
                    let prop_name = keyword.to_uppercase();
                    props
                        .entry(prop_name.clone())
                        .and_modify(|e| e.mentions += 1)
                        .or_insert(ExtractedEntity {
                            name: prop_name.clone(),
                            description: "Prop mentioned in action".to_string(),
                            mentions: 1,
                            first_appearance: format!("Line {}", i + 1),
                        });
                }
            }
        }
    }

    Ok(ExtractedTokens {
        characters: characters.into_values().collect(),
        locations: locations.into_values().collect(),
        props: props.into_values().collect(),
    })
}

/// Save extracted tokens to Vault (user confirms first)
#[tauri::command]
#[specta::specta]
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
