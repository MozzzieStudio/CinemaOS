//! Token System — Single Source of Truth for Vault
//!
//! Tokens represent entities in the script that maintain consistency:
//! - @Character (Anna, Detective)
//! - /Location (BarDeLaCiutat, Beach)
//! - #Prop (Revolver, Letter)
//! - //Scene (Escena1, Opening)
//!
//! Each Token has:
//! - Visual references (AI-generated images)
//! - LoRA ID for generation consistency
//! - Metadata for prompt enhancement

use serde::{Deserialize, Serialize};
use specta::Type;
use surrealdb::sql::Thing;

/// Token type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Type)]
pub enum TokenType {
    Character, // @prefix
    Location,  // /prefix
    Prop,      // #prefix
    Scene,     // //prefix
}

impl TokenType {
    pub fn prefix(&self) -> &'static str {
        match self {
            TokenType::Character => "@",
            TokenType::Location => "/",
            TokenType::Prop => "#",
            TokenType::Scene => "//",
        }
    }

    pub fn from_prefix(s: &str) -> Option<Self> {
        match s {
            "@" => Some(TokenType::Character),
            "/" => Some(TokenType::Location),
            "#" => Some(TokenType::Prop),
            "//" => Some(TokenType::Scene),
            _ => None,
        }
    }
}

/// Core Token structure stored in Vault
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Token {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub project_id: String,
    pub token_type: TokenType,
    pub name: String,
    pub slug: String, // @anna, /bar-de-la-ciutat
    pub description: String,
    #[serde(default)]
    pub visual_refs: Vec<String>, // Image URLs/paths
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lora_id: Option<String>, // For generation consistency
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voice_id: Option<String>, // ElevenLabs voice (characters)
    #[serde(default)]
    pub metadata: std::collections::HashMap<String, String>,
    pub created_at: String,
    pub updated_at: String,
}

impl Token {
    /// Create a new token
    pub fn new(
        project_id: String,
        token_type: TokenType,
        name: String,
        description: String,
    ) -> Self {
        let slug = format!(
            "{}{}",
            token_type.prefix(),
            name.to_lowercase().replace(' ', "-")
        );
        let now = chrono::Utc::now().to_rfc3339();

        Self {
            id: None,
            project_id,
            token_type,
            name,
            slug,
            description,
            visual_refs: Vec::new(),
            lora_id: None,
            voice_id: None,
            metadata: std::collections::HashMap::new(),
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Get display name with prefix (e.g., "@Anna")
    pub fn display_name(&self) -> String {
        format!("{}{}", self.token_type.prefix(), self.name)
    }
}

/// Character-specific metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CharacterDetails {
    pub age: Option<String>,
    pub gender: Option<String>,
    pub appearance: Option<String>,
    pub personality: Option<String>,
    pub backstory: Option<String>,
    pub relationships: Vec<String>, // Other character IDs
}

/// Location-specific metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LocationDetails {
    pub setting: Option<String>, // Interior/Exterior
    pub time_of_day: Option<String>,
    pub mood: Option<String>,
    pub lighting: Option<String>,
    pub props: Vec<String>, // Prop token IDs in this location
}

/// Result of AI extracting tokens from script
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ExtractedTokens {
    pub characters: Vec<ExtractedEntity>,
    pub locations: Vec<ExtractedEntity>,
    pub props: Vec<ExtractedEntity>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ExtractedEntity {
    pub name: String,
    pub description: String,
    pub mentions: u32,            // How many times mentioned
    pub first_appearance: String, // Scene/line reference
}

/// For prompt enhancement in Studio
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TokenContext {
    pub token_id: String,
    pub display_name: String,
    pub description: String,
    pub visual_prompt: Option<String>, // Derived from visual refs
    pub lora_trigger: Option<String>,  // LoRA activation keyword
}

impl From<Token> for TokenContext {
    fn from(token: Token) -> Self {
        let token_id = token.id.clone().unwrap_or_default();
        let display_name = token.display_name();
        let description = token.description.clone();
        let visual_prompt = token.metadata.get("visual_prompt").cloned();
        let lora_trigger = token.lora_id.as_ref().map(|id| format!("<lora:{}>", id));

        Self {
            token_id,
            display_name,
            description,
            visual_prompt,
            lora_trigger,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_creation() {
        let token = Token::new(
            "project:123".into(),
            TokenType::Character,
            "Anna".into(),
            "A tired detective in her 30s".into(),
        );

        assert_eq!(token.slug, "@anna");
        assert_eq!(token.display_name(), "@Anna");
        assert_eq!(token.token_type, TokenType::Character);
    }

    #[test]
    fn test_token_type_prefix() {
        assert_eq!(TokenType::Character.prefix(), "@");
        assert_eq!(TokenType::Location.prefix(), "/");
        assert_eq!(TokenType::Prop.prefix(), "#");
        assert_eq!(TokenType::Scene.prefix(), "//");
    }

    #[test]
    fn test_token_context() {
        let mut token = Token::new(
            "project:123".into(),
            TokenType::Location,
            "Bar De La Ciutat".into(),
            "A dimly lit bar with neon signs".into(),
        );
        token.id = Some("token:456".into());
        token.lora_id = Some("bar_lora_v1".into());

        let context: TokenContext = token.into();
        assert_eq!(context.display_name, "/Bar De La Ciutat");
        assert_eq!(context.lora_trigger, Some("<lora:bar_lora_v1>".into()));
    }
}
