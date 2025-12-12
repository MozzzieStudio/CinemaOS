/**
 * OpenColorIO (OCIO) Configuration Utilities
 * 
 * Based on research: https://opencolorio.org/ (v2.5.0)
 * 
 * OCIO provides color management for VFX and animation.
 * This module provides TypeScript utilities for OCIO configuration.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// OCIO v2.5 CONFIGURATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface OCIOColorSpace {
  name: string;
  description?: string;
  family?: string;
  equalityGroup?: string;
  bitDepth?: 'unknown' | 'uint8' | 'uint10' | 'uint12' | 'uint16' | 'uint32' | 'f16' | 'f32';
  isData?: boolean;
  allocation?: 'uniform' | 'lg2';
  allocationVars?: number[];
}

export interface OCIODisplay {
  name: string;
  views: OCIOView[];
}

export interface OCIOView {
  name: string;
  colorspace: string;
  looks?: string;
}

export interface OCIOLook {
  name: string;
  process_space: string;
  description?: string;
  transform?: OCIOTransform;
}

export interface OCIOTransform {
  type: 'CDLTransform' | 'FileTransform' | 'LogTransform' | 'MatrixTransform';
  [key: string]: unknown;
}

export interface OCIOConfig {
  ocio_profile_version: string;
  name: string;
  description?: string;
  search_path?: string[];
  strictparsing?: boolean;
  luma?: [number, number, number];
  roles: OCIORoles;
  displays: OCIODisplay[];
  colorspaces: OCIOColorSpace[];
  looks?: OCIOLook[];
}

export interface OCIORoles {
  scene_linear?: string;
  rendering?: string;
  compositing_linear?: string;
  color_timing?: string;
  color_picking?: string;
  data?: string;
  default?: string;
  matte_paint?: string;
  texture_paint?: string;
  reference?: string;
  [key: string]: string | undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD COLORSPACES (ACES 1.3 / ACEScg workflow)
// ═══════════════════════════════════════════════════════════════════════════════

export const STANDARD_COLORSPACES: OCIOColorSpace[] = [
  {
    name: 'ACES - ACEScg',
    description: 'Scene-linear with AP1 primaries',
    family: 'ACES',
    isData: false,
    allocation: 'lg2',
    allocationVars: [-8, 5, 0.00390625],
  },
  {
    name: 'ACES - ACES2065-1',
    description: 'ACES primaries with linear transfer',
    family: 'ACES',
    isData: false,
  },
  {
    name: 'Output - sRGB',
    description: 'sRGB IEC 61966-2-1',
    family: 'Output',
    isData: false,
  },
  {
    name: 'Output - Rec.709',
    description: 'ITU-R BT.709',
    family: 'Output',
    isData: false,
  },
  {
    name: 'Output - Rec.2020',
    description: 'ITU-R BT.2020 HDR',
    family: 'Output',
    isData: false,
  },
  {
    name: 'Input - sRGB - Texture',
    description: 'sRGB for texture input',
    family: 'Input',
    isData: false,
  },
  {
    name: 'Utility - Raw',
    description: 'Raw data, no color management',
    family: 'Utility',
    isData: true,
  },
];

export const STANDARD_DISPLAYS: OCIODisplay[] = [
  {
    name: 'sRGB',
    views: [
      { name: 'ACES 1.0 - SDR Video', colorspace: 'Output - sRGB' },
      { name: 'Raw', colorspace: 'Utility - Raw' },
    ],
  },
  {
    name: 'Rec.709',
    views: [
      { name: 'ACES 1.0 - SDR Video', colorspace: 'Output - Rec.709' },
      { name: 'Raw', colorspace: 'Utility - Raw' },
    ],
  },
  {
    name: 'Rec.2020',
    views: [
      { name: 'ACES 1.0 - HDR Video', colorspace: 'Output - Rec.2020' },
      { name: 'Raw', colorspace: 'Utility - Raw' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a default ACES-based OCIO config
 */
export function createDefaultOCIOConfig(name: string = 'CinemaOS'): OCIOConfig {
  return {
    ocio_profile_version: '2.5',
    name,
    description: 'CinemaOS ACES-based color configuration',
    strictparsing: true,
    luma: [0.2126, 0.7152, 0.0722], // Rec.709 luma coefficients
    roles: {
      scene_linear: 'ACES - ACEScg',
      rendering: 'ACES - ACEScg',
      compositing_linear: 'ACES - ACEScg',
      color_timing: 'ACES - ACEScg',
      color_picking: 'Output - sRGB',
      data: 'Utility - Raw',
      default: 'ACES - ACEScg',
      texture_paint: 'Input - sRGB - Texture',
      reference: 'ACES - ACES2065-1',
    },
    displays: STANDARD_DISPLAYS,
    colorspaces: STANDARD_COLORSPACES,
    looks: [],
  };
}

/**
 * Get colorspace by name
 */
export function getColorSpace(config: OCIOConfig, name: string): OCIOColorSpace | undefined {
  return config.colorspaces.find(cs => cs.name === name);
}

/**
 * Get display by name
 */
export function getDisplay(config: OCIOConfig, name: string): OCIODisplay | undefined {
  return config.displays.find(d => d.name === name);
}

/**
 * Get all available view names for a display
 */
export function getViewsForDisplay(config: OCIOConfig, displayName: string): string[] {
  const display = getDisplay(config, displayName);
  return display ? display.views.map(v => v.name) : [];
}

/**
 * Check if colorspace is data (non-color)
 */
export function isDataColorSpace(config: OCIOConfig, colorspaceName: string): boolean {
  const cs = getColorSpace(config, colorspaceName);
  return cs?.isData ?? false;
}

/**
 * Serialize OCIO config to JSON
 */
export function serializeOCIOConfig(config: OCIOConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Get the working colorspace (scene-linear)
 */
export function getWorkingColorSpace(config: OCIOConfig): string {
  return config.roles.scene_linear || config.roles.default || 'ACES - ACEScg';
}

/**
 * Get the output colorspace for a display/view combo
 */
export function getOutputColorSpace(config: OCIOConfig, displayName: string, viewName: string): string | undefined {
  const display = getDisplay(config, displayName);
  if (!display) return undefined;
  const view = display.views.find(v => v.name === viewName);
  return view?.colorspace;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CDL (Color Decision List) SUPPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface CDLValues {
  slope: [number, number, number];
  offset: [number, number, number];
  power: [number, number, number];
  saturation: number;
}

export const DEFAULT_CDL: CDLValues = {
  slope: [1, 1, 1],
  offset: [0, 0, 0],
  power: [1, 1, 1],
  saturation: 1,
};

/**
 * Create a CDL-based look
 */
export function createCDLLook(name: string, cdl: CDLValues): OCIOLook {
  return {
    name,
    process_space: 'ACES - ACEScg',
    description: `CDL Look: ${name}`,
    transform: {
      type: 'CDLTransform',
      slope: cdl.slope,
      offset: cdl.offset,
      power: cdl.power,
      saturation: cdl.saturation,
    },
  };
}
