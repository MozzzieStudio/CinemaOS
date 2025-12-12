/**
 * PyO3 Bridge Types
 * 
 * Based on research: https://pyo3.rs/ (v0.27.2)
 * 
 * PyO3 provides Rust-Python bindings for:
 * - Calling Python from Rust
 * - Creating Python extensions in Rust
 * - Type-safe data exchange
 * 
 * This module defines TypeScript types that correspond to
 * the Rust-Python bridge for ComfyUI workflow execution.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COMFYUI WORKFLOW TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type NodeId = string;
export type WidgetValue = string | number | boolean | string[] | number[];

export interface ComfyNode {
  id: NodeId;
  type: string;
  inputs: Record<string, NodeInput>;
  widgets: Record<string, WidgetValue>;
  position: [number, number];
  order?: number;
}

export interface NodeInput {
  link: NodeId | null;
  outputIndex?: number;
}

export interface ComfyWorkflow {
  nodes: Record<NodeId, ComfyNode>;
  links: WorkflowLink[];
  version: string;
  extra?: Record<string, unknown>;
}

export interface WorkflowLink {
  id: number;
  sourceNode: NodeId;
  sourceOutput: number;
  targetNode: NodeId;
  targetInput: string;
  type: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExecutionRequest {
  workflowId: string;
  workflow: ComfyWorkflow;
  clientId: string;
  extraData?: Record<string, unknown>;
}

export interface ExecutionStatus {
  requestId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentNode?: NodeId;
  progress?: number;
  eta?: number; // seconds remaining
  error?: string;
}

export interface ExecutionResult {
  requestId: string;
  outputs: Record<NodeId, NodeOutput[]>;
  executionTime: number; // ms
}

export interface NodeOutput {
  type: 'image' | 'video' | 'audio' | 'latent' | 'text' | 'mask';
  format: string;
  data?: string; // base64 for small outputs
  path?: string; // file path for large outputs
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BRIDGE COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface PyBridgeMessage {
  type: 'execute' | 'cancel' | 'status' | 'preview' | 'interrupt' | 'queue_prompt';
  payload: unknown;
  requestId: string;
}

export interface PyBridgeResponse {
  type: 'progress' | 'executing' | 'executed' | 'error' | 'preview' | 'status';
  requestId: string;
  data: unknown;
}

export interface PyBridgeConfig {
  pythonPath: string;
  comfyuiPath: string;
  modelsPath: string;
  outputPath: string;
  tempPath: string;
  gpuIndex: number;
  maxQueueSize: number;
  previewFormat: 'jpeg' | 'png';
  previewQuality: number; // 1-100
}

export const DEFAULT_BRIDGE_CONFIG: PyBridgeConfig = {
  pythonPath: 'python',
  comfyuiPath: './comfyui',
  modelsPath: './models',
  outputPath: './output',
  tempPath: './temp',
  gpuIndex: 0,
  maxQueueSize: 10,
  previewFormat: 'jpeg',
  previewQuality: 80,
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON COMFYUI NODES
// ═══════════════════════════════════════════════════════════════════════════════

export type ComfyNodeType = 
  // Loaders
  | 'CheckpointLoaderSimple' | 'LoraLoader' | 'LoadImage' | 'LoadVideo'
  // Encoders
  | 'CLIPTextEncode' | 'VAEEncode' | 'VAEDecode'
  // Samplers
  | 'KSampler' | 'KSamplerAdvanced' | 'SamplerCustom'
  // Latent
  | 'EmptyLatentImage' | 'LatentUpscale' | 'LatentComposite'
  // Image
  | 'SaveImage' | 'PreviewImage' | 'ImageScale' | 'ImageBlend'
  // Conditioning
  | 'ConditioningCombine' | 'ConditioningSetArea' | 'ControlNetApply'
  // Masking
  | 'MaskToImage' | 'ImageToMask' | 'MaskComposite';

export interface NodeDefinition {
  type: ComfyNodeType;
  inputs: { name: string; type: string; optional?: boolean }[];
  outputs: { name: string; type: string }[];
  widgets: { name: string; type: string; default?: WidgetValue }[];
  category: string;
}

// Common samplers
export const SAMPLERS = [
  'euler', 'euler_ancestral', 'heun', 'heunpp2', 'dpm_2', 'dpm_2_ancestral',
  'lms', 'dpm_fast', 'dpm_adaptive', 'dpmpp_2s_ancestral', 'dpmpp_sde',
  'dpmpp_sde_gpu', 'dpmpp_2m', 'dpmpp_2m_sde', 'dpmpp_2m_sde_gpu',
  'dpmpp_3m_sde', 'dpmpp_3m_sde_gpu', 'ddpm', 'lcm', 'ddim', 'uni_pc',
  'uni_pc_bh2',
] as const;

export type SamplerName = typeof SAMPLERS[number];

// Common schedulers
export const SCHEDULERS = [
  'normal', 'karras', 'exponential', 'sgm_uniform', 'simple', 'ddim_uniform',
  'beta',
] as const;

export type SchedulerName = typeof SCHEDULERS[number];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate unique node ID
 */
