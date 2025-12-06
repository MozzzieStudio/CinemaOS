"""
CinemaOS Custom Nodes for ComfyUI

Provides integration with:
- Fal.ai (cloud image/video generation)
- Vertex AI (cloud image/video generation)
- CinemaOS Vault (context and storage)
"""

from .fal_provider import FalProviderNode
from .vertex_provider import VertexProviderNode
from .vault_context import VaultContextNode
from .vault_save import VaultSaveNode
from .credit_tracker import CreditTrackerNode

NODE_CLASS_MAPPINGS = {
    "FalProvider": FalProviderNode,
    "VertexProvider": VertexProviderNode,
    "VaultContext": VaultContextNode,
    "VaultSave": VaultSaveNode,
    "CreditTracker": CreditTrackerNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FalProvider": "Fal.ai Provider",
    "VertexProvider": "Vertex AI Provider",
    "VaultContext": "Vault Context",
    "VaultSave": "Vault Save",
    "CreditTracker": "Credit Tracker",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
