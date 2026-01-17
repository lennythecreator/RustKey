# RustKey collaborator onboarding

Welcome! This guide helps you get set up and contribute smoothly.

## Project intent

RustKey is a learning project focused on Passkey (WebAuthn) implementation:
- React front-end to visualize and monitor the flow.
- Rust backend to handle Passkey logic and verification.

## Prerequisites

- Node.js + npm
- Rust toolchain (stable)

Optional but recommended:
- `rustfmt` and `clippy` components for formatting and linting.

## Setup

```bash
git clone <repo-url>
cd RustyKey
```

Front-end:

```bash
cd RustKey-app
npm install
```

Back-end:

```bash
cd RustKey-service
cargo build
```

## Run locally

Front-end:

```bash
cd RustKey-app
npm run dev
```

Back-end:

```bash
cd RustKey-service
cargo run
```

## Repository structure

- `RustKey-app/` React + Vite app for the passkey monitor UI.
- `RustKey-service/` Rust service for passkey logic.

## Workflow expectations

- Keep changes focused and small when possible.
- Prefer clear, descriptive commit messages.
- Update docs when behavior changes or new configuration is introduced.

## Checks

Front-end:

```bash
cd RustKey-app
npm run lint
```

Back-end (optional if rustfmt/clippy installed):

```bash
cd RustKey-service
cargo fmt
cargo clippy
```

## Notes for collaboration

- If you add new environment variables, document them in `README.md`.
- If you change API contracts, update any UI steps that display those values.
- For passkey changes, include a brief note describing the flow impact.
