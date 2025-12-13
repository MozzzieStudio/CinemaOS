use super::protocol::*;
use serde_json::Value;
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::{mpsc, oneshot, Mutex};
use tokio_tungstenite::tungstenite::error::Error as WsError;

pub struct McpClient {
    command: String,
    args: Vec<String>,
    pending_requests: Arc<Mutex<HashMap<u64, oneshot::Sender<JsonRpcResponse>>>>,
    request_tx: Option<mpsc::Sender<JsonRpcRequest>>,
    next_id: Arc<Mutex<u64>>,
}

impl McpClient {
    pub fn new(command: &str, args: &[&str]) -> Self {
        Self {
            command: command.to_string(),
            args: args.iter().map(|s| s.to_string()).collect(),
            pending_requests: Arc::new(Mutex::new(HashMap::new())),
            request_tx: None,
            next_id: Arc::new(Mutex::new(1)),
        }
    }

    pub async fn start(&mut self) -> Result<(), String> {
        let mut child = Command::new(&self.command)
            .args(&self.args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| format!("Failed to spawn MCP server: {}", e))?;

        let stdin = child
            .stdin
            .take()
            .ok_or("Failed to open stdin for MCP server".to_string())?;
        let stdout = child
            .stdout
            .take()
            .ok_or("Failed to open stdout for MCP server".to_string())?;

        let (tx, mut rx) = mpsc::channel::<JsonRpcRequest>(32);
        self.request_tx = Some(tx);

        let pending_requests = self.pending_requests.clone();

        // Writer Task
        tokio::spawn(async move {
            let mut writer = stdin;
            while let Some(req) = rx.recv().await {
                if let Ok(json) = serde_json::to_string(&req) {
                    let _ = writer.write_all(json.as_bytes()).await;
                    let _ = writer.write_all(b"\n").await;
                    let _ = writer.flush().await;
                }
            }
        });

        // Reader Task
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                if line.trim().is_empty() {
                    continue;
                }

                // Try to parse as Response
                if let Ok(response) = serde_json::from_str::<JsonRpcResponse>(&line) {
                    if let Some(id) = response.id {
                        let mut map = pending_requests.lock().await;
                        if let Some(sender) = map.remove(&id) {
                            let _ = sender.send(response);
                        }
                    }
                } else {
                    // Try to parse as Notification or Request (if server calls client)
                    // For now, just log or ignore
                    eprintln!("MCP Reader received non-response: {}", line);
                }
            }
        });

        Ok(())
    }

    async fn send_request(
        &self,
        method: &str,
        params: Option<Value>,
    ) -> Result<JsonRpcResponse, String> {
        let tx = self
            .request_tx
            .as_ref()
            .ok_or("Client not started".to_string())?;

        let id = {
            let mut lock = self.next_id.lock().await;
            let id = *lock;
            *lock += 1;
            id
        };

        let request = JsonRpcRequest::new(method, params, id);
        let (resp_tx, resp_rx) = oneshot::channel();

        {
            let mut map = self.pending_requests.lock().await;
            map.insert(id, resp_tx);
        }

        tx.send(request)
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        // Timeout logic could be added here
        resp_rx
            .await
            .map_err(|e| format!("Failed to receive response: {}", e))
    }

    pub async fn list_tools(&self) -> Result<Vec<McpTool>, String> {
        let response = self.send_request("tools/list", None).await?;

        if let Some(err) = response.error {
            return Err(format!("MCP Error {}: {}", err.code, err.message));
        }

        if let Some(result) = response.result {
            let list: McpListToolsResult = serde_json::from_value(result)
                .map_err(|e| format!("Failed to parse tools/list result: {}", e))?;
            Ok(list.tools)
        } else {
            Err("No result in tools/list response".to_string())
        }
    }

    pub async fn call_tool(
        &self,
        tool_name: &str,
        arguments: Value,
    ) -> Result<McpCallToolResult, String> {
        let params = serde_json::json!({
            "name": tool_name,
            "arguments": arguments
        });

        let response = self.send_request("tools/call", Some(params)).await?;

        if let Some(err) = response.error {
            return Err(format!("MCP Error {}: {}", err.code, err.message));
        }

        if let Some(result) = response.result {
            let call_result: McpCallToolResult = serde_json::from_value(result)
                .map_err(|e| format!("Failed to parse tools/call result: {}", e))?;
            Ok(call_result)
        } else {
            Err("No result in tools/call response".to_string())
        }
    }
}
