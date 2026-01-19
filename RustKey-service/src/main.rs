use axum::{Json, Router, extract::State, http::{StatusCode,HeaderValue, Method, header::CONTENT_TYPE}, routing::{get, post}};
use tower_http::cors::CorsLayer;
use webauthn_rs::prelude::*;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, str::FromStr, sync::Arc};
use tokio::sync::Mutex;

#[derive(Clone)]
struct AppState {
    webauthn: Arc<Webauthn>,
    store: Arc<Mutex<HashMap<Uuid, PasskeyRegistration>>>,
    auth_store: Arc<Mutex<HashMap<Uuid, PasskeyAuthentication>>>,
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
    let auth_store = HashMap::new();
    let state = AppState { webauthn: Arc::new(webauthn), auth_store: Arc::new(Mutex::new(auth_store)), store: Arc::new(Mutex::new(store)), cred_store: Arc::new(Mutex::new(cred_store)) };
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
        let mut store_guard = state.store.lock().await;
        store_guard.remove(&req.user_id);
        guard.insert(format!("{}_cred", &req.user_id), passkey);
        return Json(RegisterFinishResponse { success: true, err: None})
        },
        Err(err) => {
            return Json(RegisterFinishResponse { success: false, err: Some(ApiError { code: StatusCode::BAD_REQUEST.to_string(), message: err.to_string()}) })
        }
    }
}

async fn auth_start(
    State(state): State<AppState>,
    Json(req): Json<AuthStartRequest>,
) -> Json<AuthStartResponse> {
    let guard = state.cred_store.lock().await;
    let creds= guard.get(&format!("{}_cred", req.user_id)).unwrap();
    let ( rcr, auth_state) = state.webauthn.start_passkey_authentication(&[creds.clone()]).unwrap();
    let mut auth_guard = state.auth_store.lock().await;
    auth_guard.insert(Uuid::from_str(req.user_id.as_str()).unwrap(), auth_state);
    return Json( AuthStartResponse { rcr });

}

async fn auth_finish(
    State(state): State<AppState>,
    Json(req): Json<AuthFinishRequest>
) -> Json<AuthFinishResponse> {
    let auth_guard = state.auth_store.lock().await;
    let cred = auth_guard.get(&Uuid::from_str(req.user_id.as_str()).unwrap()).unwrap();
    let auth_result = state.webauthn.finish_passkey_authentication(&req.auth, cred).unwrap();
    let mut cred_guard = state.cred_store.lock().await;
    cred_guard.get_mut(&format!("{}_cred", &req.user_id))
    .map(|key| {
        key.update_credential(&auth_result);
    });
    return Json(AuthFinishResponse { success: true });
}

#[derive(Deserialize)]
struct AuthFinishRequest {
    user_id: String,
    auth: PublicKeyCredential
}
#[derive(Serialize)]
struct  AuthFinishResponse {
    success: bool
}
#[derive(Deserialize)]
struct AuthStartRequest {
    user_id: String,
}
#[derive(Serialize)]
struct AuthStartResponse {
    rcr: RequestChallengeResponse
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