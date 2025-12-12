/**
 * UV Python Environment Configuration
 * 
 * Based on research: https://docs.astral.sh/uv/
 * 
 * UV is 10-100x faster than pip, combining:
 * - pip, poetry, pyenv, virtualenv, pipx
 * - Universal lockfile
 * - Cargo-style workspaces
 * 
 * This module provides configuration for UV-managed Python (ComfyUI).
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface UVConfig {
  pythonVersion: string;
  virtualenvPath: string;
  lockfilePath: string;
  cacheDir: string;
  offlineMode: boolean;
  noBinaryPackages: string[];
}

export const DEFAULT_UV_CONFIG: UVConfig = {
  pythonVersion: '3.12',
  virtualenvPath: '.venv',
  lockfilePath: 'uv.lock',
  cacheDir: '~/.cache/uv',
  offlineMode: false,
  noBinaryPackages: [],
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMFYUI DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PythonDependency {
  name: string;
  version?: string;
  extras?: string[];
  source?: 'pypi' | 'git' | 'local';
  url?: string;
}

export const COMFYUI_CORE_DEPS: PythonDependency[] = [
  { name: 'torch', version: '>=2.4.0' },
  { name: 'torchvision', version: '>=0.19.0' },
  { name: 'torchaudio', version: '>=2.4.0' },
  { name: 'transformers', version: '>=4.44.0' },
  { name: 'safetensors', version: '>=0.4.0' },
  { name: 'aiohttp', version: '>=3.9.0' },
  { name: 'einops', version: '>=0.8.0' },
  { name: 'kornia', version: '>=0.7.0' },
  { name: 'spandrel', version: '>=0.4.0' },
  { name: 'accelerate', version: '>=0.33.0' },
];

export const COMFYUI_OPTIONAL_DEPS: PythonDependency[] = [
  { name: 'xformers', version: '>=0.0.28' },
  { name: 'flash-attn', version: '>=2.6.0' },
  { name: 'onnxruntime-gpu', version: '>=1.19.0' },
  { name: 'opencv-python', version: '>=4.10.0' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// UV COMMANDS (for Tauri invoke)
// ═══════════════════════════════════════════════════════════════════════════════

export interface UVCommand {
  type: 'init' | 'sync' | 'add' | 'remove' | 'lock' | 'run' | 'pip';
  args: string[];
  env?: Record<string, string>;
  cwd?: string;
}

/**
 * Create UV init command
 */
export function createInitCommand(pythonVersion: string = '3.12'): UVCommand {
  return {
    type: 'init',
    args: ['--python', pythonVersion],
  };
}

/**
 * Create UV sync command (install from lockfile)
 */
export function createSyncCommand(frozen: boolean = true): UVCommand {
  return {
    type: 'sync',
    args: frozen ? ['--frozen'] : [],
  };
}

/**
 * Create UV add command
 */
export function createAddCommand(packages: string[], dev: boolean = false): UVCommand {
  return {
    type: 'add',
    args: dev ? ['--dev', ...packages] : packages,
  };
}

/**
 * Create UV run command (run Python script)
 */
export function createRunCommand(script: string, args: string[] = []): UVCommand {
  return {
    type: 'run',
    args: ['python', script, ...args],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT MANIFEST (pyproject.toml)
// ═══════════════════════════════════════════════════════════════════════════════

export interface PyProjectToml {
  project: {
    name: string;
    version: string;
    description?: string;
    readme?: string;
    requires_python: string;
    dependencies: string[];
  };
  tool?: {
    uv?: {
      dev_dependencies?: string[];
      python?: string;
      index_url?: string;
    };
  };
}

/**
 * Generate pyproject.toml content for ComfyUI environment
 */
export function generateComfyUIProject(name: string = 'cinema-os-comfyui'): PyProjectToml {
  return {
    project: {
      name,
      version: '0.1.0',
      description: 'CinemaOS ComfyUI Environment',
      requires_python: '>=3.11',
      dependencies: COMFYUI_CORE_DEPS.map(d => 
        d.version ? `${d.name}${d.version}` : d.name
      ),
    },
    tool: {
      uv: {
        dev_dependencies: ['pytest', 'black', 'ruff'],
        python: '3.12',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export interface PythonEnvironment {
  pythonPath: string;
  pythonVersion: string;
  uvVersion: string;
  virtualenvPath: string;
  installedPackages: InstalledPackage[];
  isComfyUIReady: boolean;
  gpuAvailable: boolean;
  gpuName?: string;
}

export interface InstalledPackage {
  name: string;
  version: string;
  location: string;
}

/**
 * Check if ComfyUI requirements are met
 */
export function checkComfyUIReady(installed: InstalledPackage[]): boolean {
  const required = ['torch', 'transformers', 'safetensors', 'aiohttp'];
  const installedNames = installed.map(p => p.name.toLowerCase());
  return required.every(r => installedNames.includes(r));
}
