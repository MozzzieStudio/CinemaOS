import nodes
import folder_paths
import comfy.samplers

class CinemaOS_CheckpointLoader:
    """
    CinemaOS Adapter for CheckpointLoaderSimple.
    Standardizes model loading for the CinemaOS ecosystem.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {"ckpt_name": (folder_paths.get_filename_list("checkpoints"), )}}
    
    RETURN_TYPES = ("MODEL", "CLIP", "VAE")
    FUNCTION = "load_checkpoint"
    CATEGORY = "CinemaOS/Standard"

    def load_checkpoint(self, ckpt_name):
        return nodes.CheckpointLoaderSimple().load_checkpoint(ckpt_name)

class CinemaOS_EmptyLatent:
    """
    CinemaOS Adapter for EmptyLatentImage.
    Provides standard latent initialization.
    """
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
    """
    CinemaOS Adapter for CLIPTextEncode.
    """
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
    """
    CinemaOS Adapter for KSampler.
    Exposes the core sampling engine with CinemaOS defaults.
    """
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
        },
        "optional": {
            "motion_bucket_id": ("INT", {"default": 127, "min": 1, "max": 255}),
        }}
    
    RETURN_TYPES = ("LATENT",)
    FUNCTION = "sample"
    CATEGORY = "CinemaOS/Standard"

    def sample(self, model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent_image, denoise, **kwargs):
        # We safely ignore extra parameters like motion_bucket_id for now
        # until we implement specialized video sampling internal logic
        return nodes.KSampler().sample(model, seed, steps, cfg, sampler_name, scheduler, positive, negative, latent_image, denoise)

class CinemaOS_VAEDecode:
    """
    CinemaOS Adapter for VAEDecode.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {"samples": ("LATENT", ), "vae": ("VAE", )}}
    
    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "decode"
    CATEGORY = "CinemaOS/Standard"

    def decode(self, samples, vae):
        return nodes.VAEDecode().decode(samples, vae)

class CinemaOS_SaveImage:
    """
    CinemaOS Adapter for SaveImage.
    Enforces the 'CinemaOS' filename prefix by default to keep the output directory organized.
    """
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

# Mappings are now handled in __init__.py for better package structure
# But we keep them here as local exports
NODE_CLASS_MAPPINGS = {
    "CinemaOS_CheckpointLoader": CinemaOS_CheckpointLoader,
    "CinemaOS_EmptyLatent": CinemaOS_EmptyLatent,
    "CinemaOS_CLIPTextEncode": CinemaOS_CLIPTextEncode,
    "CinemaOS_KSampler": CinemaOS_KSampler,
    "CinemaOS_VAEDecode": CinemaOS_VAEDecode,
    "CinemaOS_SaveImage": CinemaOS_SaveImage,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CinemaOS_CheckpointLoader": "OS Checkpoint Loader",
    "CinemaOS_EmptyLatent": "OS Empty Latent",
    "CinemaOS_CLIPTextEncode": "OS CLIP Text Encode",
    "CinemaOS_KSampler": "OS KSampler",
    "CinemaOS_VAEDecode": "OS VAE Decode",
    "CinemaOS_SaveImage": "OS Save Image",
    "CinemaOS_LoadImage": "OS Load Image",
    "CinemaOS_VAEEncode": "OS VAE Encode",
}

class CinemaOS_VAEEncode:
    """
    CinemaOS Adapter for VAEEncode.
    """
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {
            "pixels": ("IMAGE", ), "vae": ("VAE", )
        }}
    
    RETURN_TYPES = ("LATENT",)
    FUNCTION = "encode"
    CATEGORY = "CinemaOS/Standard"

    def encode(self, pixels, vae):
        return nodes.VAEEncode().encode(pixels, vae)

NODE_CLASS_MAPPINGS["CinemaOS_VAEEncode"] = CinemaOS_VAEEncode


