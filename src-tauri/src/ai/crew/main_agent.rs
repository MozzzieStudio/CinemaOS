//! Main Agent - The Orchestrator
//!
//! Routes user requests to specialized agents based on intent

use super::{
    ArtDirector, CameraDirector, CastingDirector, Cinematographer, Colorist, Editor,
    MusicSFXDirector, PhotographyDirector, Scriptwriter, Showrunner, VoiceActors,
};
use crate::ai::{
    Agent, AgentCapability, AgentContext, AgentError, AgentMetadata, AgentResponse,
    ProcessingLocation,
};
use async_trait::async_trait;

/// Main Agent - Orchestrates the Virtual Crew
pub struct MainAgent {
    // Specialized agents
    showrunner: Showrunner,
    scriptwriter: Scriptwriter,
    cinematographer: Cinematographer,
    casting_director: CastingDirector,
    art_director: ArtDirector,
    voice_actors: VoiceActors,
    music_sfx: MusicSFXDirector,
    photography: PhotographyDirector,
    camera: CameraDirector,
    editor: Editor,
    colorist: Colorist,
}

impl MainAgent {
    pub fn new() -> Self {
        Self {
            showrunner: Showrunner::new(),
            scriptwriter: Scriptwriter::new(),
            cinematographer: Cinematographer::new(),
            casting_director: CastingDirector::new(),
            art_director: ArtDirector::new(),
            voice_actors: VoiceActors::new(),
            music_sfx: MusicSFXDirector::new(),
            photography: PhotographyDirector::new(),
            camera: CameraDirector::new(),
            editor: Editor::new(),
            colorist: Colorist::new(),
        }
    }

    /// Route message to appropriate agent(s)
    pub async fn route(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        let intent = self.parse_intent(message);

        match intent {
            Intent::Script => self.scriptwriter.process(message, context).await,
            Intent::Visual => self.photography.process(message, context).await,
            Intent::Video => self.camera.process(message, context).await,
            Intent::Character => self.casting_director.process(message, context).await,
            Intent::Location => self.art_director.process(message, context).await,
            Intent::Audio => self.music_sfx.process(message, context).await,
            Intent::Voice => self.voice_actors.process(message, context).await,
            Intent::Composition => self.cinematographer.process(message, context).await,
            Intent::Editing => self.editor.process(message, context).await,
            Intent::ColorGrading => self.colorist.process(message, context).await,
            Intent::ProjectOverview => self.showrunner.process(message, context).await,
            Intent::Unknown => {
                // Default to Main Agent response
                self.process(message, context).await
            }
        }
    }

    /// Parse user intent from message
    fn parse_intent(&self, message: &str) -> Intent {
        let msg_lower = message.to_lowercase();

        // Keyword-based intent classification (TODO: Use LLM for better accuracy)

        // Script/Writing
        if msg_lower.contains("script")
            || msg_lower.contains("dialogue")
            || msg_lower.contains("scene")
            || msg_lower.contains("write")
        {
            return Intent::Script;
        }

        // Visual (Images)
        if msg_lower.contains("image")
            || msg_lower.contains("picture")
            || msg_lower.contains("photo")
            || msg_lower.contains("concept art")
            || msg_lower.contains("storyboard")
        {
            return Intent::Visual;
        }

        // Video
        if msg_lower.contains("video")
            || msg_lower.contains("shot")
            || msg_lower.contains("footage")
            || msg_lower.contains("clip")
        {
            return Intent::Video;
        }

        // Character
        if msg_lower.contains("character")
            || msg_lower.contains("actor")
            || msg_lower.contains("casting")
            || msg_lower.contains("face")
        {
            return Intent::Character;
        }

        // Location/Props
        if msg_lower.contains("location")
            || msg_lower.contains("set")
            || msg_lower.contains("prop")
            || msg_lower.contains("environment")
        {
            return Intent::Location;
        }

        // Audio/Music
        if msg_lower.contains("music")
            || msg_lower.contains("sound")
            || msg_lower.contains("audio")
            || msg_lower.contains("sfx")
        {
            return Intent::Audio;
        }

        // Voice
        if msg_lower.contains("voice")
            || msg_lower.contains("tts")
            || msg_lower.contains("narration")
        {
            return Intent::Voice;
        }

        // Camera/Composition
        if msg_lower.contains("camera")
            || msg_lower.contains("lens")
            || msg_lower.contains("lighting")
            || msg_lower.contains("composition")
        {
            return Intent::Composition;
        }

        // Editing
        if msg_lower.contains("edit")
            || msg_lower.contains("cut")
            || msg_lower.contains("montage")
            || msg_lower.contains("transition")
        {
            return Intent::Editing;
        }

        // Color grading
        if msg_lower.contains("color") || msg_lower.contains("grade") || msg_lower.contains("lut") {
            return Intent::ColorGrading;
        }

        // Project overview
        if msg_lower.contains("overview")
            || msg_lower.contains("consistency")
            || msg_lower.contains("vault")
            || msg_lower.contains("project")
        {
            return Intent::ProjectOverview;
        }

        Intent::Unknown
    }

