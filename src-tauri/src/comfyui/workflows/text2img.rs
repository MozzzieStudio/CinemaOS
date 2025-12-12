//! Text-to-Image workflow using FLUX Schnell
//!
//! Fast 4-step generation for previews.

use serde_json::{json, Value};

/// Generate text-to-image workflow for FLUX Schnell
///
/// ## Parameters
/// - `prompt`: Text description of the image to generate
/// - `seed`: Optional random seed (generates random if None)
/// - `width`: Image width (default: 1024)
/// - `height`: Image height (default: 1024)
///
/// ## Returns
/// ComfyUI workflow JSON
pub fn flux_schnell_text2img(
    prompt: &str,
    seed: Option<u64>,
    width: Option<u32>,
    height: Option<u32>,
) -> Value {
    let seed = seed.unwrap_or_else(rand::random);
    let width = width.unwrap_or(1024);
    let height = height.unwrap_or(1024);

    json!({
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": 4,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "flux1-schnell.safetensors"
            }
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt,
                "clip": ["4", 1]
            }
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": "",
                "clip": ["4", 1]
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "cinemaos",
                "images": ["8", 0]
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_flux_schnell_workflow() {
        let workflow = flux_schnell_text2img("A cat", Some(42), None, None);

        // Check workflow structure
        assert!(workflow.get("3").is_some());
        assert!(workflow.get("4").is_some());

        // Check prompt is set
        let prompt_node = &workflow["6"]["inputs"]["text"];
        assert_eq!(prompt_node.as_str().unwrap(), "A cat");

        // Check seed
        let seed = &workflow["3"]["inputs"]["seed"];
        assert_eq!(seed.as_u64().unwrap(), 42);
    }
}
