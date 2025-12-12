from .nodes import (
    CinemaOS_CheckpointLoader,
    CinemaOS_EmptyLatent,
    CinemaOS_CLIPTextEncode,
    CinemaOS_KSampler,
    CinemaOS_VAEDecode,
    CinemaOS_SaveImage,
    CinemaOS_VaultLoader,
    CinemaOS_LlamaGen,
)

NODE_CLASS_MAPPINGS = {
    "CinemaOS_CheckpointLoader": CinemaOS_CheckpointLoader,
    "CinemaOS_EmptyLatent": CinemaOS_EmptyLatent,
    "CinemaOS_CLIPTextEncode": CinemaOS_CLIPTextEncode,
    "CinemaOS_KSampler": CinemaOS_KSampler,
    "CinemaOS_VAEDecode": CinemaOS_VAEDecode,
    "CinemaOS_SaveImage": CinemaOS_SaveImage,
    "CinemaOS_VaultLoader": CinemaOS_VaultLoader,
    "CinemaOS_LlamaGen": CinemaOS_LlamaGen,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CinemaOS_CheckpointLoader": "OS Checkpoint Loader",
    "CinemaOS_EmptyLatent": "OS Empty Latent",
    "CinemaOS_CLIPTextEncode": "OS CLIP Text Encode",
    "CinemaOS_KSampler": "OS KSampler",
    "CinemaOS_VAEDecode": "OS VAE Decode",
    "CinemaOS_SaveImage": "OS Save Image",
    "CinemaOS_VaultLoader": "OS Vault Loader",
    "CinemaOS_LlamaGen": "OS Llama Gen",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
