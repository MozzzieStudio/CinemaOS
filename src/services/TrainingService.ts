
import { toast } from "sonner";
import { Token } from "../types/tokens";

/**
 * TrainingService
 * 
 * Handles Auto-LoRA training triggers.
 * Interfaces with Fal.ai (via server proxy) to train Flux/SDXL LoRAs on Character faces.
 */

export class TrainingService {
  
  static async triggerLoRATraining(token: Token): Promise<string | null> {
    if ((token.visual_refs?.length || 0) < 4) {
      toast.error("Need at least 4 images to train a LoRA.");
      return null;
    }

    // Mock API Call
    return new Promise((resolve) => {
      console.log(`[TrainingService] Starting LoRA training for ${token.name} with ${token.visual_refs.length} images...`);
      
      // Simulate API latency
      setTimeout(() => {
        const mockTrainingId = `lora_${token.slug}_${Date.now()}`;
        toast.success(`Training Started: ${token.name}`);
        console.log(`[TrainingService] Training ID: ${mockTrainingId}`);
        resolve(mockTrainingId);
      }, 1500);
    });
  }

  static async checkStatus(_trainingId: string): Promise<'training' | 'completed' | 'failed'> {
    // Mock Status Check
    return 'training';
  }
}
