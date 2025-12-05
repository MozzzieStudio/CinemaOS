//! AI Module - ComfyUI Orchestration, Model Matrix, and Inference
//!
//! Architecture:
//! - ComfyUI is the CENTRAL orchestration layer for all generation tasks
//! - Custom nodes wrap providers (Fal, Vertex, Local)
//! - Fast Path bypasses ComfyUI for low-latency LLM chat
//!
//! Modules:
//! - comfyui: Workflow engine and execution path routing
//! - models: Model definitions and capabilities
//! - providers: Cloud provider routing (Fal, Vertex, OpenAI, etc.)
//! - local: Local inference stack (Llama Stack, AI Edge, Whisper, SAM)
//! - router: High-level routing logic

pub mod comfyui;
pub mod local;
pub mod models;
pub mod providers;
pub mod router;

pub use comfyui::*;
pub use local::*;
pub use models::*;
pub use providers::*;
