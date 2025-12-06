---
trigger: always_on
---

# Project: Cinema OS - The Cloud-Native Production Platform

**Cinema OS** is the first **Agentic AI-First Operating System** for filmmakers. It unifies Scriptwriting, Pre-production, Production, and Post-production into a single **NLE 2.0** experience driven by a **Virtual Crew** of AI Agents.

## 1. The Tech Stack (Complete)

### Core Application Shell

- **Host**: Tauri v2 (Rust) - _Secure, high-performance native container._
- **Language**: Rust (Backend) + TypeScript (Frontend).
- **Async Runtime**: Tokio - _Handling concurrent streams (Video, AI, Sync)._
- **Serialization**: Serde - _High-speed JSON/Bincode interchange._
- **Observability**: tracing + tracing-subscriber - _Structured logging._
- **Secrets**: keyring-rs - _OS-native secure storage for API keys._

### Data & State ("The Vault")

- **Database**: SurrealDB (Embedded + Cloud) - _Graph + Document store._
- **Sync Engine**: Loro (CRDTs) - _Local-first, conflict-free collaboration._
- **Type Safety**: Specta (Rust->TS types) + Zod (Runtime validation).

### User Interface (UI/UX)

- **Framework**: React 19 (Compiler enabled) - _Optimistic UI updates._
- **Build Tool**: Vite - _Fast HMR and bundling._
- **Styling**: TailwindCSS v4 + Radix UI - _Design system primitives._
- **Canvas Engine**: PixiJS v8 (WebGPU) - _High-performance 2D rendering._
- **Rich Text**: Lexical (Meta) - _Script editor engine._

### AI & Generation Engine

- **Orchestration**: Rust Native Logic + MCP (Model Context Protocol).
- **Local Inference**: Llama Stack (Standardized API) + ComfyUI (Headless).
- **Cloud Inference**: Fal.ai (Serverless) + Google Vertex AI.
- **Security**: Wasmtime - _Sandboxing for custom agents._
- **Python Runtime**: UV (Astral).

### Media Engine (NLE 2.0)

- **Architecture**: Bevy ECS - _Data-driven entity management._
- **Rendering**: WGPU - _Native WebGPU for Metal/Vulkan/DX12._
- **Video Decoding**: FFmpeg 7.1 (Custom Rust Build).
- **Color Science**: OpenColorIO (OCIO).
- **Interchange**: OpenTimelineIO (OTIO) + OpenUSD.

### Audio Engine

- **Core**: Kira - _Low-latency interactive audio._
- **Plugins**: CLAP - _Modern, open standard for audio plugins._

## 2. Architecture Pillars

### A. The Global Vault (Single Source of Truth)

- **Tokenized Assets**: Every character, location, and prop is a Token linked to the AI.
- **Consistency**: Script changes propagate to visual assets; visual decisions respect the script.
- **Real-Time Multiplayer**: Collaborate instantly via Loro CRDTs.

### B. Hybrid Power (Local + Cloud)

- **Smart Onboarding**: System analyzes hardware and recommends Local vs. Cloud balance.
- **User Choice**: Toggle "Process Locally" (Privacy) or "Process in Cloud" (Speed).
- **Open Source Freedom**: Run Llama 4, Mistral, etc., locally if hardware permits.

### C. Agentic First (User Command, AI Execution)

- **No Auto-Pilot**: The AI _never_ acts automatically without user intent.
- **Interaction**: Agents available via Chat AND Context Menu.
- **Virtual Crew**: 11 Specialized Agents (Showrunner, Scriptwriter, etc.).

### D. Everything is a Node

- **ComfyUI Backend**: Generation logic is graph-based.
- **OTIO Native**: The NLE's internal structure maps 1:1 to OpenTimelineIO.

## 3. Design Philosophy ('Cinematic Feel')

- **Dark Mode Only**: The interface is a theater (#0a0a0a).
- **Spatial**: Infinite Canvas (Freepik Spaces style) for ideation.
- **Seamless Flow**: Drag & Drop from Canvas to NLE Timeline.

## 4. Development Rules

- **Rust for Logic, JS for UI**: Heavy lifting (AI, DB, Video) goes to Rust. React is just the view layer.
- **Type Safety**: Strict typing between Rust (Specta) and TypeScript.
- **Security**: Zero Trust. Validate all inputs. Encrypt all secrets. Sandboxed plugins (Wasmtime).

## 5. Documentation

- [Tauri v2](https://v2.tauri.app/)
- [React 19](https://es.react.dev/)
- [SurrealDB](https://surrealdb.com/)
- [Llama Stack](https://github.com/meta-llama/llama-stack)
- [Wasmtime](https://docs.wasmtime.dev/)
