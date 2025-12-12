/**
 * OpenTimelineIO (OTIO) Interchange Utilities
 * 
 * Based on research: https://opentimelineio.readthedocs.io/
 * 
 * OTIO is a modern EDL format for editorial cut information.
 * This module provides TypeScript utilities for OTIO interchange.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// OTIO SCHEMA TYPES (v0.17+)
// ═══════════════════════════════════════════════════════════════════════════════

export interface RationalTime {
  value: number;
  rate: number;
}

export interface TimeRange {
  start_time: RationalTime;
  duration: RationalTime;
}

export interface ExternalReference {
  OTIO_SCHEMA: 'ExternalReference.1';
  target_url: string;
  available_range?: TimeRange;
}

export interface Clip {
  OTIO_SCHEMA: 'Clip.2';
  name: string;
  source_range?: TimeRange;
  media_reference?: ExternalReference | null;
  metadata?: Record<string, unknown>;
}

export interface Gap {
  OTIO_SCHEMA: 'Gap.1';
  name?: string;
  source_range: TimeRange;
}

export interface Transition {
  OTIO_SCHEMA: 'Transition.1';
  name?: string;
  transition_type: string;
  in_offset: RationalTime;
  out_offset: RationalTime;
}

export type TrackItem = Clip | Gap | Transition;

export interface Track {
  OTIO_SCHEMA: 'Track.1';
  name: string;
  kind: 'Video' | 'Audio';
  children: TrackItem[];
  source_range?: TimeRange;
  metadata?: Record<string, unknown>;
}

export interface Stack {
  OTIO_SCHEMA: 'Stack.1';
  name: string;
  children: Track[];
  source_range?: TimeRange;
}

export interface Timeline {
  OTIO_SCHEMA: 'Timeline.1';
  name: string;
  global_start_time?: RationalTime;
  tracks: Stack;
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a RationalTime at the given frame rate
 */
export function createRationalTime(frames: number, rate: number = 24): RationalTime {
  return { value: frames, rate };
}

/**
 * Create a TimeRange from start and duration
 */
export function createTimeRange(startFrames: number, durationFrames: number, rate: number = 24): TimeRange {
  return {
    start_time: createRationalTime(startFrames, rate),
    duration: createRationalTime(durationFrames, rate),
  };
}

/**
 * Convert seconds to RationalTime
 */
export function secondsToRationalTime(seconds: number, rate: number = 24): RationalTime {
  return { value: Math.round(seconds * rate), rate };
}

/**
 * Convert RationalTime to seconds
 */
export function rationalTimeToSeconds(rt: RationalTime): number {
  return rt.value / rt.rate;
}

/**
 * Create a basic video clip
 */
export function createClip(
  name: string,
  mediaUrl: string,
  startFrame: number,
  durationFrames: number,
  rate: number = 24
): Clip {
  return {
    OTIO_SCHEMA: 'Clip.2',
    name,
    source_range: createTimeRange(startFrame, durationFrames, rate),
    media_reference: {
      OTIO_SCHEMA: 'ExternalReference.1',
      target_url: mediaUrl,
    },
  };
}

/**
 * Create a gap (empty space)
 */
export function createGap(durationFrames: number, rate: number = 24): Gap {
  return {
    OTIO_SCHEMA: 'Gap.1',
    source_range: createTimeRange(0, durationFrames, rate),
  };
}

/**
 * Create a video track
 */
export function createVideoTrack(name: string, items: TrackItem[]): Track {
  return {
    OTIO_SCHEMA: 'Track.1',
    name,
    kind: 'Video',
    children: items,
  };
}

/**
 * Create an audio track
 */
export function createAudioTrack(name: string, items: TrackItem[]): Track {
  return {
    OTIO_SCHEMA: 'Track.1',
    name,
    kind: 'Audio',
    children: items,
  };
}

/**
 * Create a complete timeline
 */
export function createTimeline(
  name: string,
  tracks: Track[],
  rate: number = 24
): Timeline {
  return {
    OTIO_SCHEMA: 'Timeline.1',
    name,
    global_start_time: createRationalTime(0, rate),
    tracks: {
      OTIO_SCHEMA: 'Stack.1',
      name: 'tracks',
      children: tracks,
    },
  };
}

/**
 * Serialize timeline to OTIO JSON
 */
export function serializeToOTIO(timeline: Timeline): string {
  return JSON.stringify(timeline, null, 2);
}

/**
 * Parse OTIO JSON to timeline
 */
export function parseOTIO(json: string): Timeline {
  const parsed = JSON.parse(json);
  if (parsed.OTIO_SCHEMA !== 'Timeline.1') {
    throw new Error('Invalid OTIO timeline: expected Timeline.1 schema');
  }
  return parsed as Timeline;
}

/**
 * Calculate total duration of a timeline in seconds
 */
export function getTimelineDuration(timeline: Timeline): number {
  const tracks = timeline.tracks.children;
  let maxDuration = 0;

  for (const track of tracks) {
    let trackDuration = 0;
    for (const item of track.children) {
      // Transitions don't have source_range, only Clip and Gap do
      if ('source_range' in item && item.source_range) {
        trackDuration += rationalTimeToSeconds(item.source_range.duration);
      }
    }
    maxDuration = Math.max(maxDuration, trackDuration);
  }

  return maxDuration;
}
