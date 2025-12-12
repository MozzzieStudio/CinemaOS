import os
import folder_paths
from PIL import Image, ImageOps
import numpy as np
import torch

class CinemaOS_VaultLoader:
    """
    CinemaOS Vault Loader
    Loads assets directly from absolute paths provided by the CinemaOS backend.
    Bypasses standard ComfyUI folder structures to allow access to the centralized Vault.
    """
    
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
    CATEGORY = "CinemaOS"

    def load_asset(self, asset_path, asset_type):
        if not os.path.exists(asset_path):
            print(f"[CinemaOS] Asset not found: {asset_path}")
            # Return empty black image on failure to prevent crash
            empty = torch.zeros((1, 512, 512, 3), dtype=torch.float32, device="cpu")
            return (empty, torch.zeros((1, 512, 512), dtype=torch.float32, device="cpu"))

        if asset_type == "image":
            return self.load_image(asset_path)
        
        # TODO: Implement LoRA loading logic if needed here, 
        # though usually LoRAs are handled by LoraLoader using model weights.
        # This node might just return the path for a specialized Lora loader.
        
        return self.load_image(asset_path)

    def load_image(self, path):
        img = Image.open(path)
        img = ImageOps.exif_transpose(img)
        
        # Convert to RGB
        if img.mode == 'I':
            img = img.point(lambda i: i * (1 / 255))
        image = img.convert("RGB")
        
        # Normalize to 0-1
        image = np.array(image).astype(np.float32) / 255.0
        image = torch.from_numpy(image)[None,]
        
        # Mask handling
        if 'A' in img.getbands():
            mask = np.array(img.getchannel('A')).astype(np.float32) / 255.0
            mask = 1.0 - torch.from_numpy(mask)
        else:
            mask = torch.zeros((64, 64), dtype=torch.float32, device="cpu")
            
        return (image, mask)

NODE_CLASS_MAPPINGS = {
    "CinemaOS_VaultLoader": CinemaOS_VaultLoader
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CinemaOS_VaultLoader": "CinemaOS Vault Loader"
}