export function generateNodeId(): NodeId {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a basic text-to-image workflow
 */
export function createTextToImageWorkflow(
  prompt: string,
  negativePrompt: string = '',
  checkpoint: string = 'v1-5-pruned-emaonly.safetensors',
  width: number = 512,
  height: number = 512,
  steps: number = 20,
  cfg: number = 7.0,
  seed: number = -1
): ComfyWorkflow {
  const checkpointId = generateNodeId();
  const positiveId = generateNodeId();
  const negativeId = generateNodeId();
  const latentId = generateNodeId();
  const samplerId = generateNodeId();
  const decodeId = generateNodeId();
  const saveId = generateNodeId();
  
  return {
    nodes: {
      [checkpointId]: {
        id: checkpointId,
        type: 'CheckpointLoaderSimple',
        inputs: {},
        widgets: { ckpt_name: checkpoint },
        position: [0, 0],
        order: 0,
      },
      [positiveId]: {
        id: positiveId,
        type: 'CLIPTextEncode',
        inputs: { clip: { link: checkpointId, outputIndex: 1 } },
        widgets: { text: prompt },
        position: [300, 0],
        order: 1,
      },
      [negativeId]: {
        id: negativeId,
        type: 'CLIPTextEncode',
        inputs: { clip: { link: checkpointId, outputIndex: 1 } },
        widgets: { text: negativePrompt },
        position: [300, 200],
        order: 2,
      },
      [latentId]: {
        id: latentId,
        type: 'EmptyLatentImage',
        inputs: {},
        widgets: { width, height, batch_size: 1 },
        position: [300, 400],
        order: 3,
      },
      [samplerId]: {
        id: samplerId,
        type: 'KSampler',
        inputs: {
          model: { link: checkpointId, outputIndex: 0 },
          positive: { link: positiveId, outputIndex: 0 },
          negative: { link: negativeId, outputIndex: 0 },
          latent_image: { link: latentId, outputIndex: 0 },
        },
        widgets: {
          seed: seed === -1 ? Math.floor(Math.random() * 2 ** 32) : seed,
          steps,
          cfg,
          sampler_name: 'euler',
          scheduler: 'normal',
          denoise: 1.0,
        },
        position: [600, 100],
        order: 4,
      },
      [decodeId]: {
        id: decodeId,
        type: 'VAEDecode',
        inputs: {
          samples: { link: samplerId, outputIndex: 0 },
          vae: { link: checkpointId, outputIndex: 2 },
        },
        widgets: {},
        position: [900, 100],
        order: 5,
      },
      [saveId]: {
        id: saveId,
        type: 'SaveImage',
        inputs: { images: { link: decodeId, outputIndex: 0 } },
        widgets: { filename_prefix: 'CinemaOS' },
        position: [1200, 100],
        order: 6,
      },
    },
    links: [],
    version: '1.0',
  };
}
