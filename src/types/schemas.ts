/**
 * Zod Schemas for Runtime Validation
 * 
 * Based on documentation research (Zod v5.5+):
 * - 2kb gzipped core
 * - TypeScript-first with static type inference
 * - Zero external dependencies
 * 
 * These schemas validate API responses from Tauri backend.
 * @see https://zod.dev/
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// Script Context Schemas
// ═══════════════════════════════════════════════════════════════════════════════

export const ScriptContextSchema = z.object({
  full_text: z.string(),
  selection: z.string().optional(),
  cursor_line: z.number().int().positive().optional(),
  current_scene: z.string().optional(),
  scene_characters: z.array(z.string()),
  current_element: z.string().optional(),
});

export type ScriptContextValidated = z.infer<typeof ScriptContextSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// Agent API Schemas
// ═══════════════════════════════════════════════════════════════════════════════

export const AgentRoleSchema = z.enum([
  'showrunner',
  'scriptwriter', 
  'cinematographer',
  'casting_director',
  'art_director',
  'voice_actors',
  'music_sfx_director',
  'photography_director',
  'camera_director',
  'editor',
  'colorist',
]);

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ActionResultSchema = z.object({
  success: z.boolean(),
  action_type: z.string(),
  execution_id: z.string().optional(),
  data: z.string().optional(),
  error: z.string().optional(),
  credits_used: z.number().optional(),
});

export const FullAgentResponseSchema = z.object({
  message: z.string(),
  agent_role: z.string(),
  model_used: z.string(),
  actions: z.array(z.unknown()), // AgentAction is a complex union
  action_results: z.array(ActionResultSchema),
  tokens_used: z.number().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Configuration Schemas
// ═══════════════════════════════════════════════════════════════════════════════

export const SceneNumbersConfigSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(['left', 'right', 'both']),
  format: z.enum(['numeric', 'letter', 'dotted']),
  startNumber: z.number().int().min(1),
});

export const MoresContinuedsConfigSchema = z.object({
  enabled: z.boolean(),
  showMore: z.boolean(),
  showContd: z.boolean(),
  showContinued: z.boolean(),
  moreText: z.string(),
  contdText: z.string(),
  continuedText: z.string(),
});

export const RevisionConfigSchema = z.object({
  enabled: z.boolean(),
  currentColor: z.enum(['blue', 'pink', 'yellow', 'green', 'salmon', 'cherry', 'tan', 'goldenrod', 'buff', 'white']),
  showRevisionMarks: z.boolean(),
  dateStamp: z.boolean(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI Model Schemas (from research: GPT-5, Kling O1, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

export const AIModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(['openai', 'anthropic', 'google', 'kling', 'fal', 'local']),
  inputCostPer1K: z.number().optional(),
  outputCostPer1K: z.number().optional(),
  maxTokens: z.number().int().optional(),
  capabilities: z.array(z.enum(['text', 'image', 'video', 'audio', 'code'])).optional(),
});

export const CostEstimateSchema = z.object({
  credits: z.number(),
  breakdown: z.record(z.string(), z.number()).optional(),
  warnings: z.array(z.string()).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Vault Token Schemas (SurrealDB data)
// ═══════════════════════════════════════════════════════════════════════════════

export const TokenSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  has_reference_images: z.boolean(),
  has_lora: z.boolean(),
});

export const VaultTokenContextSchema = z.object({
  characters: z.array(TokenSummarySchema),
  locations: z.array(TokenSummarySchema),
  props: z.array(TokenSummarySchema),
  style_notes: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Safely parse and validate API response
 * Returns validated data or throws ZodError
 */
export function validateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe parse that returns result object (no throw)
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
