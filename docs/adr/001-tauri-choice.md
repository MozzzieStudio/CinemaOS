# ADR-001: Why Tauri Over Electron

**Status**: Accepted  
**Date**: 2025-12-05  
**Deciders**: Tech Lead, Product Owner

## Context

We needed to choose a desktop application framework for CinemaOS. The main contenders were:

- **Electron** (Chromium + Node.js)
- **Tauri** (Rust + WebView)
- **Native** (Qt, GTK, or platform-specific)

## Decision

We chose **Tauri v2** as our desktop application framework.

## Rationale

### ✅ Advantages of Tauri

1. **Bundle Size**: 10-20 MB vs 150+ MB for Electron

   - Critical for fast downloads and updates
   - Lower storage requirements

2. **Memory Usage**: ~100 MB vs 300-500 MB for Electron

   - Better performance on budget hardware
   - Can run more local AI models simultaneously

3. **Security**: Rust's memory safety

   - No buffer overflow vulnerabilities
   - Type-safe IPC between frontend and backend

4. **Performance**: Native Rust backend

   - GPU detection using WGPU
   - Fast video decoding with FFmpeg
   - Low-latency audio with Kira

5. **Native System Integration**:
   - **keyring-rs** for secure credential storage
   - Direct access to GPU APIs
   - Better file system performance

### ⚠️ Trade-offs

1. **Smaller Ecosystem**: Fewer plugins than Electron

   - Mitigated by: Building custom Rust crates

2. **WebView Differences**: Uses system webview

   - Mitigated by: Testing on all platforms
   - Benefit: Smaller bundle, auto-updates with OS

3. **Learning Curve**: Team needs Rust knowledge
   - Mitigated by: AI coding assistants
   - Benefit: Better code quality long-term

## Consequences

### Positive

- Faster app startup (2-3s vs 5-10s)
- Lower system requirements
- Better battery life on laptops
- Easier to add native integrations (ComfyUI, local models)

### Negative

- Longer initial development (Rust learning)
- Platform-specific bugs in webview (rare)

### Neutral

- Frontend remains React (no change)
- Same web technologies (HTML/CSS/JS)

## Alternatives Considered

### Electron

- **Pros**: Huge ecosystem, familiar, Chromium consistency
- **Cons**: Bundle size, memory usage, security concerns
- **Verdict**: Rejected due to resource constraints

### Qt/Native

- **Pros**: Ultimate performance, full control
- **Cons**: 3 separate codebases (Windows/Mac/Linux), slower development
- **Verdict**: Too slow for our iteration speed

## References

- [Tauri Benchmark](https://tauri.app/about/benchmarks/)
- [Tauri Security](https://tauri.app/about/security/)
- [Rust Memory Safety](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)
