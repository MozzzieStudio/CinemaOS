/**
 * React 19 View Transitions Hook
 * 
 * Based on research: https://es.react.dev/
 * React 19 introduced native View Transitions API support.
 * 
 * This hook provides a clean interface for page/component transitions.
 */

import { useCallback, useTransition } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW TRANSITIONS API (React 19+)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if View Transitions API is supported
 */
export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * Start a view transition with fallback for unsupported browsers
 */
export function startViewTransition(callback: () => void | Promise<void>): void {
  if (supportsViewTransitions()) {
    // Use native View Transitions API
    (document as any).startViewTransition(async () => {
      await callback();
    });
  } else {
    // Fallback: just run the callback
    callback();
  }
}

/**
 * React 19 View Transition Hook
 * Combines useTransition with View Transitions API
 */
export function useViewTransition() {
  const [isPending, startTransition] = useTransition();

  const startViewTransitionUpdate = useCallback(
    (callback: () => void) => {
      if (supportsViewTransitions()) {
        (document as any).startViewTransition(() => {
          startTransition(callback);
        });
      } else {
        startTransition(callback);
      }
    },
    [startTransition]
  );

  return {
    isPending,
    startViewTransition: startViewTransitionUpdate,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW TRANSITION NAMES (CSS classes)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply a view-transition-name to an element
 * Used for cross-document transitions
 */
export function setViewTransitionName(element: HTMLElement | null, name: string): void {
  if (element) {
    element.style.viewTransitionName = name;
  }
}

/**
 * Clear view-transition-name from an element
 */
export function clearViewTransitionName(element: HTMLElement | null): void {
  if (element) {
    element.style.viewTransitionName = '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE TRANSITION ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom';

/**
 * Get CSS keyframes for transition type
 */
export function getTransitionKeyframes(type: TransitionType): {
  old: Keyframe[];
  new: Keyframe[];
} {
  switch (type) {
    case 'fade':
      return {
        old: [{ opacity: 1 }, { opacity: 0 }],
        new: [{ opacity: 0 }, { opacity: 1 }],
      };
    case 'slide-left':
      return {
        old: [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }],
        new: [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }],
      };
    case 'slide-right':
      return {
        old: [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }],
        new: [{ transform: 'translateX(-100%)' }, { transform: 'translateX(0)' }],
      };
    case 'slide-up':
      return {
        old: [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
        new: [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
      };
    case 'zoom':
      return {
        old: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.8)', opacity: 0 }],
        new: [{ transform: 'scale(1.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      };
  }
}

/**
 * Hook for page transitions (Writer <-> Studio mode)
 */
export function usePageTransition() {
  const { isPending, startViewTransition } = useViewTransition();

  const transitionTo = useCallback(
    (callback: () => void, type: TransitionType = 'fade') => {
      // Inject transition CSS if needed
      injectTransitionStyles(type);
      startViewTransition(callback);
    },
    [startViewTransition]
  );

  return {
    isPending,
    transitionTo,
  };
}

/**
 * Inject CSS for view transitions dynamically
 */
function injectTransitionStyles(type: TransitionType): void {
  const styleId = `view-transition-${type}`;
  if (document.getElementById(styleId)) return;

  const keyframes = getTransitionKeyframes(type);
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    ::view-transition-old(root) {
      animation: ${type}-out 300ms ease-out both;
    }
    ::view-transition-new(root) {
      animation: ${type}-in 300ms ease-in both;
    }
    @keyframes ${type}-out {
      from { ${keyframesToCSS(keyframes.old[0])} }
      to { ${keyframesToCSS(keyframes.old[1])} }
    }
    @keyframes ${type}-in {
      from { ${keyframesToCSS(keyframes.new[0])} }
      to { ${keyframesToCSS(keyframes.new[1])} }
    }
  `;
  document.head.appendChild(style);
}

function keyframesToCSS(kf: Keyframe): string {
  return Object.entries(kf)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ');
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
