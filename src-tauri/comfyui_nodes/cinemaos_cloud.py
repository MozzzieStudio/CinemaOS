import os
import requests
import torch
import numpy as np
from PIL import Image
import io

# Try to import fal_client
try:
    import fal_client
except ImportError:
    fal_client = None

class FalProvider:
    """
    CinemaOS Adapter for Fal.ai Cloud Generation.
    Executes generation on Fal.ai and returns the image/video to the workflow.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "prompt": ("STRING", {"multiline": True}),
                "model": ("STRING", {"default": "flux-pro"}),
                "width": ("INT", {"default": 1024, "min": 256, "max": 4096}),
                "height": ("INT", {"default": 1024, "min": 256, "max": 4096}),
            },
            "optional": {
                "negative_prompt": ("STRING", {"multiline": True}),
                "seed": ("INT", {"default": -1}),
                "num_steps": ("INT", {"default": 28}),
                "guidance_scale": ("FLOAT", {"default": 7.5}),
                "input_image": ("STRING", {"default": ""}), 
                "seconds": ("INT", {"default": 5}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("image", "url")
    FUNCTION = "generate"
    CATEGORY = "CinemaOS/Cloud"

    def generate(self, prompt, model, width, height, negative_prompt="", seed=-1, num_steps=28, guidance_scale=7.5, input_image="", seconds=5):
        if not fal_client:
            print("[CinemaOS] fal_client not found. Cloud generation skipped.")
            # Return blank image
            blank = torch.zeros((1, height, width, 3), dtype=torch.float32)
            return (blank, "")

        print(f"[CinemaOS] Generating on Fal with {model}...")
        
        # Map model IDs to Fal Endpoints
        endpoint = "fal-ai/flux-pro/v1.1-ultra" # Default to best
        if "flux-schnell" in model:
            endpoint = "fal-ai/flux/schnell"
        elif "kling" in model:
            endpoint = "fal-ai/kling-video/v1/standard/text-to-video"

        arguments = {
            "prompt": prompt,
            "image_size": {
                "width": width,
                "height": height
            },
            "num_inference_steps": num_steps,
            "guidance_scale": guidance_scale,
            "seed": seed if seed != -1 else None,
            "enable_safety_checker": False
        }

        # Handling Result
        try:
            handler = fal_client.submit(endpoint, arguments)
            result = handler.get()
        except Exception as e:
            print(f"[CinemaOS] Fal Error: {e}")
            blank = torch.zeros((1, height, width, 3), dtype=torch.float32)
            return (blank, "")

        # Extract Image URL (Flux returns 'images': [{'url': ...}])
        image_url = ""
        if 'images' in result and len(result['images']) > 0:
            image_url = result['images'][0]['url']
        elif 'video' in result:
             # Handle video logic (download first frame for preview)
             image_url = result['video']['url'] # Simplification
        
        if not image_url:
             blank = torch.zeros((1, height, width, 3), dtype=torch.float32)
             return (blank, "")

        # Download and convert to Tensor
        try:
            response = requests.get(image_url)
            img = Image.open(io.BytesIO(response.content)).convert("RGB")
            img = np.array(img).astype(np.float32) / 255.0
            img_tensor = torch.from_numpy(img)[None,]
            return (img_tensor, image_url)
        except Exception as e:
            print(f"[CinemaOS] Failed to download result: {e}")
            blank = torch.zeros((1, height, width, 3), dtype=torch.float32)
            return (blank, "")

class CreditTracker:
    """
    Tracks credits used for cloud generation.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "credits_used": ("STRING", {"forceInput": True}),
                "model_name": ("STRING", {"default": ""}),
            }
        }
    
    RETURN_TYPES = ()
    FUNCTION = "track"
    CATEGORY = "CinemaOS/Cloud"
    OUTPUT_NODE = True

    def track(self, credits_used, model_name):
        # In a real app, this would write to a DB or send an event
        print(f"[CinemaOS] Credits charged for {model_name}: {credits_used}")
        return ()

class VaultSave:
    """
    Saves cloud-generated assets to the Vault.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "image": ("IMAGE", ),
                "token_type": ("STRING", {"default": "shot"}),
                "token_name": ("STRING", {"default": ""}),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "save"
    CATEGORY = "CinemaOS/Standard"
    OUTPUT_NODE = True

    def save(self, image, token_type, token_name):
        # Placeholder for Vault logic
        print(f"[CinemaOS] Saving to Vault: {token_type}/{token_name}")
        return ()

NODE_CLASS_MAPPINGS = {
    "FalProvider": FalProvider,
    "CreditTracker": CreditTracker,
    "VaultSave": VaultSave
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FalProvider": "Fal.ai Provider",
    "CreditTracker": "Credit Tracker",
    "VaultSave": "Save to Vault"
}
