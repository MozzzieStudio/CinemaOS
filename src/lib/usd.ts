/**
 * OpenUSD (Universal Scene Description) Types
 * 
 * Based on research: https://openusd.org/release/index.html (v25.11)
 * 
 * USD is a high-performance platform for collaboratively creating
 * animated 3D scenes, with schemas for geometry, shading, lighting, physics.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CORE USD TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SdfPath = string; // e.g., "/World/Characters/Hero"

export interface UsdTimeCode {
  value: number;
  isDefault: boolean;
}

export const USD_DEFAULT_TIME: UsdTimeCode = { value: 0, isDefault: true };

export interface UsdAttribute {
  name: string;
  typeName: string;
  value: unknown;
  variability: 'varying' | 'uniform';
  custom: boolean;
}

export interface UsdRelationship {
  name: string;
  targets: SdfPath[];
}

export interface UsdPrim {
  path: SdfPath;
  typeName: string;
  specifier: 'def' | 'over' | 'class';
  attributes: Record<string, UsdAttribute>;
  relationships: Record<string, UsdRelationship>;
  children: SdfPath[];
  metadata: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOMETRY (UsdGeom)
// ═══════════════════════════════════════════════════════════════════════════════

export interface GfVec2f { x: number; y: number; }
export interface GfVec3f { x: number; y: number; z: number; }
export interface GfVec4f { x: number; y: number; z: number; w: number; }
export interface GfQuatf { i: number; j: number; k: number; r: number; }
export type GfMatrix4d = number[]; // 16 elements row-major

export interface UsdGeomXformOp {
  opType: 'translate' | 'scale' | 'rotateX' | 'rotateY' | 'rotateZ' | 'rotateXYZ' | 'transform';
  precision: 'double' | 'float' | 'half';
  isInverseOp: boolean;
  value: GfVec3f | number | GfMatrix4d;
}

export interface UsdGeomMesh extends UsdPrim {
  typeName: 'Mesh';
  points: GfVec3f[];
  faceVertexCounts: number[];
  faceVertexIndices: number[];
  normals?: GfVec3f[];
  primvars?: Record<string, unknown>;
  subdivisionScheme?: 'catmullClark' | 'loop' | 'bilinear' | 'none';
}

export interface UsdGeomCamera extends UsdPrim {
  typeName: 'Camera';
  projection: 'perspective' | 'orthographic';
  focalLength: number;
  horizontalAperture: number;
  verticalAperture: number;
  clippingRange: [number, number];
  focusDistance?: number;
  fStop?: number;
}

export interface UsdGeomXform extends UsdPrim {
  typeName: 'Xform';
  xformOpOrder: string[];
  xformOps: UsdGeomXformOp[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHADING (UsdShade)
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsdShadeMaterial extends UsdPrim {
  typeName: 'Material';
  surface?: SdfPath;
  displacement?: SdfPath;
  volume?: SdfPath;
}

export interface UsdShadeShader extends UsdPrim {
  typeName: 'Shader';
  implementationSource: 'id' | 'sourceAsset' | 'sourceCode';
  shaderId?: string;
  inputs: Record<string, UsdAttribute>;
  outputs: Record<string, UsdAttribute>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIGHTING (UsdLux)
// ═══════════════════════════════════════════════════════════════════════════════

export type LightType = 'DistantLight' | 'DomeLight' | 'RectLight' | 'SphereLight' | 'DiskLight' | 'CylinderLight';

export interface UsdLuxLight extends UsdPrim {
  typeName: LightType;
  intensity: number;
  exposure: number;
  color: GfVec3f;
  temperature?: number; // Kelvin
  enableColorTemperature?: boolean;
  normalize?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsdReference {
  assetPath: string;
  primPath?: SdfPath;
  layerOffset?: { offset: number; scale: number };
}

export interface UsdPayload {
  assetPath: string;
  primPath?: SdfPath;
}

export interface UsdVariantSet {
  name: string;
  variants: string[];
  selection: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE
// ═══════════════════════════════════════════════════════════════════════════════

export interface UsdStage {
  rootLayer: string;
  sessionLayer?: string;
  defaultPrim?: SdfPath;
  startTimeCode: number;
  endTimeCode: number;
  framesPerSecond: number;
  timeCodesPerSecond: number;
  upAxis: 'Y' | 'Z';
  metersPerUnit: number;
  prims: Map<SdfPath, UsdPrim>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new USD stage
 */
export function createStage(rootLayer: string): UsdStage {
  return {
    rootLayer,
    startTimeCode: 1,
    endTimeCode: 100,
    framesPerSecond: 24,
    timeCodesPerSecond: 24,
    upAxis: 'Y',
    metersPerUnit: 0.01, // cm (Maya/Houdini default)
    prims: new Map(),
  };
}

/**
 * Create an Xform (transform node)
 */
export function createXform(path: SdfPath, translation?: GfVec3f, rotation?: GfVec3f, scale?: GfVec3f): UsdGeomXform {
  const ops: UsdGeomXformOp[] = [];
  const opOrder: string[] = [];

  if (translation) {
    ops.push({ opType: 'translate', precision: 'double', isInverseOp: false, value: translation });
    opOrder.push('xformOp:translate');
  }
  if (rotation) {
    ops.push({ opType: 'rotateXYZ', precision: 'float', isInverseOp: false, value: rotation });
    opOrder.push('xformOp:rotateXYZ');
  }
  if (scale) {
    ops.push({ opType: 'scale', precision: 'float', isInverseOp: false, value: scale });
    opOrder.push('xformOp:scale');
  }

  return {
    path,
    typeName: 'Xform',
    specifier: 'def',
    attributes: {},
    relationships: {},
    children: [],
    metadata: {},
    xformOpOrder: opOrder,
    xformOps: ops,
  };
}

/**
 * Get parent path from a prim path
 */
export function getParentPath(path: SdfPath): SdfPath | null {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash <= 0) return null;
  return path.substring(0, lastSlash);
}

/**
 * Get name from a prim path
 */
export function getPathName(path: SdfPath): string {
  const lastSlash = path.lastIndexOf('/');
  return path.substring(lastSlash + 1);
}

/**
 * Join path segments
 */
export function joinPaths(...segments: string[]): SdfPath {
  return '/' + segments.filter(s => s).map(s => s.replace(/^\/|\/$/g, '')).join('/');
}