    /// Get all available agents
    pub fn get_all_agents(&self) -> Vec<&dyn Agent> {
        vec![
            &self.showrunner as &dyn Agent,
            &self.scriptwriter as &dyn Agent,
            &self.cinematographer as &dyn Agent,
            &self.casting_director as &dyn Agent,
            &self.art_director as &dyn Agent,
            &self.voice_actors as &dyn Agent,
            &self.music_sfx as &dyn Agent,
            &self.photography as &dyn Agent,
            &self.camera as &dyn Agent,
            &self.editor as &dyn Agent,
            &self.colorist as &dyn Agent,
        ]
    }
}

impl Default for MainAgent {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Agent for MainAgent {
    fn name(&self) -> &str {
        "Main Agent"
    }

    fn capability(&self) -> AgentCapability {
        AgentCapability::Showrunning
    }

    fn description(&self) -> &str {
        "Routes user requests to the most appropriate specialist agent"
    }

    async fn process(
        &self,
        message: &str,
        context: AgentContext,
    ) -> Result<AgentResponse, AgentError> {
        // Parse intent
        let intent = self.parse_intent(message);

        // Build response with routing suggestion
        let content = format!(
            "I've analyzed your request and determined it relates to: {:?}\n\n\
            I can route this to the appropriate specialist agent. Would you like me to proceed?",
            intent
        );

        // No specific action for unknown intent
        let actions = vec![];

        Ok(AgentResponse {
            agent: self.name().to_string(),
            content,
            actions,
            cost: Some(0.0),
            metadata: AgentMetadata {
                model: "keyword-based-router".to_string(),
                processing_time_ms: 1,
                tokens: None,
                location: ProcessingLocation::Local,
            },
        })
    }
}

/// User intent classification
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Intent {
    Script,          // Scriptwriter
    Visual,          // Photography Director
    Video,           // Camera Director
    Character,       // Casting Director
    Location,        // Art Director
    Audio,           // Music & SFX
    Voice,           // Voice Actors
    Composition,     // Cinematographer
    Editing,         // Editor
    ColorGrading,    // Colorist
    ProjectOverview, // Showrunner
    Unknown,         // Main Agent (ask for clarification)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_intent_parsing() {
        let agent = MainAgent::new();

        assert_eq!(agent.parse_intent("Write a scene"), Intent::Script);
        assert_eq!(
            agent.parse_intent("Generate an image of John"),
            Intent::Visual
        );
        assert_eq!(agent.parse_intent("Create a video shot"), Intent::Video);
        assert_eq!(
            agent.parse_intent("Tell me about my characters"),
            Intent::Character
        );
        assert_eq!(agent.parse_intent("Add background music"), Intent::Audio);
    }
}
