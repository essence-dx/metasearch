use std::sync::Arc;

use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::post,
};

use crate::state::AppState;

const ZEN_CHAT_URL: &str = "https://opencode.ai/zen/v1/chat/completions";

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/api/zen/chat", post(proxy_zen_chat))
}

async fn proxy_zen_chat(
    State(state): State<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let response = state
        .http_client
        .post(ZEN_CHAT_URL)
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer public")
        .json(&body)
        .send()
        .await;

    match response {
        Ok(resp) => {
            let status = resp.status();
            match resp.json::<serde_json::Value>().await {
                Ok(data) => (status, Json(data)).into_response(),
                Err(e) => (
                    StatusCode::BAD_GATEWAY,
                    Json(serde_json::json!({
                        "error": "proxy_parse_error",
                        "message": format!("Failed to parse upstream response: {e}")
                    })),
                )
                    .into_response(),
            }
        }
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(serde_json::json!({
                "error": "proxy_upstream_error",
                "message": format!("Upstream request failed: {e}")
            })),
        )
            .into_response(),
    }
}
