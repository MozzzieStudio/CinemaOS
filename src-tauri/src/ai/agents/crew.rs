//! Virtual Crew - Concrete Agent Implementations
//!
//! The 11 specialized agents that form the AI production crew.
//! Each agent implements the Agent trait with role-specific logic.

use crate::ai::agents::{
    prompts::get_system_prompt,
    traits::{Agent, AgentInput, AgentOutput, AgentRole},
};
use std::collections::HashMap;

// ═══════════════════════════════════════════════════════════════════════════════
// GENERIC CREW MEMBER (Base Implementation)
// ═══════════════════════════════════════════════════════════════════════════════

/// A generic crew member that can be instantiated for any role.
/// Uses the prompts and default models defined in the prompts module.
pub struct CrewMember {
    role: AgentRole,
    default_model: String,
}

impl CrewMember {
    /// Create a new crew member with the specified role
    pub fn new(role: AgentRole) -> Self {
        let default_model = Self::get_default_model_for_role(role);
        Self {
            role,
            default_model,
        }
    }

    /// Get the default model for each agent role
    fn get_default_model_for_role(role: AgentRole) -> String {
        match role {
            // Text/reasoning agents use Gemini or Claude
            AgentRole::Showrunner => "gemini-3-pro".into(),
            AgentRole::Scriptwriter => "claude-sonnet-4.5".into(),
            AgentRole::Cinematographer => "gemini-2.5-flash".into(),
            AgentRole::CastingDirector => "gemini-2.5-flash".into(),
            AgentRole::ArtDirector => "gemini-2.5-flash".into(),
            AgentRole::Editor => "gemini-2.5-flash".into(),

            // Generation agents use specialized models
            AgentRole::PhotographyDirector => "flux.2".into(),
            AgentRole::CameraDirector => "veo-3.1".into(),
            AgentRole::VoiceActors => "elevenlabs-v3".into(),
            AgentRole::MusicSfxDirector => "lyria-2".into(),
            AgentRole::Colorist => "gemini-2.5-flash".into(),
        }
    }

    /// Get alternative models for this role
    pub fn get_alternative_models(&self) -> Vec<&str> {
        match self.role {
            AgentRole::PhotographyDirector => {
                vec!["flux.2", "imagen-4", "kling-image-o1", "nano-banana-pro"]
            }
            AgentRole::CameraDirector => {
                vec!["veo-3.1", "sora-2-pro", "kling-v2.5-turbo", "wan-2.5"]
            }
            AgentRole::VoiceActors => {
                vec!["elevenlabs-v3", "seed-realtime-voice"]
            }
            AgentRole::MusicSfxDirector => {
                vec!["lyria-2", "suno-v4", "audiocraft", "seed-music"]
            }
            _ => vec![&self.default_model],
        }
    }
}

impl Agent for CrewMember {
    fn role(&self) -> AgentRole {
        self.role
    }

    fn system_prompt(&self) -> &str {
        get_system_prompt(self.role)
    }

    fn default_model(&self) -> &str {
        &self.default_model
    }

    async fn process(&self, input: AgentInput) -> AgentOutput {
        // NOTE: Real LLM integration happens via Backend Cloud (Phase 5)
        // This placeholder allows frontend testing without backend dependency

        let response_message = format!(
            "[{}] I received your request: \"{}\". \
            (Real LLM call will happen via Backend Cloud API)",
            self.role.display_name(),
            input.message
        );

        AgentOutput {
            message: response_message,
            actions: vec![],
            suggestions: vec![
                "Tell me more about what you need".into(),
                "Would you like me to generate something?".into(),
            ],
            estimated_cost: None,
        }
    }

