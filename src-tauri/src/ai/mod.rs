//! AI Module - Virtual Crew, ComfyUI Orchestration, Model Matrix, and Inference
//!
//! Architecture:
//! - Agents: Virtual Crew (11 specialized AI agents) provide high-level assistance
//! - LLM Client: API calls to Gemini, OpenAI, Anthropic, Ollama
//! - Agent Executor: Connects agents to LLM and workflow generation
//! - ComfyUI is the CENTRAL orchestration layer for all generation tasks
//! - Custom nodes wrap providers (Fal, Vertex, Local)
//!
//! Modules:
//! - agents: Virtual Crew (Showrunner, Scriptwriter, Camera Director, etc.)
//! - llm_client: API calls to LLM providers
//! - agent_executor: Full agent execution loop
//! - comfyui: Workflow engine and execution path routing
//! - comfyui_client: WebSocket client for ComfyUI communication
//! - workflow_generator: Creates ComfyUI workflows from agent requests
//! - models: Model definitions and capabilities
//! - providers: Cloud provider routing (Fal, Vertex, OpenAI, etc.)
//! - local: Local inference stack (Llama Stack, AI Edge, Whisper, SAM)
//! - router: High-level routing logic

pub mod actions;
pub mod agent_executor;
pub mod agents;
pub mod comfyui;
pub mod comfyui_client;
pub mod context;
pub mod llm_client;
pub mod local;
pub mod models;
pub mod providers;
pub mod router;
pub mod workflow_generator;

pub use agent_executor::*;
pub use agents::*;
pub use comfyui::*;
pub use comfyui_client::*;
pub use llm_client::*;
pub use local::*;
pub use models::*;
pub use providers::*;
pub use workflow_generator::*;
