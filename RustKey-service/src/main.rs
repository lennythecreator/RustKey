use axum::{Json, Router, extract::State, http::{StatusCode,HeaderValue, Method, header::CONTENT_TYPE}, routing::{get, post}};
use tower_http::cors::CorsLayer;
use webauthn_rs::prelude::*;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::Mutex;

#[derive(Clone)]
struct AppState {
    webauthn: Arc<Webauthn>,
    store: Arc<Mutex<HashMap<Uuid, PasskeyRegistration>>>,
    cred_store: Arc<Mutex<HashMap<String, Passkey>>>
}

#[tokio::main]
async fn main() {
    let webauthn = WebauthnBuilder::new("localhost", &Url::parse("http://localhost:5173").unwrap())
        .unwrap()
        .build()
        .unwrap();
    let store = HashMap::new();
    let cred_store = HashMap::new();
    
    let state = AppState { webauthn: Arc::new(webauthn), store: Arc::new(Mutex::new(store)), cred_store: Arc::new(Mutex::new(cred_store)) };
let cors = CorsLayer::new()
    .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
    .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
    .allow_headers([CONTENT_TYPE]);
    let app = Router::new()
        .route("/", get(home))
        .route("/register/start", post(register_start))
        .route("/register/finish", post(register_finish))
        .route("/auth/start", post(auth_start))
        .route("/auth/finish", post(auth_finish))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app.into_make_service()).await.unwrap();
}

async fn home() -> String{
    String::from("hello world")
}
async fn register_start(
    State(state): State<AppState>,
    Json(req): Json<RegisterStartRequest>,
) -> Json<RegisterStartResponse> {
    let user_unique_id = Uuid::new_v4(); 
    let (ccr, skr) = state.webauthn.start_passkey_registration(
        user_unique_id,
        &req.username,
        &req.display_name,
        None, 
    ).unwrap();
    {
        let mut guard = state.store.lock().await;
        guard.insert(user_unique_id, skr);
    }
    Json(RegisterStartResponse { user_id: user_unique_id, ccr})
}

async fn register_finish(
    State(state): State<AppState>,
    Json(req): Json<RegisterFinishRequest>,
) -> Json<RegisterFinishResponse> {
    let skr = {
        let guard = state.store.lock().await;
        guard.get(&req.user_id).expect("pending registration not found").clone()
    };
    let res = state.webauthn.finish_passkey_registration(&req.response, &skr);
    match res {
        Ok(passkey) => {
        let mut guard = state.cred_store.lock().await;
        guard.insert(format!("{}_cred", &req.user_id), passkey);
        return Json(RegisterFinishResponse { success: true, err: None})
        },
        Err(err) => {
            return Json(RegisterFinishResponse { success: false, err: Some(ApiError { code: StatusCode::BAD_REQUEST.to_string(), message: err.to_string()}) })
        }
    }
}

async fn auth_start() -> String{
    String::from("Auth Start")
}

async fn auth_finish() -> String{
    String::from("Auth finish")
}

#[derive(Deserialize)]
struct RegisterStartRequest {
    username: String,
    display_name: String,
}

#[derive(Deserialize)]
struct RegisterFinishRequest {
    user_id: Uuid,
    response: RegisterPublicKeyCredential
}
#[derive(Serialize)]
struct  RegisterFinishResponse {
    success: bool,
    err: Option<ApiError>
}


#[derive(Serialize)]
struct ApiError {
    code: String,
    message: String
}
#[derive(Serialize)]
struct RegisterStartResponse {
    user_id: Uuid,
    ccr: CreationChallengeResponse
}