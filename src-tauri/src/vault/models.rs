use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: Option<Thing>,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub author: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Script {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub title: String,
    pub content: String, // Lexical JSON string
    pub version: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Scene {
    pub id: Option<Thing>,
    pub script_id: Thing,
    pub number: u32,
    pub slugline: String,
    pub description: String,
    pub tokens: Vec<String>, // List of Token IDs (e.g., character:anna)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Character {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub description: String,
    pub image_url: Option<String>,
    pub lora_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Location {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    pub description: String,
    pub image_url: Option<String>,
    pub lora_path: Option<String>,
}
