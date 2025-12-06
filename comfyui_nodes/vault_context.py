"""
Vault Context Node for ComfyUI

Loads character, location, or prop context from the CinemaOS Vault.
Provides consistent prompting based on stored token data.
"""

import json
import requests
from typing import Optional


class VaultContextNode:
    """Load context from CinemaOS Vault"""
    
    CATEGORY = "CinemaOS/Vault"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "token_type": (["character", "location", "prop"], {"default": "character"}),
                "token_name": ("STRING", {"default": ""}),
            },
            "optional": {
                "vault_url": ("STRING", {"default": "http://localhost:8080"}),
                "include_visuals": ("BOOLEAN", {"default": True}),
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("prompt_context", "style_prompt", "reference_image_path")
    FUNCTION = "load_context"
    
    def load_context(self, token_type, token_name, vault_url="http://localhost:8080", include_visuals=True):
        """
        Load token context from the Vault.
        Returns prompt context, style guidance, and reference image path.
        """
        
        if not token_name:
            return ("", "", "")
        
        try:
            # Query the Vault for this token
            response = requests.get(
                f"{vault_url}/api/tokens/{token_type}/{token_name}",
                timeout=5
            )
            
            if response.status_code != 200:
                # Token not found, return empty
                return ("", "", "")
            
            token_data = response.json()
            
            # Build prompt context from token data
            prompt_context = self._build_prompt_context(token_type, token_data)
            
            # Get style prompt if available
            style_prompt = token_data.get("style_prompt", "")
            
            # Get reference image if visuals included
            reference_path = ""
            if include_visuals and token_data.get("visuals"):
                visuals = token_data["visuals"]
                if visuals:
                    reference_path = visuals[0].get("path", "")
            
            return (prompt_context, style_prompt, reference_path)
            
        except requests.RequestException:
            # Vault not available, return empty
            return ("", "", "")
    
    def _build_prompt_context(self, token_type, token_data):
        """Build a prompt context string from token data"""
        
        name = token_data.get("name", "")
        description = token_data.get("description", "")
        
        if token_type == "character":
            # Build character description
            age = token_data.get("age", "")
            appearance = token_data.get("appearance", "")
            clothing = token_data.get("clothing", "")
            
            parts = [f"{name}"]
            if age:
                parts.append(f"{age} years old")
            if appearance:
                parts.append(appearance)
            if clothing:
                parts.append(f"wearing {clothing}")
            if description:
                parts.append(description)
            
            return ", ".join(parts)
        
        elif token_type == "location":
            # Build location description
            setting = token_data.get("setting", "")
            time_of_day = token_data.get("time_of_day", "")
            weather = token_data.get("weather", "")
            
            parts = [name]
            if setting:
                parts.append(setting)
            if time_of_day:
                parts.append(f"during {time_of_day}")
            if weather:
                parts.append(f"{weather} weather")
            if description:
                parts.append(description)
            
            return ", ".join(parts)
        
        elif token_type == "prop":
            # Build prop description
            material = token_data.get("material", "")
            color = token_data.get("color", "")
            
            parts = [name]
            if color:
                parts.append(color)
            if material:
                parts.append(f"made of {material}")
            if description:
                parts.append(description)
            
            return ", ".join(parts)
        
        return f"{name}, {description}" if description else name
