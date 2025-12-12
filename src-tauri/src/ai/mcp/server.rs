//! MCP Server - Exposes CinemaOS capabilities to agents

use super::{MCPCapability, MCPMessage};
use serde_json::Value;
use std::collections::HashMap;

/// MCP Server
pub struct MCPServer {
    capabilities: Vec<MCPCapability>,
    tools: HashMap<String, Box<dyn MCPTool>>,
}

impl MCPServer {
    pub fn new() -> Self {
        let mut server = Self {
            capabilities: Vec::new(),
            tools: HashMap::new(),
        };

        // Register built-in tools
        server.register_tool(Box::new(GenerateImageTool));
        server.register_tool(Box::new(QueryVaultTool));
        server.register_tool(Box::new(CreateTokenTool));

        server
    }

    fn register_tool(&mut self, tool: Box<dyn MCPTool>) {
        let cap = tool.capability();
        self.capabilities.push(cap);
        self.tools.insert(tool.name().to_string(), tool);
    }

    pub fn capabilities(&self) -> &[MCPCapability] {
        &self.capabilities
    }

    /// Execute a tool
    pub async fn execute(&self, message: MCPMessage) -> Result<Value, String> {
        match message {
            MCPMessage::ToolCall { tool, params } => {
                if let Some(tool_impl) = self.tools.get(&tool) {
                    tool_impl.execute(params).await
                } else {
                    Err(format!("Tool not found: {}", tool))
                }
            }
            _ => Err("Invalid message type".to_string()),
        }
    }
}

impl Default for MCPServer {
    fn default() -> Self {
        Self::new()
    }
}

/// MCP Tool trait
#[async_trait::async_trait]
pub trait MCPTool: Send + Sync {
    fn name(&self) -> &str;
    fn capability(&self) -> MCPCapability;
    async fn execute(&self, params: Value) -> Result<Value, String>;
}

/// Generate Image Tool
struct GenerateImageTool;

#[async_trait::async_trait]
impl MCPTool for GenerateImageTool {
    fn name(&self) -> &str {
        "generate_image"
    }

    fn capability(&self) -> MCPCapability {
        MCPCapability {
            name: "generate_image".to_string(),
            description: "Generate image via ComfyUI".to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "prompt": {"type": "string"},
                    "width": {"type": "number", "default": 1024},
                    "height": {"type": "number", "default": 1024},
                    "seed": {"type": "number", "optional": true}
                },
                "required": ["prompt"]
            }),
        }
    }

    async fn execute(&self, params: Value) -> Result<Value, String> {
        // TODO: Call actual ComfyUI integration
        Ok(serde_json::json!({
            "status": "queued",
            "prompt_id": "placeholder_id"
        }))
    }
}

/// Query Vault Tool
struct QueryVaultTool;

#[async_trait::async_trait]
impl MCPTool for QueryVaultTool {
    fn name(&self) -> &str {
        "query_vault"
    }

    fn capability(&self) -> MCPCapability {
        MCPCapability {
            name: "query_vault".to_string(),
            description: "Query Vault for tokens (characters, locations, props)".to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "token_type": {"type": "string", "enum": ["character", "location", "prop"]},
                    "name": {"type": "string", "optional": true}
                },
                "required": ["token_type"]
            }),
        }
    }

    async fn execute(&self, params: Value) -> Result<Value, String> {
        // TODO: Call actual Vault (SurrealDB) query
        Ok(serde_json::json!({
            "tokens": []
        }))
    }
}

/// Create Token Tool
struct CreateTokenTool;

#[async_trait::async_trait]
impl MCPTool for CreateTokenTool {
    fn name(&self) -> &str {
        "create_token"
    }

    fn capability(&self) -> MCPCapability {
        MCPCapability {
            name: "create_token".to_string(),
            description: "Create a new token in the Vault".to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "token_type": {"type": "string"},
                    "name": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["token_type", "name", "description"]
            }),
        }
    }

    async fn execute(&self, params: Value) -> Result<Value, String> {
        // TODO: Call actual Vault create
        Ok(serde_json::json!({
            "id": "token_123",
            "created": true
        }))
    }
}