    fn recommended_models(&self) -> Vec<&str> {
        self.get_alternative_models()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREW REGISTRY - Manages all agents
// ═══════════════════════════════════════════════════════════════════════════════

/// The Virtual Crew - registry of all agents
pub struct VirtualCrew {
    agents: HashMap<AgentRole, CrewMember>,
}

impl VirtualCrew {
    /// Create a new Virtual Crew with all 11 agents
    pub fn new() -> Self {
        let mut agents = HashMap::new();

        for role in AgentRole::all() {
            agents.insert(*role, CrewMember::new(*role));
        }

        Self { agents }
    }

    /// Get an agent by role
    pub fn get(&self, role: AgentRole) -> Option<&CrewMember> {
        self.agents.get(&role)
    }

    /// Get the Showrunner (main orchestrator)
    pub fn showrunner(&self) -> &CrewMember {
        self.agents.get(&AgentRole::Showrunner).unwrap()
    }

    /// Get all agents
    pub fn all(&self) -> impl Iterator<Item = &CrewMember> {
        self.agents.values()
    }

    /// Process a request through the appropriate agent
    pub async fn process(&self, role: AgentRole, input: AgentInput) -> Result<AgentOutput, String> {
        let agent = self
            .agents
            .get(&role)
            .ok_or_else(|| format!("Agent not found: {:?}", role))?;

        Ok(agent.process(input).await)
    }

    /// Route a request to the best agent based on intent
    /// This is a simple implementation - the Showrunner can do more complex routing
    pub fn route_by_intent(&self, intent: &str) -> AgentRole {
        let intent_lower = intent.to_lowercase();

        if intent_lower.contains("image")
            || intent_lower.contains("photo")
            || intent_lower.contains("picture")
            || intent_lower.contains("concept art")
        {
            AgentRole::PhotographyDirector
        } else if intent_lower.contains("video")
            || intent_lower.contains("shot")
            || intent_lower.contains("sequence")
            || intent_lower.contains("footage")
        {
            AgentRole::CameraDirector
        } else if intent_lower.contains("script")
            || intent_lower.contains("dialogue")
            || intent_lower.contains("scene")
            || intent_lower.contains("write")
        {
            AgentRole::Scriptwriter
        } else if intent_lower.contains("voice")
            || intent_lower.contains("speak")
            || intent_lower.contains("say")
        {
            AgentRole::VoiceActors
        } else if intent_lower.contains("music")
            || intent_lower.contains("sound")
            || intent_lower.contains("audio")
            || intent_lower.contains("sfx")
        {
            AgentRole::MusicSfxDirector
        } else if intent_lower.contains("character")
            || intent_lower.contains("cast")
            || intent_lower.contains("actor")
        {
            AgentRole::CastingDirector
        } else if intent_lower.contains("location")
            || intent_lower.contains("set")
            || intent_lower.contains("prop")
        {
            AgentRole::ArtDirector
        } else if intent_lower.contains("camera")
            || intent_lower.contains("lens")
            || intent_lower.contains("lighting")
        {
            AgentRole::Cinematographer
        } else if intent_lower.contains("edit")
            || intent_lower.contains("cut")
            || intent_lower.contains("montage")
        {
            AgentRole::Editor
        } else if intent_lower.contains("color")
            || intent_lower.contains("grade")
            || intent_lower.contains("lut")
        {
            AgentRole::Colorist
        } else {
            // Default to Showrunner for general/unclear requests
            AgentRole::Showrunner
        }
    }
}

impl Default for VirtualCrew {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crew_creation() {
        let crew = VirtualCrew::new();
        assert_eq!(crew.agents.len(), 11);
    }

    #[test]
    fn test_agent_access() {
        let crew = VirtualCrew::new();
        let showrunner = crew.showrunner();
        assert_eq!(showrunner.role(), AgentRole::Showrunner);
    }

    #[test]
    fn test_intent_routing() {
        let crew = VirtualCrew::new();

        assert_eq!(
            crew.route_by_intent("Generate an image of a sunset"),
            AgentRole::PhotographyDirector
        );
        assert_eq!(
            crew.route_by_intent("Create a video shot of the hero walking"),
            AgentRole::CameraDirector
        );
        assert_eq!(
            crew.route_by_intent("Write the dialogue for this scene"),
            AgentRole::Scriptwriter
        );
        assert_eq!(
            crew.route_by_intent("What should we do next?"),
            AgentRole::Showrunner
        );
    }

    #[test]
    fn test_default_models() {
        let photo = CrewMember::new(AgentRole::PhotographyDirector);
        assert_eq!(photo.default_model(), "flux.2");

        let camera = CrewMember::new(AgentRole::CameraDirector);
        assert_eq!(camera.default_model(), "veo-3.1");
    }
}
