/**
 * Kira Audio Types and Interfaces
 * 
 * Based on research: https://docs.rs/kira/latest/kira/
 * 
 * Kira is a Rust audio library for games with:
 * - Tweens for smooth property adjustments
 * - Flexible mixer with effects
 * - Clock system for timing
 * - Spatial audio support
 * 
 * This module provides TypeScript types that mirror the Rust API
 * for use in the frontend when controlling audio via Tauri IPC.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SoundId = string;
export type TrackId = string;
export type ClockId = string;

export interface AudioManagerConfig {
  numTracks: number;
  numClocks: number;
  sampleRate: number;
  bufferSize: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioManagerConfig = {
  numTracks: 8,
  numClocks: 4,
  sampleRate: 44100,
  bufferSize: 512,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SoundData {
  id: SoundId;
  path: string;
  volume: number;
  pan: number;
  playbackRate: number;
  loop: boolean;
  startPosition: number; // seconds
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export interface SoundPlaySettings {
  volume?: number | Tween;
  pan?: number | Tween;
  playbackRate?: number | Tween;
  loop?: boolean;
  startPosition?: number;
  track?: TrackId;
}

export type SoundState = 'playing' | 'paused' | 'stopped';

export interface SoundStatus {
  id: SoundId;
  state: SoundState;
  position: number; // current playback position in seconds
  volume: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TWEEN (Smooth Value Changes)
// ═══════════════════════════════════════════════════════════════════════════════

export type EasingFunction = 
  | 'linear'
  | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad'
  | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
  | 'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo';

export interface Tween {
  startValue: number;
  endValue: number;
  duration: number; // seconds
  easing: EasingFunction;
}

export function createTween(
  startValue: number,
  endValue: number,
  duration: number,
  easing: EasingFunction = 'linear'
): Tween {
  return { startValue, endValue, duration, easing };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIXER / TRACKS
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrackConfig {
  id: TrackId;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffect[];
  parentTrack?: TrackId; // for submix routing
}

export type AudioEffectType = 
  | 'reverb'
  | 'delay'
  | 'filter'
  | 'compressor'
  | 'limiter'
  | 'eq'
  | 'distortion'
  | 'chorus';

export interface AudioEffect {
  type: AudioEffectType;
  enabled: boolean;
  wetDryMix: number; // 0-1
  params: Record<string, number>;
}

// Common effect presets
export const REVERB_PRESETS: Record<string, AudioEffect['params']> = {
  room: { roomSize: 0.3, damping: 0.5, predelay: 0.01 },
  hall: { roomSize: 0.8, damping: 0.3, predelay: 0.02 },
  plate: { roomSize: 0.6, damping: 0.7, predelay: 0.005 },
  cathedral: { roomSize: 1.0, damping: 0.2, predelay: 0.03 },
};

// Standard track layout for CinemaOS NLE
export const STANDARD_TRACKS: TrackConfig[] = [
  { id: 'dialogue', name: 'Dialogue', volume: 1, pan: 0, muted: false, solo: false, effects: [] },
  { id: 'music', name: 'Music', volume: 0.7, pan: 0, muted: false, solo: false, effects: [] },
  { id: 'sfx', name: 'SFX', volume: 0.8, pan: 0, muted: false, solo: false, effects: [] },
  { id: 'ambience', name: 'Ambience', volume: 0.5, pan: 0, muted: false, solo: false, effects: [] },
  { id: 'foley', name: 'Foley', volume: 0.7, pan: 0, muted: false, solo: false, effects: [] },
  { id: 'master', name: 'Master', volume: 1, pan: 0, muted: false, solo: false, effects: [] },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CLOCK / TIMING
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClockConfig {
  id: ClockId;
  tempo: number; // BPM
  playing: boolean;
}

export interface ClockTime {
  ticks: number;
  beats: number;
  measures: number;
}

export function ticksToSeconds(ticks: number, tempo: number, ticksPerBeat: number = 480): number {
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  return ticks / ticksPerSecond;
}

export function secondsToTicks(seconds: number, tempo: number, ticksPerBeat: number = 480): number {
  const beatsPerSecond = tempo / 60;
  const ticksPerSecond = beatsPerSecond * ticksPerBeat;
  return Math.round(seconds * ticksPerSecond);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPATIAL AUDIO
// ═══════════════════════════════════════════════════════════════════════════════

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
}

export interface SpatialConfig {
  position: SpatialPosition;
  velocity: SpatialPosition;
  minDistance: number;
  maxDistance: number;
  rolloffFactor: number; // how quickly sound fades with distance
  dopplerFactor: number; // doppler effect intensity
}

export interface ListenerConfig {
  position: SpatialPosition;
  forward: SpatialPosition;
  up: SpatialPosition;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IPC COMMANDS (for Tauri invoke)
// ═══════════════════════════════════════════════════════════════════════════════

export interface AudioCommand {
  type: 'play' | 'pause' | 'stop' | 'seek' | 'setVolume' | 'setPan' | 'setEffect';
  soundId?: SoundId;
  trackId?: TrackId;
  value?: number | Tween | AudioEffect;
}

export interface AudioEvent {
  type: 'soundStarted' | 'soundEnded' | 'soundLooped' | 'error';
  soundId: SoundId;
  timestamp: number;
  error?: string;
}
