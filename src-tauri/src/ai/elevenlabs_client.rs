use bytes::Bytes;
use futures_util::Stream;
use reqwest::Client;
use serde_json::json;
use std::env;

pub struct ElevenLabsClient {
    http: Client,
    api_key: String,
}

impl ElevenLabsClient {
    pub fn new() -> Result<Self, String> {
        let api_key =
            env::var("ELEVENLABS_API_KEY").map_err(|_| "ELEVENLABS_API_KEY not set".to_string())?;

        Ok(Self {
            http: Client::new(),
            api_key,
        })
    }

    pub async fn stream_speech(
        &self,
        text: &str,
        voice_id: &str,
    ) -> Result<impl Stream<Item = reqwest::Result<Bytes>>, String> {
        let url = format!(
            "https://api.elevenlabs.io/v1/text-to-speech/{}/stream",
            voice_id
        );

        let body = json!({
            "text": text,
            "model_id": "eleven_turbo_v2", // Low latency model
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        });

        let response = self
            .http
            .post(&url)
            .header("xi-api-key", &self.api_key)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("ElevenLabs request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("ElevenLabs API Error: {}", error_text));
        }

        Ok(response.bytes_stream())
    }
}
