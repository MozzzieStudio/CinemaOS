"""
Credit Tracker Node for ComfyUI

Tracks credit usage for cloud generation and reports to CinemaOS.
"""

import os
import json
import requests
from datetime import datetime


class CreditTrackerNode:
    """Track and report credit usage"""
    
    CATEGORY = "CinemaOS/Utility"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "credits_used": ("STRING",),  # From provider nodes
                "model_name": ("STRING", {"default": "unknown"}),
            },
            "optional": {
                "vault_url": ("STRING", {"default": "http://localhost:8080"}),
                "project_id": ("STRING", {"default": ""}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("total_credits", "status")
    FUNCTION = "track_credits"
    OUTPUT_NODE = True
    
    # Class-level credit accumulator
    _session_credits = 0.0
    
    def track_credits(self, credits_used, model_name, 
                      vault_url="http://localhost:8080",
                      project_id="", unique_id=None):
        """
        Track credit usage and report to CinemaOS.
        Returns cumulative credits for this session.
        """
        
        # Parse credits
        try:
            credits = float(credits_used)
        except (ValueError, TypeError):
            credits = 0.0
        
        # Accumulate
        CreditTrackerNode._session_credits += credits
        
        # Report to Vault
        try:
            payload = {
                "credits": credits,
                "model": model_name,
                "project_id": project_id,
                "timestamp": datetime.utcnow().isoformat(),
                "node_id": unique_id,
            }
            
            response = requests.post(
                f"{vault_url}/api/credits/usage",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                status = "reported"
            else:
                status = "local_only"
                
        except requests.RequestException:
            status = "offline"
        
        return (
            f"{CreditTrackerNode._session_credits:.4f}",
            status
        )
    
    @classmethod
    def reset_session_credits(cls):
        """Reset session credit counter"""
        cls._session_credits = 0.0
    
    @classmethod
    def get_session_credits(cls):
        """Get current session credits"""
        return cls._session_credits
