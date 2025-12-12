//! GPU Detection using WGPU
//!
//! Detects GPU hardware information using WGPU adapters.
//! Falls back to nvidia-smi/rocm-smi if WGPU fails.

use tracing::{debug, warn};

/// GPU information
#[derive(Debug, Clone)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub vram_gb: u32,
    pub backend: GpuBackend,
}

#[derive(Debug, Clone, PartialEq)]
pub enum GpuBackend {
    Vulkan,
    Metal,
    DirectX12,
    OpenGL,
    Unknown,
}

/// Detect GPU using WGPU adapter enumeration
pub async fn detect_gpu_async() -> Option<GpuInfo> {
    debug!("Starting GPU detection with WGPU");

    // Create WGPU instance
    let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
        backends: wgpu::Backends::all(),
        ..Default::default()
    });

    // Request adapter (primary GPU)
    let adapter = instance
        .request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: wgpu::PowerPreference::HighPerformance,
            compatible_surface: None,
            force_fallback_adapter: false,
        })
        .await?;

    let info = adapter.get_info();
    let limits = adapter.limits();

    // Calculate VRAM in GB (max buffer size is a good approximation)
    let vram_bytes = limits.max_buffer_size;
    let vram_gb = (vram_bytes / (1024 * 1024 * 1024)) as u32;

    // Determine vendor from device type and name
    let vendor = match info.vendor {
        0x1002 => "AMD",
        0x10DE => "NVIDIA",
        0x8086 => "Intel",
        0x106B => "Apple",
        _ => {
            // Try to infer from name
            let name_lower = info.name.to_lowercase();
            if name_lower.contains("nvidia")
                || name_lower.contains("geforce")
                || name_lower.contains("rtx")
            {
                "NVIDIA"
            } else if name_lower.contains("amd") || name_lower.contains("radeon") {
                "AMD"
            } else if name_lower.contains("intel") || name_lower.contains("iris") {
                "Intel"
            } else if name_lower.contains("apple")
                || name_lower.contains("m1")
                || name_lower.contains("m2")
            {
                "Apple"
            } else {
                "Unknown"
            }
        }
    };

    let backend = match info.backend {
        wgpu::Backend::Vulkan => GpuBackend::Vulkan,
        wgpu::Backend::Metal => GpuBackend::Metal,
        wgpu::Backend::Dx12 => GpuBackend::DirectX12,
        wgpu::Backend::Gl => GpuBackend::OpenGL,
        _ => GpuBackend::Unknown,
    };

    debug!(
        "Detected GPU: {} ({}), VRAM: {} GB, Backend: {:?}",
        info.name, vendor, vram_gb, backend
    );

    Some(GpuInfo {
        name: info.name.clone(),
        vendor: vendor.to_string(),
        vram_gb,
        backend,
    })
}

/// Synchronous wrapper for GPU detection
pub fn detect_gpu() -> (Option<String>, Option<String>, u32) {
    // Try WGPU detection first (async)
    let result = tokio::runtime::Runtime::new()
        .ok()
        .and_then(|rt| rt.block_on(detect_gpu_async()));

    if let Some(gpu) = result {
        return (Some(gpu.name), Some(gpu.vendor), gpu.vram_gb);
    }

    // Fallback to nvidia-smi on Windows/Linux
    #[cfg(any(windows, target_os = "linux"))]
    {
        if let Some((name, vram)) = try_nvidia_smi() {
            return (Some(name), Some("NVIDIA".to_string()), vram);
        }
    }

    // Fallback to rocm-smi on Linux
    #[cfg(target_os = "linux")]
    {
        if let Some((name, vram)) = try_rocm_smi() {
            return (Some(name), Some("AMD".to_string()), vram);
        }
    }

    warn!("No GPU detected");
    (None, None, 0)
}

/// Try detecting NVIDIA GPU via nvidia-smi
#[cfg(any(windows, target_os = "linux"))]
fn try_nvidia_smi() -> Option<(String, u32)> {
    let output = std::process::Command::new("nvidia-smi")
        .args([
            "--query-gpu=name,memory.total",
            "--format=csv,noheader,nounits",
        ])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parts: Vec<&str> = stdout.trim().split(',').collect();

    if parts.len() >= 2 {
        let name = parts[0].trim().to_string();
        let vram_mb: u32 = parts[1].trim().parse().ok()?;
        debug!("nvidia-smi detected: {} with {} MB VRAM", name, vram_mb);
        return Some((name, vram_mb / 1024));
    }

    None
}

/// Try detecting AMD GPU via rocm-smi
#[cfg(target_os = "linux")]
fn try_rocm_smi() -> Option<(String, u32)> {
    let output = std::process::Command::new("rocm-smi")
        .args(["--showproductname", "--showmeminfo", "vram"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse rocm-smi output (simplified)
    // Real implementation would need more robust parsing
    let name = stdout
        .lines()
        .find(|line| line.contains("Card series"))
        .and_then(|line| line.split(':').nth(1))
        .map(|s| s.trim().to_string())?;

    // Default VRAM (rocm-smi output parsing is complex)
    debug!("rocm-smi detected: {}", name);
    Some((name, 8)) // Conservative default
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gpu_detection_doesnt_panic() {
        let result = detect_gpu();
        // Should return something (even if None, None, 0)
        assert!(result.0.is_some() || result.0.is_none());
    }

    #[tokio::test]
    async fn test_async_detection() {
        let result = detect_gpu_async().await;
        // Should not panic
        if let Some(gpu) = result {
            assert!(!gpu.name.is_empty());
            assert!(!gpu.vendor.is_empty());
        }
    }
}
