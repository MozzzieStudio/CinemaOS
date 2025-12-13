# CinemaOS 🎬

**The AI-Powered Operating System for Modern Filmmaking**

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-blue.svg)](https://v2.tauri.app/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-1.85-orange.svg)](https://www.rust-lang.org/)

> **Cinema OS** unifies scriptwriting, pre-production, AI generation, and post-production into a single, agentic-first platform. Think **Final Draft + ComfyUI + DaVinci Resolve** in one app.

---

## 🎯 What is CinemaOS?

CinemaOS is the first **Agentic AI-First Operating System** for filmmakers. It replaces the fragmented workflow of modern production with:

- ✍️ **Professional Scriptwriting** (Hollywood standard formatting)
- 🧠 **The Vault** - AI-powered context engine for consistency
- 🤖 **Virtual Crew** - 11 specialized AI agents
- 🎨 **Generative Studio** - Image/video/audio generation
- 🎬 **NLE 2.0** - Timeline editing with AI integration

---

## ⚡ Quick Start (5 minutes)

### Prerequisites

| Tool        | Version | Install                                                            |
| ----------- | ------- | ------------------------------------------------------------------ |
| **Node.js** | 20+     | [nvm](https://github.com/nvm-sh/nvm) or [volta](https://volta.sh/) |
| **Rust**    | 1.85+   | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh`  |
| **npm**     | 10+     | Included with Node.js                                              |

### Installation

```bash
# 1. Clone repository
git clone https://github.com/cinema-os/core.git
cd core

# 2. Install dependencies
npm install

# 3. Run development server
npm run tauri dev
```

**That's it!** The app will launch in development mode.

---

## 🏗️ Architecture

### Hybrid Compute Model

CinemaOS uses a **local-first, cloud-burst** architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Thin Client (Tauri)                     │
│  React 19 + Lexical + PixiJS + WGPU                         │
│  • Script Editor  • Infinite Canvas  • Timeline             │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼───────┐
│  Local Models  │  │  Cloud API   │
│  Llama 4       │  │  Vertex AI   │
│  Gemini Nano   │  │  Fal.ai      │
│  ComfyUI       │  │  OpenAI      │
└────────────────┘  └──────┬───────┘
                           │
                    ┌──────▼──────┐
                    │ SurrealDB   │
                    │  (Vault)    │
                    └─────────────┘
```

### Tech Stack Reference (Technical Bible v3.4.0)

Key decisions from the [Technical Bible](technical_bible.md):

| Part     | Stack Component  | Technologies                                      |
| :------- | :--------------- | :------------------------------------------------ |
| **I**    | **Rust Core**    | Tauri v2, Tokio, Tonic (gRPC), Reqwest, Serde     |
| **II**   | **Frontend**     | React 19, Tailwind v4, Lexical, Zod               |
| **III**  | **Data & State** | SurrealDB (Vector/Graph), Loro (CRDTs), Zustand   |
| **IV**   | **Graphics**     | WGPU, Wasmtime, FFmpeg, Bevy, PixiJS v8           |
| **V**    | **Audio**        | Kira, CLAP, OpenTimelineIO, OpenColorIO           |
| **VI**   | **Cloud infra**  | Google Cloud Run, GKE Autopilot, Apigee           |
| **VII**  | **AI Services**  | Vertex AI (Gemini 2.0/Gemma), GPU Fleet (L4/A100) |
| **VIII** | **External AI**  | fal.ai (Media Gen), ComfyUI (Workflows)           |

---

## 📂 Project Structure

```
CinemaOS/
├── .agent/rules/           # AI agent definitions & project memory
├── src/                    # Frontend (React 19)
│   ├── components/
│   │   ├── editor/         # Lexical script editor
│   │   ├── ai/             # AI chat & agent UI
│   │   └── studio/         # Infinite canvas
│   ├── lib/                # Utilities (posthog, errors, etc.)
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── ai/             # AI orchestration & agents
│   │   ├── vault/          # SurrealDB integration
│   │   ├── installer/      # Hardware detection & setup
│   │   ├── observability/  # Sentry error tracking
│   │   └── errors/         # Structured error codes
│   └── Cargo.toml
├── backend/                # Cloud backend (Cloud Run)
│   └── src/providers/      # Fal.ai, Vertex AI
├── comfyui_nodes/          # Custom ComfyUI nodes
└── docs/                   # Documentation
```

---

## 🤖 The Virtual Crew (AI Agents)

CinemaOS features **11 specialized AI agents** that handle different aspects of production:

| Agent                    | Responsibility                 | Models                     |
| ------------------------ | ------------------------------ | -------------------------- |
| **The Showrunner**       | Guardian of consistency & tone | Gemini 3 Pro, Claude 4.5   |
| **Scriptwriter**         | Screenplay, dialogue, plot     | Llama 4, Claude Sonnet 4.5 |
| **Cinematographer**      | Camera angles, lighting        | Gemini 3 Pro               |
| **Photography Director** | Image generation               | FLUX.2 Pro, Imagen 4       |
| **Camera Director**      | Video generation               | Veo 3.1, Sora 2, Kling O1  |
| **Voice Actors**         | TTS & dialogue                 | ElevenLabs v3              |
| **Music & SFX Director** | Score & sound design           | Lyria 2, Suno v4           |
| **Casting Director**     | Character consistency          | SAM 3, Kling O1            |
| **Art Director**         | Locations, sets, props         | Qwen 3-VL, Meshy 4         |
| **Editor**               | Montage & pacing               | Gemini 3 Pro               |
| **The Colorist**         | Color grading & LUTs           | Kling VFX House            |

Agents are accessible via **Chat Sidebar** or **Context Menu** (right-click).

---

## 🚀 Development

### Commands

```bash
# Development
npm run tauri dev          # Start dev server
npm run build              # Build frontend
npm run tauri build        # Build production app

# Testing
cargo test                 # Rust unit tests
npm run test:e2e          # Playwright E2E tests

# Code Quality
cargo clippy              # Rust linting
cargo fmt                 # Rust formatting
npm run lint              # ESLint
npm run type-check        # TypeScript checking

# Documentation
cargo doc --open          # View Rust API docs
```

### Environment Variables

Create `.env` file (never commit):

```bash
# Required for cloud features
SENTRY_DSN=https://...@sentry.io/xxx
SENTRY_ENVIRONMENT=development

# PostHog analytics
VITE_POSTHOG_KEY=phc_xxx
VITE_POSTHOG_HOST=https://app.posthog.com

# AI Providers (optional, for cloud features)
GOOGLE_API_KEY=xxx
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
FAL_API_KEY=xxx
```

---

## 📚 Documentation

### For Developers

- [Architecture Overview](docs/ARCHITECTURE.md)
- [AI Agents System](.agent/rules/ai-orchestration.md)
- [Database Schema](docs/SCHEMA.md)
- [API Reference](https://docs.cinemaos.dev/api)

### For Contributors

- [Contributing Guide](CONTRIBUTING.md)
- [Code Style Guide](docs/STYLE_GUIDE.md)
- [Security Policy](.agent/rules/security-engineer.md)

### ADRs (Architecture Decision Records)

- [ADR-001: Why Tauri over Electron](docs/adr/001-tauri-choice.md)
- [ADR-002: SurrealDB for The Vault](docs/adr/002-surrealdb.md)
- [ADR-003: Hybrid Compute Model](docs/adr/003-hybrid-compute.md)

---

## 🧪 Testing

### Unit Tests (Rust)

```bash
cd src-tauri
cargo test
```

263 lines of unit tests covering:

- LLM client logic
- Agent routing
- Workflow generation
- Error handling

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Tests full user flows:

- Script writing → token extraction → image generation
- Mode switching (Writer ↔ Studio)
- Export to PDF

---

## 🔐 Security

CinemaOS follows **zero-trust** security principles:

- ✅ **No hardcoded secrets** - Uses OS keychain (`keyring-rs`)
- ✅ **Encrypted local DB** - SurrealDB with encryption at rest
- ✅ **Sandboxed plugins** - Wasmtime for custom agents
- ✅ **Privacy-first analytics** - PostHog with opt-out
- ✅ **Sentry error tracking** - No PII sent

Report security issues to: security@cinemaos.dev

---

## 📦 Deployment

### Desktop App (Tauri)

```bash
# Build for your platform
npm run tauri build

# Outputs to src-tauri/target/release/bundle/
```

### Cloud Backend (Google Cloud Run)

```bash
cd backend
gcloud run deploy cinemaos-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

See [deployment guide](docs/DEPLOYMENT.md) for CI/CD setup.

---

## 🛣️ Roadmap

### ✅ Phase 0-2 (Complete)

- [x] Script editor with Hollywood formatting
- [x] The Vault (token-based context)
- [x] 11 AI agents
- [x] Error codes & observability
- [x] GPU detection & hardware optimization

### 🚧 Phase 3 (In Progress)

- [ ] Documentation complete
- [ ] Rustdoc API reference
- [ ] Video walkthrough

### 📅 Phase 4-6 (Q1 2026)

- [ ] Backend Cloud with Clerk auth
- [ ] Video editing (NLE 2.0)
- [ ] Collaborative editing (multiplayer)
- [ ] Mobile companion app

See [full roadmap](docs/ROADMAP.md).

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Development Workflow

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`cargo test && npm run test:e2e`)
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📜 License

**Proprietary**. Copyright © 2025 CinemaOS. All Rights Reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🙏 Acknowledgments

Built with:

- [Tauri](https://tauri.app/) - Cross-platform desktop framework
- [React](https://react.dev/) - UI library
- [SurrealDB](https://surrealdb.com/) - Multi-model database
- [Lexical](https://lexical.dev/) - Extensible text editor
- [PixiJS](https://pixijs.com/) - 2D WebGL renderer
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - Node-based AI workflows

---

## 📧 Contact

- **Website**: https://cinemaos.dev
- **Email**: team@cinemaos.dev
- **Twitter**: @CinemaOS
- **Discord**: https://discord.gg/cinemaos

---

Made with ❤️ by the CinemaOS team
