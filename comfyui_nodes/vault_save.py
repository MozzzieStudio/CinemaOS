"""
Vault Save Node for ComfyUI

Saves generated images/videos back to the CinemaOS Vault.
Links outputs to tokens for consistency tracking.
"""

import os
import uuid
import requests
import base64
from io import BytesIO
from PIL import Image
import numpy as np


class VaultSaveNode:
    """Save outputs to CinemaOS Vault"""
    
    CATEGORY = "CinemaOS/Vault"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "token_type": (["character", "location", "prop", "shot"], {"default": "shot"}),
                "token_name": ("STRING", {"default": ""}),
            },
            "optional": {
                "vault_url": ("STRING", {"default": "http://localhost:8080"}),
                "description": ("STRING", {"multiline": True}),
                "tags": ("STRING", {"default": ""}),
            }
        }
    
    RETURN_TYPES = ("STRING", "IMAGE")
    RETURN_NAMES = ("saved_id", "image")
    FUNCTION = "save_to_vault"
    OUTPUT_NODE = True
    
    def save_to_vault(self, image, token_type, token_name, 
                      vault_url="http://localhost:8080",
                      description="", tags=""):
        """
        Save the generated image to the Vault.
        Returns the saved asset ID and passes through the image.
        """
        
        # Convert tensor to PIL image
        img_np = (image[0].cpu().numpy() * 255).astype(np.uint8)
        pil_image = Image.fromarray(img_np)
        
        # Generate unique filename
        asset_id = str(uuid.uuid4())[:8]
        filename = f"{token_type}_{token_name}_{asset_id}.png" if token_name else f"output_{asset_id}.png"
        
        # Convert to base64 for upload
        buffer = BytesIO()
        pil_image.save(buffer, format="PNG")
        img_b64 = base64.b64encode(buffer.getvalue()).decode()
        
        try:
            # Upload to Vault
            payload = {
                "filename": filename,
                "data": img_b64,
                "token_type": token_type,
                "token_name": token_name,
                "description": description,
                "tags": [t.strip() for t in tags.split(",") if t.strip()],
            }
            
            response = requests.post(
                f"{vault_url}/api/assets/upload",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                saved_id = result.get("id", asset_id)
            else:
                saved_id = f"local:{asset_id}"
                
        except requests.RequestException:
            # Vault not available, save locally
            saved_id = f"local:{asset_id}"
            local_path = os.path.join(os.path.expanduser("~"), "CinemaOS", "outputs", filename)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            pil_image.save(local_path)
        
        return (saved_id, image)
