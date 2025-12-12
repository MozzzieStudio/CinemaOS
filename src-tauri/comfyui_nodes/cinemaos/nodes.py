import nodes
import folder_paths
import comfy.samplers
import os
from PIL import Image, ImageOps
import numpy as np
import torch

# ═══════════════════════════════════════════════════════════════════════════════
# STANDARD ADAPTERS
# ═══════════════════════════════════════════════════════════════════════════════

class CinemaOS_CheckpointLoader:
    """Adapter for CheckpointLoaderSimple"""
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {"ckpt_name": (folder_paths.get_filename_list("checkpoints"), )}}
    RETURN_TYPES = ("MODEL", "CLIP", "VAE")
    FUNCTION = "load_checkpoint"
    CATEGORY = "CinemaOS/Standard"

    def load_checkpoint(self, ckpt_name):
        return nodes.CheckpointLoaderSimple().load_checkpoint(ckpt_name)

class CinemaOS_EmptyLatent:
    """Adapter for EmptyLatentImage"""
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "width": ("INT", {"default": 512, "min": 64, "max": 8192}),
            "height": ("INT", {"default": 512, "min": 64, "max": 8192}),
            "batch_size": ("INT", {"default": 1, "min": 1, "max": 64})
        }}
    RETURN_TYPES = ("LATENT",)
    FUNCTION = "generate"
    CATEGORY = "CinemaOS/Standard"

    def generate(self, width, height, batch_size=1):
        return nodes.EmptyLatentImage().generate(width, height, batch_size)

class CinemaOS_CLIPTextEncode:
    """Adapter for CLIPTextEncode"""
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "text": ("STRING", {"multiline": True}), 
            "clip": ("CLIP", )
        }}
    RETURN_TYPES = ("CONDITIONING",)
    FUNCTION = "encode"
    CATEGORY = "CinemaOS/Standard"

    def encode(self, text, clip):
        return nodes.CLIPTextEncode().encode(clip, text)

class CinemaOS_KSampler:
    """Adapter for KSampler"""
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "model": ("MODEL",),
            "seed": ("INT", {"default": 0, "min": 0, "max": 0xffffffffffffffff}),
            "steps": ("INT", {"default": 20, "min": 1, "max": 10000}),
            "cfg": ("FLOAT", {"default": 8.0, "min": 0.0, "max": 100.0}),
            "sampler_name": (comfy.samplers.KSampler.SAMPLERS, ),
            "scheduler": (comfy.samplers.KSampler.SCHEDULERS, ),
            "positive": ("CONDITIONING", ),
            "negative": ("CONDITIONING", ),
            "latent_image": ("LATENT", ),
            "denoise": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01}),
        }}
    RETURN_TYPES = ("LATENT",)
    FUNCTION = "sample"
    CATEGORY = "CinemaOS/Standard"

    def sample(self, model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent_image, denoise):
        return nodes.KSampler().sample(model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent_image, denoise)

class CinemaOS_VAEDecode:
    """Adapter for VAEDecode"""
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {"samples": ("LATENT", ), "vae": ("VAE", )}}
    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "decode"
    CATEGORY = "CinemaOS/Standard"

    def decode(self, samples, vae):
        return nodes.VAEDecode().decode(samples, vae)

class CinemaOS_SaveImage:
    """Adapter for SaveImage"""
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "images": ("IMAGE", ),
            "filename_prefix": ("STRING", {"default": "CinemaOS"})
        }}
    RETURN_TYPES = ()
    FUNCTION = "save_images"
    OUTPUT_NODE = True
    CATEGORY = "CinemaOS/Standard"

    def save_images(self, images, filename_prefix="CinemaOS"):
        return nodes.SaveImage().save_images(images, filename_prefix)

# ═══════════════════════════════════════════════════════════════════════════════
# VAULT & NATIVE INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════

class CinemaOS_VaultLoader:
    """Loads assets directly from filesystem absolute paths"""
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "asset_path": ("STRING", {"default": "", "multiline": False}),
                "asset_type": (["image", "lora"],),
            }
        }
    RETURN_TYPES = ("IMAGE", "MASK")
    FUNCTION = "load_asset"
    CATEGORY = "CinemaOS/Vault"

    def load_asset(self, asset_path, asset_type):
        if not os.path.exists(asset_path):
            print(f"[CinemaOS] Asset not found: {asset_path}")
            empty = torch.zeros((1, 512, 512, 3), dtype=torch.float32, device="cpu")
            return (empty, torch.zeros((1, 512, 512), dtype=torch.float32, device="cpu"))
        
        if asset_type == "image":
            img = Image.open(asset_path)
            img = ImageOps.exif_transpose(img)
            if img.mode == 'I':
                img = img.point(lambda i: i * (1 / 255))
            image = img.convert("RGB")
            image = np.array(image).astype(np.float32) / 255.0
            image = torch.from_numpy(image)[None,]
            if 'A' in img.getbands():
                mask = np.array(img.getchannel('A')).astype(np.float32) / 255.0
                mask = 1.0 - torch.from_numpy(mask)
            else:
                mask = torch.zeros((64, 64), dtype=torch.float32, device="cpu")
            return (image, mask)
        return (None, None)

class CinemaOS_LlamaGen:
    """Mock integration for Local Llama"""
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "prompt": ("STRING", {"multiline": True}),
                "model": (["llama-4-8b", "llama-4-70b", "mistral-large"],),
            }
        }
    RETURN_TYPES = ("STRING",)
    FUNCTION = "generate_text"
    CATEGORY = "CinemaOS/Native"

    def generate_text(self, prompt, model):
        print(f"[CinemaOS] Generating text with {model}: {prompt[:50]}...")
        enhanced_prompt = f"{prompt}, cinematic lighting, photorealistic, 8k, highly detailed"
        return (enhanced_prompt,)
