//! AI Module - Virtual Crew, ComfyUI Orchestration, Model Matrix, and Inference
//!
//! Architecture:
//! - Agents: Virtual Crew (11 specialized AI agents) provide high-level assistance
//! - ComfyUI is the CENTRAL orchestration layer for all generation tasks
//! - Custom nodes wrap providers (Fal, Vertex, Local)
//! - Fast Path bypasses ComfyUI for low-latency LLM chat
//!
//! Modules:
//! - agents: Virtual Crew (Showrunner, Scriptwriter, Camera Director, etc.)
//! - comfyui: Workflow engine and execution path routing
//! - comfyui_client: WebSocket client for ComfyUI communication
//! - models: Model definitions and capabilities
//! - providers: Cloud provider routing (Fal, Vertex, OpenAI, etc.)
//! - local: Local inference stack (Llama Stack, AI Edge, Whisper, SAM)
//! - router: High-level routing logic

pub mod agents;
pub mod comfyui;
pub mod comfyui_client;
pub mod local;
pub mod models;
pub mod providers;
pub mod router;

pub use agents::*;
pub use comfyui::*;
pub use comfyui_client::*;
pub use local::*;
pub use models::*;
pub use providers::*;
