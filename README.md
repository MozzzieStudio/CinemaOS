# Cinema OS 🎬

**The Operating System for the Next Generation of Filmmakers.**

> [!IMPORTANT] > **INTERNAL USE ONLY**. This repository contains proprietary code and intellectual property of Cinema OS. Do not share publicly.

## 🌟 Welcome to the Team

Cinema OS is a **Unified Creative Environment** designed to replace the fragmented workflow of modern filmmaking. We are building the "Glass" interface that unifies Scriptwriting, Pre-Production, Generative AI, and Non-Linear Editing (NLE).

If you are new here, start by reading the **[Product Vision](docs/Product.md)**.

## 🏗️ Architecture Overview

We use a **Hybrid Compute** architecture to deliver zero-latency local performance with infinite cloud scalability.

| Component         | Tech Stack                         | Responsibility                                         |
| :---------------- | :--------------------------------- | :----------------------------------------------------- |
| **Thin Client**   | **Tauri v2** (Rust) + **React 19** | The local app. Handles UI, Input, and Video Playback.  |
| **The Vault**     | **SurrealDB Cloud**                | The "Single Source of Truth". Syncs data in real-time. |
| **The Hive Mind** | **Google Cloud Run**               | Serverless backend for AI Agents and Orchestration.    |
| **GenAI Engine**  | **ComfyUI** (Headless)             | Generates Images and Video on H100 GPUs.               |

## 🚀 Getting Started

### Prerequisites

1.  **Node.js 20+** (Use `nvm` or `volta`)
2.  **Rust** (Latest Stable) -> `rustup update`
3.  **pnpm** -> `npm install -g pnpm`
4.  **Google Cloud SDK** (Optional, for backend devs)

### Installation

1.  **Clone the Repo**:

    ```bash
    git clone https://github.com/cinema-os/core.git
    cd core
    ```

2.  **Install Dependencies**:

    ```bash
    pnpm install
    ```

3.  **Environment Setup**:

    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - **Ask the Tech Lead** for the development secrets (Clerk Keys, SurrealDB Credentials).
    - **NEVER** commit `.env` to git.

4.  **Run Development Server**:
    ```bash
    pnpm tauri dev
    ```

## 📂 Project Structure

```
d:/Cinema and TV IDE/
├── .agent/rules/       # 🧠 AI Agent Rules (The "Bible" for our AI coding assistants)
├── docs/               # 📚 Product Documentation
├── src/                # ⚛️ Frontend (React 19, Tailwind v4, PixiJS)
├── src-tauri/          # 🦀 Backend (Rust, SurrealDB, AI Logic)
│   ├── src/vault/      #    - Database Logic
│   ├── src/ai/         #    - AI Agent Orchestration
│   └── Cargo.toml      #    - Rust Dependencies
└── package.json        # 📦 Frontend Dependencies
```

## 🧠 The Virtual Crew (AI Agents)

Our AI is organized into specialized "Agents". You can find their definitions in `.agent/rules/ai-orchestration.md`.

- **Showrunner**: Orchestrator.
- **Scriptwriter**: Text generation.
- **Cinematographer**: Visual style.
- **...and 8 more.**

## 📚 Documentation Index

- **[Product Vision & Roadmap](docs/Product.md)**
- **[Architecture & Tech Stack](.agent/rules/general-rules.md)**
- **[AI Orchestration](.agent/rules/ai-orchestration.md)**
- **[Cloud Infrastructure](.agent/rules/cloud-infrastructure.md)**
- **[Security Protocols](.agent/rules/security-engineer.md)**
- **[Reference Links](.agent/rules/references.md)**

## 🔐 Security Protocols

- **Zero Trust**: Assume the network is hostile.
- **No Hardcoded Secrets**: Use `keyring-rs` or Environment Variables.
- **Private Buckets**: All GCS buckets are private.

## 📜 License

Proprietary. Copyright © 2025 Cinema OS. All Rights Reserved.
