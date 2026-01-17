# RustKey

RustKey is a learning project to implement a Passkey (WebAuthn) system with a Rust
backend and a React front-end that monitors each step of the flow. The backend
will handle Passkey registration/authentication logic, while the UI helps
visualize and debug the process.

## Project layout

- `RustKey-app/`: React + Vite front-end for monitoring the Passkey flow.
- `RustKey-service/`: Rust backend service for Passkey logic.

## Prerequisites

- Node.js + npm
- Rust toolchain (stable, with `cargo`)

## Quick start

Front-end:

```bash
cd RustKey-app
npm install
npm run dev
```

Back-end:

```bash
cd RustKey-service
cargo run
```

## Tasks (high-level)

- Define the passkey API contract (registration and authentication endpoints).
- Implement challenge generation and verification with expiration/replay safety.
- Store users and credentials in a persistent data store.
- Integrate a Rust WebAuthn/passkey library and handle attestation/assertion.
- Add end-to-end wiring between UI steps and backend endpoints.
- Build a monitoring UI that shows each step and raw request/response data.
- Add tests for core flows (unit + integration) and error cases.
- Add security hardening (rate limiting, origin checks, audit logging).

## Collaborators

See `ONBOARDING.md` for setup and workflow details.
