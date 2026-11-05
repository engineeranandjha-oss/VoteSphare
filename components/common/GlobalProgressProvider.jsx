'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GlobalProgressContext = createContext({
  progress: 0,
  visible: false,
  activeCount: 0,
  startProgress: () => {},
  completeProgress: () => {},
  failProgress: () => {},
  updateProgress: () => {},
  withProgress: async (fn) => (typeof fn === 'function' ? fn() : fn),
});

/**
 * Hook to access VoteSphere Global Progress Controls
 */
export function useGlobalProgress() {
  const context = useContext(GlobalProgressContext);
  if (!context) {
    return {
      progress: 0,
      visible: false,
      activeCount: 0,
      startProgress: () => {},
      completeProgress: () => {},
      failProgress: () => {},
      updateProgress: () => {},
      withProgress: async (fn) => (typeof fn === 'function' ? fn() : fn),
    };
  }
  return context;
}

/**
 * Standalone dispatchers for non-React contexts or external handlers
 */
export function startGlobalProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('votesphere:progress:start'));
  }
}

export function completeGlobalProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('votesphere:progress:complete'));
  }
}

export function failGlobalProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('votesphere:progress:fail'));
  }
}

/**
 * Visual Progress Bar Component
 * Renders a thin, premium yellow/gold progress bar at the very top of the viewport.
 */
function ProgressBar({ progress, visible, opacity }) {
  if (!visible && opacity === 0) return null;

  return (
    <div
  aria-hidden="true"
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  className="pointer-events-none fixed top-0 left-0 right-0 z-[99999] h-[3px] w-full overflow-hidden bg-transparent select-none"
  style={{
    opacity: opacity,
    transition: 'opacity 250ms ease-out',
  }}
>
  <div
    className="relative h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 shadow-[0_0_10px_rgba(59,130,246,0.75),0_0_6px_rgba(139,92,246,0.55)]"
    style={{
      width: `${Math.min(100, Math.max(0, progress))}%`,
      transition:
        progress === 0
          ? 'none'
          : progress === 100
            ? 'width 180ms ease-out'
            : 'width 250ms cubic-bezier(0.1, 0.6, 0.1, 1)',
    }}
  >
    {/* Glowing leading edge pulse */}
    <div
      className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-violet-200/90 shadow-[0_0_12px_rgba(139,92,246,0.85)]"
      style={{
        opacity: progress > 0 && progress < 100 ? 1 : 0,
      }}
    />
  </div>
</div>
  );
}

/**
 * Navigation Watcher component inside Suspense boundary for useSearchParams compatibility
 */
function NavigationWatcher({ onRouteComplete }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Route transition finished
    onRouteComplete();
  }, [pathname, searchParams, onRouteComplete]);

  return null;
}

/**
 * Global Progress Provider Component
 * Orchestrates navigation lifecycle, async operations, and multi-operation reference counting.
 */
export function GlobalProgressProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  const activeCountRef = useRef(0);
  const timerRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  // Clear ticking timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  // Smooth asymptotic progress ticker
  const startTicking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          // Asymptotic crawl
          return Math.min(95, prev + 0.15);
        }
        if (prev >= 80) {
          return prev + 0.6;
        }
        if (prev >= 60) {
          return prev + 1.8;
        }
        if (prev >= 30) {
          return prev + 3.5;
        }
        return prev + 8;
      });
    }, 120);
  }, []);

  // Start progress
  const startProgress = useCallback(() => {
    activeCountRef.current += 1;

    if (activeCountRef.current === 1) {
      clearTimers();
      setVisible(true);
      setOpacity(1);
      setProgress((prev) => (prev > 0 && prev < 90 ? prev : 18));
      startTicking();
    }
  }, [clearTimers, startTicking]);

  // Complete progress
  const completeProgress = useCallback(() => {
    if (activeCountRef.current > 0) {
      activeCountRef.current -= 1;
    }

    if (activeCountRef.current === 0) {
      clearTimers();
      setProgress(100);
      setOpacity(1);

      // Smooth finish & fadeout
      finishTimeoutRef.current = setTimeout(() => {
        setOpacity(0);
        resetTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 250);
      }, 200);
    }
  }, [clearTimers]);

  // Fail / graceful terminate progress
  const failProgress = useCallback(() => {
    completeProgress();
  }, [completeProgress]);

  // Explicit update
  const updateProgress = useCallback((val) => {
    setProgress((prev) => Math.max(prev, Math.min(98, val)));
  }, []);

  // withProgress async helper
  const withProgress = useCallback(
    async (fn) => {
      startProgress();
      try {
        if (typeof fn === 'function') {
          return await fn();
        }
        return await fn;
      } finally {
        completeProgress();
      }
    },
    [startProgress, completeProgress]
  );

  // Global event listener for CustomEvents
  useEffect(() => {
    const handleCustomStart = () => startProgress();
    const handleCustomComplete = () => completeProgress();
    const handleCustomFail = () => failProgress();

    window.addEventListener('votesphere:progress:start', handleCustomStart);
    window.addEventListener('votesphere:progress:complete', handleCustomComplete);
    window.addEventListener('votesphere:progress:fail', handleCustomFail);

    return () => {
      window.removeEventListener('votesphere:progress:start', handleCustomStart);
      window.removeEventListener('votesphere:progress:complete', handleCustomComplete);
      window.removeEventListener('votesphere:progress:fail', handleCustomFail);
    };
  }, [startProgress, completeProgress, failProgress]);

  // Global anchor click listener for navigation detection
  useEffect(() => {
    const handleAnchorClick = (event) => {
      // Ignore if event was already prevented or not primary click
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      // Find closest anchor
      const anchor = event.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore external, target=_blank, download, mailto, tel, or hash-only
      if (
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      // Check if same-origin / internal
      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (targetUrl.origin !== currentUrl.origin) return;

        // If exact same path, search, and hash, no navigation occurs
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search &&
          targetUrl.hash === currentUrl.hash
        ) {
          return;
        }

        // Start progress on internal navigation link click
        startProgress();
      } catch {
        // Ignore URL parsing errors
      }
    };

    const handlePopState = () => {
      startProgress();
    };

    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [startProgress]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const value = {
    progress,
    visible,
    activeCount: activeCountRef.current,
    startProgress,
    completeProgress,
    failProgress,
    updateProgress,
    withProgress,
  };

  return (
    <GlobalProgressContext.Provider value={value}>
      <ProgressBar progress={progress} visible={visible} opacity={opacity} />
      <React.Suspense fallback={null}>
        <NavigationWatcher onRouteComplete={completeProgress} />
      </React.Suspense>
      {children}
    </GlobalProgressContext.Provider>
  );
}

export default GlobalProgressProvider;
