//! Model Context Protocol (MCP) integration
//!
//! Standardized protocol for agent-to-tool communication

pub mod client;
pub mod server;

use serde::{Deserialize, Serialize};

/// MCP message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MCPMessage {
    /// Tool invocation request
    ToolCall {
        tool: String,
        params: serde_json::Value,
    },
    /// Tool response
    ToolResponse {
        result: serde_json::Value,
        error: Option<String>,
    },
    /// Context update
    ContextUpdate {
        tokens: Vec<String>,
        metadata: serde_json::Value,
    },
}

/// MCP capability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPCapability {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}
