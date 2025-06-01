use axum::response::{IntoResponse, Response};
use axum::http::StatusCode;
use serde::Serialize;
use tracing::error;

pub fn send_result<T, E>(result: Result<T, E>) -> Response
where
    T: Serialize,
    E: ToString,
{
    match result {
        Ok(value) => axum::Json(value).into_response(),
        Err(error) => {
            error!("Handler failed: {}", error.to_string());
            (StatusCode::INTERNAL_SERVER_ERROR, error.to_string()).into_response()
        }
    }
}