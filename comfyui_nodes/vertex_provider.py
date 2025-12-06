"""
Vertex AI Provider Node for ComfyUI

Generates images and videos using Google Vertex AI.
Supports: Imagen 3, Veo, and other Google models.
"""

import os
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import torch

try:
    from google.cloud import aiplatform
    from google.cloud.aiplatform.gapic import PredictionServiceClient
    HAS_GOOGLE_CLOUD = True
except ImportError:
    HAS_GOOGLE_CLOUD = False


class VertexProviderNode:
    """Generate images via Google Vertex AI"""
    
    CATEGORY = "CinemaOS/Cloud"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "prompt": ("STRING", {"multiline": True}),
                "model": (["imagen-4", "imagen-4-fast", "veo-3.1"], {"default": "imagen-4-fast"}),
                "width": ("INT", {"default": 1024, "min": 256, "max": 4096}),
                "height": ("INT", {"default": 1024, "min": 256, "max": 4096}),
            },
            "optional": {
                "negative_prompt": ("STRING", {"multiline": True}),
                "seed": ("INT", {"default": -1}),
                "num_images": ("INT", {"default": 1, "min": 1, "max": 4}),
                "input_image": ("IMAGE",),
            }
        }
    
    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("image", "credits_used")
    FUNCTION = "generate"
    
    def __init__(self):
        self.project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
        self.location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    
    def generate(self, prompt, model, width, height,
                 negative_prompt="", seed=-1, num_images=1, input_image=None):
        
        if not HAS_GOOGLE_CLOUD:
            raise ImportError("google-cloud-aiplatform package not installed")
        
        if not self.project_id:
            raise ValueError("GOOGLE_CLOUD_PROJECT environment variable not set")
        
        # Initialize Vertex AI
        aiplatform.init(project=self.project_id, location=self.location)
        
        # Build request based on model type
        if model.startswith("imagen"):
            return self._generate_imagen(prompt, model, width, height, 
                                         negative_prompt, seed, num_images, input_image)
        elif model.startswith("veo"):
            return self._generate_veo(prompt, model, width, height, seed, input_image)
        else:
            raise ValueError(f"Unknown model: {model}")
    
    def _generate_imagen(self, prompt, model, width, height, 
                         negative_prompt, seed, num_images, input_image):
        """Generate image with Imagen"""
        from vertexai.preview.vision_models import ImageGenerationModel
        
        imagen = ImageGenerationModel.from_pretrained(model)
        
        parameters = {
            "number_of_images": num_images,
            "aspect_ratio": self._get_aspect_ratio(width, height),
        }
        
        if negative_prompt:
            parameters["negative_prompt"] = negative_prompt
        if seed >= 0:
            parameters["seed"] = seed
        
        # Generate
        if input_image is not None:
            # Convert tensor to PIL for edit mode
            img_np = (input_image[0].cpu().numpy() * 255).astype(np.uint8)
            base_image = Image.fromarray(img_np)
            response = imagen.edit_image(
                prompt=prompt,
                base_image=base_image,
                **parameters
            )
        else:
            response = imagen.generate_images(
                prompt=prompt,
                **parameters
            )
        
        # Get first image
        if response.images:
            img = response.images[0]._pil_image
            img_np = np.array(img).astype(np.float32) / 255.0
            img_tensor = torch.from_numpy(img_np).unsqueeze(0)
            
            credits = self._estimate_credits(model, width, height)
            return (img_tensor, f"{credits:.4f}")
        
        raise ValueError("No image returned from Vertex AI")
    
    def _generate_veo(self, prompt, model, width, height, seed, input_image):
        """Generate video with Veo - returns first frame as image"""
        # Note: Full video would require different handling
        raise NotImplementedError("Veo video generation requires video output handling")
    
    def _get_aspect_ratio(self, width, height):
        """Convert dimensions to Imagen aspect ratio string"""
        ratio = width / height
        if ratio > 1.6:
            return "16:9"
        elif ratio < 0.6:
            return "9:16"
        elif ratio > 1.2:
            return "4:3"
        elif ratio < 0.8:
            return "3:4"
        else:
            return "1:1"
    
    def _estimate_credits(self, model, width, height):
        """Estimate credits based on model"""
        costs = {
            "imagen-4": 0.04,
            "imagen-4-fast": 0.02,
            "veo-3.1": 0.50,  # per second
        }
        return costs.get(model, 0.02)
