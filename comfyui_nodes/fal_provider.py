"""
Fal.ai Provider Node for ComfyUI

Generates images and videos using Fal.ai's serverless API.
Supports: FLUX, Kling, Veo, and other Fal.ai models.
"""

import os
import requests
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import torch


class FalProviderNode:
    """Generate images via Fal.ai API"""
    
    CATEGORY = "CinemaOS/Cloud"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompt": ("STRING", {"multiline": True}),
                "model": (["flux-2-pro", "flux-1.1-pro", "flux-schnell", "kling-v2.5-turbo", "seedream-4.5"], {"default": "flux-1.1-pro"}),
                "width": ("INT", {"default": 1024, "min": 256, "max": 4096}),
                "height": ("INT", {"default": 1024, "min": 256, "max": 4096}),
            },
            "optional": {
                "negative_prompt": ("STRING", {"multiline": True}),
                "seed": ("INT", {"default": -1}),
                "num_steps": ("INT", {"default": 28, "min": 1, "max": 100}),
                "guidance_scale": ("FLOAT", {"default": 7.5, "min": 0.0, "max": 20.0}),
                "input_image": ("IMAGE",),  # For i2i or video generation
            }
        }
    
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("image", "credits_used")
    FUNCTION = "generate"
    
    def __init__(self):
        self.api_key = os.environ.get("FAL_API_KEY", "")
        self.base_url = "https://fal.run"
    
    def generate(self, prompt, model, width, height, 
                 negative_prompt="", seed=-1, num_steps=28, 
                 guidance_scale=7.5, input_image=None):
        
        if not self.api_key:
            raise ValueError("FAL_API_KEY environment variable not set")
        
        # Map model names to Fal.ai endpoints
        model_endpoints = {
            "flux-2-pro": "fal-ai/flux-2/pro",
            "flux-1.1-pro": "fal-ai/flux-pro/v1.1",
            "flux-schnell": "fal-ai/flux/schnell",
            "kling-v2.5-turbo": "fal-ai/kling-video/v2.5/turbo/image-to-video",
            "seedream-4.5": "fal-ai/seedream/v4.5",
        }
        
        endpoint = model_endpoints.get(model, "fal-ai/flux/schnell")
        url = f"{self.base_url}/{endpoint}"
        
        # Build request payload
        payload = {
            "prompt": prompt,
            "image_size": {"width": width, "height": height},
            "num_inference_steps": num_steps,
            "guidance_scale": guidance_scale,
        }
        
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        if seed >= 0:
            payload["seed"] = seed
        
        # Handle input image for i2i
        if input_image is not None:
            # Convert tensor to base64
            img_np = (input_image[0].cpu().numpy() * 255).astype(np.uint8)
            img = Image.fromarray(img_np)
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            img_b64 = base64.b64encode(buffer.getvalue()).decode()
            payload["image_url"] = f"data:image/png;base64,{img_b64}"
        
        # Make API request
        headers = {
            "Authorization": f"Key {self.api_key}",
            "Content-Type": "application/json",
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        
        # Get image from response
        if "images" in result and len(result["images"]) > 0:
            img_url = result["images"][0].get("url", "")
            if img_url:
                img_response = requests.get(img_url)
                img = Image.open(BytesIO(img_response.content))
                img_np = np.array(img).astype(np.float32) / 255.0
                img_tensor = torch.from_numpy(img_np).unsqueeze(0)
                
                # Calculate credits (approximate)
                credits = self._estimate_credits(model, width, height)
                
                return (img_tensor, f"{credits:.4f}")
        
        raise ValueError("No image returned from Fal.ai")
    
    def _estimate_credits(self, model, width, height):
        """Estimate credits used based on model and resolution"""
        base_costs = {
            "flux-2-pro": 0.05,
            "flux-1.1-pro": 0.04,
            "flux-schnell": 0.003,
            "kling-v2.5-turbo": 0.08,  # per second
            "seedream-4.5": 0.02,
        }
        base = base_costs.get(model, 0.01)
        # Scale by resolution
        pixels = width * height
        scale = pixels / (1024 * 1024)
        return base * scale
