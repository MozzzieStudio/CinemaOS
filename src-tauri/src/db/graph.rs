use crate::db::DB;
use serde::{Deserialize, Serialize};
use surrealdb::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct Token {
    pub id: Option<String>,
    pub name: String,
    pub flavor_text: String,
    pub token_type: String, // Character, Prop, Location
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Relationship {
    pub in_node: String,
    pub out_node: String,
    pub relation: String, // e.g. "APPEARS_IN"
}

/// Link two tokens together (Graph Edge)
/// e.g. Character -> APPEARS_IN -> Scene
pub async fn link_tokens(from_id: &str, relation: &str, to_id: &str) -> Result<(), Error> {
    // RELATE statements are idempotent in SurrealDB 2.x
    let sql = format!("RELATE {}->{}->{};", from_id, relation, to_id);

    DB.query(sql).await?;
    Ok(())
}

/// Get all tokens related to a specific token
/// e.g. Get all Characters in Scene 1
pub async fn get_related(from_id: &str, relation: &str) -> Result<Vec<Token>, Error> {
    // Graph traversal syntax: select ->relation->target from source
    let sql = format!("SELECT * FROM {}->{}->? AS target;", from_id, relation);

    let mut response = DB.query(sql).await?;
    let tokens: Vec<Token> = response.take(0)?;
    Ok(tokens)
}

/// Create a new Token (Node)
pub async fn create_token(table: &str, data: Token) -> Result<Token, Error> {
    let created: Option<Token> = DB.create(table).content(data).await?;
    Ok(created.unwrap())
}
