//! AI Agents Module
//!
//! The Virtual Crew for CinemaOS - 11 specialized AI agents that work together
//! to assist filmmakers in production.
//!
//! Architecture:
//! - Each agent has a specific role and system prompt
//! - The Main Agent (Showrunner) orchestrates the crew
//! - Agents access the Vault for context (characters, locations, style)
//! - Generation flows through ComfyUI workflows or Fast Path (LLM chat)

pub mod traits;
pub mod crew;
pub mod prompts;

pub use traits::*;
pub use crew::*;
