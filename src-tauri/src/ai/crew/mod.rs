//! AI Crew - The Virtual Crew of 11 Specialized Agents
//!
//! Each agent is a specialist in their domain.

pub mod art_director;
pub mod camera;
pub mod casting_director;
pub mod cinematographer;
pub mod colorist;
pub mod editor;
pub mod main_agent;
pub mod music_sfx;
pub mod photography;
pub mod scriptwriter;
pub mod showrunner;
pub mod voice_actors;

// Re-export agents
pub use art_director::ArtDirector;
pub use camera::CameraDirector;
pub use casting_director::CastingDirector;
pub use cinematographer::Cinematographer;
pub use colorist::Colorist;
pub use editor::Editor;
pub use main_agent::MainAgent;
pub use music_sfx::MusicSFXDirector;
pub use photography::PhotographyDirector;
pub use scriptwriter::Scriptwriter;
pub use showrunner::Showrunner;
pub use voice_actors::VoiceActors;
