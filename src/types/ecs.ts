/**
 * Bevy ECS Component Types
 * 
 * Based on research: https://bevy.org/
 * 
 * Bevy uses Entity-Component-System (ECS) architecture.
 * This module provides TypeScript types that mirror Bevy's
 * component patterns for the NLE timeline.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ECS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type EntityId = string;

/**
 * Base component interface
 */
export interface Component {
  readonly componentType: string;
}

/**
 * Entity with components
 */
export interface Entity<T extends Component = Component> {
  id: EntityId;
  components: Map<string, T>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSFORM COMPONENTS (matching Bevy's Transform)
// ═══════════════════════════════════════════════════════════════════════════════

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform extends Component {
  componentType: 'Transform';
  translation: Vec3;
  rotation: Quat;
  scale: Vec3;
}

export interface GlobalTransform extends Component {
  componentType: 'GlobalTransform';
  translation: Vec3;
  rotation: Quat;
  scale: Vec3;
}

export function createTransform(
  translation: Vec3 = { x: 0, y: 0, z: 0 },
  rotation: Quat = { x: 0, y: 0, z: 0, w: 1 },
  scale: Vec3 = { x: 1, y: 1, z: 1 }
): Transform {
  return { componentType: 'Transform', translation, rotation, scale };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINE COMPONENTS (CinemaOS specific)
// ═══════════════════════════════════════════════════════════════════════════════

export interface TimelineClip extends Component {
  componentType: 'TimelineClip';
  startFrame: number;
  durationFrames: number;
  sourceStart: number; // in-point in source media
  sourceDuration: number;
  mediaPath: string;
  trackIndex: number;
}

export interface TimelineTrack extends Component {
  componentType: 'TimelineTrack';
  name: string;
  trackType: 'video' | 'audio';
  index: number;
  locked: boolean;
  muted: boolean;
  visible: boolean;
}

export interface TimelineMarker extends Component {
  componentType: 'TimelineMarker';
  frame: number;
  label: string;
  color: string;
  markerType: 'in' | 'out' | 'chapter' | 'note';
}

export interface Playhead extends Component {
  componentType: 'Playhead';
  frame: number;
  isPlaying: boolean;
  playbackRate: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export interface VideoFrame extends Component {
  componentType: 'VideoFrame';
  textureId: string;
  width: number;
  height: number;
  frameNumber: number;
  pts: number; // presentation timestamp
}

export interface AudioBuffer extends Component {
  componentType: 'AudioBuffer';
  bufferId: string;
  sampleRate: number;
  channels: number;
  samplesPerChannel: number;
}

export interface MediaSource extends Component {
  componentType: 'MediaSource';
  path: string;
  mediaType: 'video' | 'audio' | 'image' | 'sequence';
  durationMs: number;
  frameRate: number;
  width?: number;
  height?: number;
  codec?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Sprite extends Component {
  componentType: 'Sprite';
  textureId: string;
  color: [number, number, number, number]; // RGBA
  anchor: Vec2;
  flipX: boolean;
  flipY: boolean;
}

export interface Text extends Component {
  componentType: 'Text';
  content: string;
  fontFamily: string;
  fontSize: number;
  color: [number, number, number, number];
  alignment: 'left' | 'center' | 'right';
}

export interface Visibility extends Component {
  componentType: 'Visibility';
  isVisible: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnimationPlayer extends Component {
  componentType: 'AnimationPlayer';
  animationId: string;
  playing: boolean;
  looping: boolean;
  speed: number;
  currentTime: number;
}

export interface Keyframe<T> {
  time: number;
  value: T;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step';
}

export interface AnimationCurve<T> extends Component {
  componentType: 'AnimationCurve';
  property: string;
  keyframes: Keyframe<T>[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARENT/CHILD RELATIONSHIPS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Parent extends Component {
  componentType: 'Parent';
  parentId: EntityId;
}

export interface Children extends Component {
  componentType: 'Children';
  childIds: EntityId[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTION / INTERACTION
// ═══════════════════════════════════════════════════════════════════════════════

export interface Selected extends Component {
  componentType: 'Selected';
  selectionOrder: number;
}

export interface Draggable extends Component {
  componentType: 'Draggable';
  isDragging: boolean;
  dragOffset: Vec2;
}

export interface Hoverable extends Component {
  componentType: 'Hoverable';
  isHovered: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new entity with given components
 */
export function createEntity<T extends Component>(id: EntityId, components: T[]): Entity<T> {
  const componentMap = new Map<string, T>();
  components.forEach(c => componentMap.set(c.componentType, c));
  return { id, components: componentMap };
}

/**
 * Get component from entity
 */
export function getComponent<T extends Component>(
  entity: Entity,
  componentType: string
): T | undefined {
  return entity.components.get(componentType) as T | undefined;
}

/**
 * Check if entity has component
 */
export function hasComponent(entity: Entity, componentType: string): boolean {
  return entity.components.has(componentType);
}

/**
 * Add component to entity
 */
export function addComponent<T extends Component>(entity: Entity<T>, component: T): void {
  entity.components.set(component.componentType, component);
}

/**
 * Remove component from entity
 */
export function removeComponent(entity: Entity, componentType: string): boolean {
  return entity.components.delete(componentType);
}
