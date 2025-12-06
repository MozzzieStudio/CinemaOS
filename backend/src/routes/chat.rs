//! Chat endpoint with streaming

use crate::{AppState, auth::ClerkAuth, providers::vertex::{ChatMessage, ChatRequest}};
use axum::{
    extract::State,
    response::sse::{Event, Sse},
    Json,
};
use futures::stream::Stream;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;

/// Chat request from client
#[derive(Debug, Deserialize)]
pub struct ClientChatRequest {
    pub messages: Vec<ChatMessage>,
    pub model: Option<String>,
    pub agent_role: Option<String>,
}

/// Chat response
#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub content: String,
    pub credits_used: i64,
}

/// Chat handler with SSE streaming
pub async fn chat_handler(
    State(state): State<AppState>,
    auth: ClerkAuth,
    Json(request): Json<ClientChatRequest>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, axum::http::StatusCode> {
    let user = auth.0;
    
    // Get or create user
    let db_user = state.firestore
        .get_or_create_user(&user.user_id, user.email.as_deref())
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // Check credits
    let cost = 1; // 1 credit per chat
    if db_user.credits < cost {
        return Err(axum::http::StatusCode::PAYMENT_REQUIRED);
    }

    // Deduct credits
    state.firestore
        .deduct_credits(&user.user_id, cost, "chat")
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // Build request for Vertex AI
    let model = request.model.unwrap_or_else(|| "gemini-2.0-flash".to_string());
    let vertex_request = ChatRequest {
        messages: request.messages,
        model,
        max_tokens: Some(2048),
        temperature: Some(0.7),
    };

    // Get streaming response
    let stream = state.vertex
        .chat_stream(vertex_request)
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    // Convert to SSE
    let sse_stream = async_stream::stream! {
        use futures::StreamExt;
        let mut stream = stream;
        
        while let Some(result) = stream.next().await {
            match result {
                Ok(chunk) => {
                    let event = Event::default()
                        .data(serde_json::to_string(&chunk).unwrap_or_default());
                    yield Ok(event);
                }
                Err(_) => break,
            }
        }
        
        // Send done event
        yield Ok(Event::default().data("[DONE]"));
    };

    Ok(Sse::new(sse_stream))
}
