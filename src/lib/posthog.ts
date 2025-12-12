/**
 * PostHog Analytics Integration
 * 
 * Privacy-first product analytics
 */

import posthog from 'posthog-js';

const isProduction = import.meta.env.PROD;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

/**
 * Initialize PostHog
 */
export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.info('ℹ️ PostHog disabled (no key)');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    
    // Privacy-first: NO autocapture
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    
    // Send data only in production
    loaded: (ph) => {
      if (!isProduction) {
        ph.opt_out_capturing();
        console.info('ℹ️ PostHog: opt-out in development');
      } else {
        console.info('✅ PostHog initialized');
      }
    },
    
    // Performance
    persistence: 'localStorage',
  });
}

/**
 * Identify user (after login)
 */
export function identifyUser(userId: string, traits?: Record<string, any>) {
  posthog.identify(userId, traits);
}

/**
 * Reset user (after logout)
 */
export function resetUser() {
  posthog.reset();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRACKED EVENTS - Explicit tracking only
// ═══════════════════════════════════════════════════════════════════════════════

export function trackScriptCreated(projectId: string) {
  posthog.capture('script_created', { project_id: projectId });
}

export function trackScriptSaved(projectId: string, wordCount: number) {
  posthog.capture('script_saved', {
    project_id: projectId,
    word_count: wordCount,
  });
}

export function trackTokenExtracted(tokenType: string, count: number) {
  posthog.capture('token_extracted', {
    token_type: tokenType,
    count,
  });
}

export function trackAIGenerationStarted(params: {
  agent: string;
  model: string;
  type: 'image' | 'video' | 'audio' | 'text';
  isLocal: boolean;
}) {
  posthog.capture('ai_generation_started', params);
}

export function trackAIGenerationCompleted(params: {
  agent: string;
  model: string;
  type: 'image' | 'video' | 'audio' | 'text';
  duration_ms: number;
  credits_used?: number;
}) {
  posthog.capture('ai_generation_completed', params);
}

export function trackAIGenerationFailed(params: {
  agent: string;
  model: string;
  error_code: string;
}) {
  posthog.capture('ai_generation_failed', params);
}

export function trackExportPDF(projectId: string, pageCount: number) {
  posthog.capture('export_pdf', {
    project_id: projectId,
    page_count: pageCount,
  });
}

export function trackModeSwitch(from: string, to: string) {
  posthog.capture('mode_switch', { from, to });
}

export function trackHardwareDetected(params: {
  gpu_vendor?: string;
  vram_gb: number;
  can_run_local: boolean;
}) {
  posthog.capture('hardware_detected', params);
}

/**
 * Feature flags (server-controlled)
 */
export function getFeatureFlag(key: string): boolean {
  return posthog.isFeatureEnabled(key) || false;
}

/**
 * A/B testing variant
 */
export function getVariant(experimentKey: string): string | undefined {
  return posthog.getFeatureFlag(experimentKey) as string | undefined;
}
