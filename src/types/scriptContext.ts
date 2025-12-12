/**
 * Script Context Types
 * 
 * Types for script context passed between editor and AI agents
 * These types match the existing plugin interfaces in the codebase
 */

export interface ScriptContext {
  /** Full script text content */
  full_text: string;
  /** Currently selected text, if any */
  selection?: string;
  /** Current cursor line number (1-indexed) */
  cursor_line?: number;
  /** Current scene heading (INT./EXT. line) */
  current_scene?: string;
  /** All character names found in the script */
  scene_characters: string[];
}

/**
 * Scene Numbers Configuration
 * Matches SceneNumbersPlugin.tsx interface
 */
export interface SceneNumbersConfig {
  enabled: boolean;
  position: 'left' | 'right' | 'both';
  format: 'numeric' | 'letter' | 'dotted';
  startNumber: number;
}

/**
 * Mores and Continueds Configuration
 * Matches MoresContinuedsPlugin.tsx interface
 */
export interface MoresContinuedsConfig {
  enabled: boolean;
  showMore: boolean;
  showContd: boolean;
  showContinued: boolean;
  moreText: string;
  contdText: string;
  continuedText: string;
}

export interface TitlePageData {
  title: string;
  writtenBy: string;
  draftDate: string;
  basedOn?: string;
  address?: string;
  phone?: string;
  email?: string;
  copyright?: string;
}

export interface RevisionConfig {
  enabled: boolean;
  currentColor: 'blue' | 'pink' | 'yellow' | 'green' | 'salmon' | 'cherry' | 'tan' | 'goldenrod' | 'buff' | 'white';
  showRevisionMarks: boolean;
  dateStamp: boolean;
}

export interface SpellCheckConfig {
  enabled: boolean;
  autoCorrect: boolean;
  ignoredWords: Set<string>;
}
