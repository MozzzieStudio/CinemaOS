/**
 * FFmpeg Configuration and Types
 * 
 * Based on research: https://www.ffmpeg.org/ (v8.0 "Huffman")
 * 
 * Features:
 * - Native VVC decoder
 * - Vulkan decoding
 * - xHE-AAC support
 * - Multi-threaded CLI tools
 * 
 * This module provides TypeScript types for FFmpeg operations via Tauri.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CODEC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type VideoCodec = 
  | 'h264' | 'h265' | 'hevc' | 'vvc' | 'av1' 
  | 'vp8' | 'vp9' | 'prores' | 'dnxhd' | 'mjpeg';

export type AudioCodec = 
  | 'aac' | 'xhe-aac' | 'mp3' | 'opus' | 'flac' 
  | 'pcm_s16le' | 'pcm_s24le' | 'pcm_f32le' | 'ac3' | 'eac3';

export type ContainerFormat = 
  | 'mp4' | 'mov' | 'mkv' | 'webm' | 'avi' 
  | 'mxf' | 'ts' | 'flv' | 'gif';

export type PixelFormat = 
  | 'yuv420p' | 'yuv422p' | 'yuv444p' | 'yuv420p10le' 
  | 'rgb24' | 'rgba' | 'nv12';

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA INFO
// ═══════════════════════════════════════════════════════════════════════════════

export interface MediaInfo {
  path: string;
  format: string;
  duration: number; // seconds
  bitRate: number; // bits per second
  streams: StreamInfo[];
}

export interface StreamInfo {
  index: number;
  type: 'video' | 'audio' | 'subtitle' | 'data';
  codec: string;
  codecLongName: string;
  profile?: string;
  bitRate?: number;
}

export interface VideoStreamInfo extends StreamInfo {
  type: 'video';
  width: number;
  height: number;
  frameRate: number;
  pixelFormat: PixelFormat;
  colorSpace?: string;
  colorRange?: 'limited' | 'full';
  bitDepth?: number;
}

export interface AudioStreamInfo extends StreamInfo {
  type: 'audio';
  sampleRate: number;
  channels: number;
  channelLayout: string;
  bitsPerSample?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCODING OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface VideoEncodingOptions {
  codec: VideoCodec;
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow' | 'placebo';
  crf?: number; // 0-51 for H.264/H.265, lower = better quality
  bitrate?: string; // e.g., "5M", "10000k"
  maxBitrate?: string;
  bufSize?: string;
  width?: number;
  height?: number;
  frameRate?: number;
  pixelFormat?: PixelFormat;
  profile?: string;
  level?: string;
  // Hardware acceleration
  hwAccel?: 'none' | 'cuda' | 'nvenc' | 'qsv' | 'amf' | 'videotoolbox' | 'vaapi' | 'vulkan';
}

export interface AudioEncodingOptions {
  codec: AudioCodec;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  profile?: string;
}

export interface EncodingJob {
  id: string;
  inputPath: string;
  outputPath: string;
  videoOptions?: VideoEncodingOptions;
  audioOptions?: AudioEncodingOptions;
  container: ContainerFormat;
  startTime?: number;
  endTime?: number;
  metadata?: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER GRAPHS
// ═══════════════════════════════════════════════════════════════════════════════

export interface FilterNode {
  name: string;
  params: Record<string, string | number | boolean>;
}

export interface FilterChain {
  inputs: string[];
  filters: FilterNode[];
  outputs: string[];
}

export interface FilterGraph {
  chains: FilterChain[];
}

// Common filter presets
export const FILTER_PRESETS = {
  // Scale while preserving aspect ratio
  scale720p: (input: string): FilterChain => ({
    inputs: [input],
    filters: [{ name: 'scale', params: { w: 1280, h: 720, force_original_aspect_ratio: 'decrease' } }],
    outputs: ['scaled'],
  }),
  
  scale1080p: (input: string): FilterChain => ({
    inputs: [input],
    filters: [{ name: 'scale', params: { w: 1920, h: 1080, force_original_aspect_ratio: 'decrease' } }],
    outputs: ['scaled'],
  }),
  
  scale4k: (input: string): FilterChain => ({
    inputs: [input],
    filters: [{ name: 'scale', params: { w: 3840, h: 2160, force_original_aspect_ratio: 'decrease' } }],
    outputs: ['scaled'],
  }),
  
  // Color correction
  colorCorrect: (input: string, brightness: number, contrast: number, saturation: number): FilterChain => ({
    inputs: [input],
    filters: [{ name: 'eq', params: { brightness, contrast, saturation } }],
    outputs: ['corrected'],
  }),
  
  // LUT application
  applyLUT: (input: string, lutPath: string): FilterChain => ({
    inputs: [input],
    filters: [{ name: 'lut3d', params: { file: lutPath } }],
    outputs: ['graded'],
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS AND STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EncodingProgress {
  jobId: string;
  frame: number;
  totalFrames: number;
  fps: number;
  bitrate: string;
  size: number; // bytes
  time: number; // seconds processed
  speed: number; // x realtime
  percent: number;
}

export type EncodingStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface EncodingResult {
  jobId: string;
  status: EncodingStatus;
  outputPath?: string;
  duration: number; // ms to complete
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create encoding job for web delivery (H.264 + AAC)
 */
export function createWebJob(inputPath: string, outputPath: string): EncodingJob {
  return {
    id: crypto.randomUUID(),
    inputPath,
    outputPath,
    container: 'mp4',
    videoOptions: {
      codec: 'h264',
      preset: 'medium',
      crf: 23,
      pixelFormat: 'yuv420p',
    },
    audioOptions: {
      codec: 'aac',
      bitrate: '192k',
    },
  };
}

/**
 * Create encoding job for archival (ProRes)
 */
export function createArchivalJob(inputPath: string, outputPath: string): EncodingJob {
  return {
    id: crypto.randomUUID(),
    inputPath,
    outputPath,
    container: 'mov',
    videoOptions: {
      codec: 'prores',
      profile: '3', // ProRes 422 HQ
    },
    audioOptions: {
      codec: 'pcm_s24le',
    },
  };
}

/**
 * Create encoding job for social media (H.264, optimized)
 */
export function createSocialJob(inputPath: string, outputPath: string, maxWidth: number = 1080): EncodingJob {
  return {
    id: crypto.randomUUID(),
    inputPath,
    outputPath,
    container: 'mp4',
    videoOptions: {
      codec: 'h264',
      preset: 'fast',
      crf: 22,
      pixelFormat: 'yuv420p',
      width: maxWidth,
    },
    audioOptions: {
      codec: 'aac',
      bitrate: '128k',
    },
  };
}

/**
 * Estimate output file size (rough estimate)
 */
export function estimateFileSize(
  durationSeconds: number,
  videoBitrate: number, // kbps
  audioBitrate: number = 192 // kbps
): number {
  const totalBitrate = videoBitrate + audioBitrate;
  return (totalBitrate * 1000 * durationSeconds) / 8; // bytes
}
