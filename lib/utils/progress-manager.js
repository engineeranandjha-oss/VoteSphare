/**
 * VoteSphere Global Progress Manager
 * State machine managing multi-operation reference counting, asymptotic progression,
 * and lifecycle completion for navigation and async actions.
 */

export function createProgressManager(initialProgress = 0) {
  let activeOperations = 0;
  let progress = initialProgress;
  let visible = false;

  return {
    getActiveCount() {
      return activeOperations;
    },

    getProgress() {
      return progress;
    },

    isVisible() {
      return visible;
    },

    start() {
      activeOperations += 1;
      if (activeOperations === 1) {
        visible = true;
        progress = progress > 0 && progress < 90 ? progress : 18;
      }
      return {
        activeOperations,
        progress,
        visible,
        isNewSession: activeOperations === 1,
      };
    },

    step(stepMultiplier = 1) {
      if (!visible || activeOperations === 0) return progress;

      if (progress >= 92) {
        progress = Math.min(95, progress + 0.15 * stepMultiplier);
      } else if (progress >= 80) {
        progress = progress + 0.6 * stepMultiplier;
      } else if (progress >= 60) {
        progress = progress + 1.8 * stepMultiplier;
      } else if (progress >= 30) {
        progress = progress + 3.5 * stepMultiplier;
      } else {
        progress = progress + 8.0 * stepMultiplier;
      }
      return progress;
    },

    update(target) {
      if (typeof target === 'number') {
        progress = Math.max(progress, Math.min(98, target));
      }
      return progress;
    },

    complete() {
      if (activeOperations > 0) {
        activeOperations -= 1;
      }

      const isFinished = activeOperations === 0;
      if (isFinished) {
        progress = 100;
      }

      return {
        activeOperations,
        progress,
        visible,
        isFinished,
      };
    },

    fail() {
      return this.complete();
    },

    reset() {
      activeOperations = 0;
      progress = 0;
      visible = false;
      return { activeOperations: 0, progress: 0, visible: false };
    },

    async withProgress(fn) {
      this.start();
      try {
        if (typeof fn === 'function') {
          return await fn();
        }
        return await fn;
      } finally {
        this.complete();
      }
    },
  };
}

export default createProgressManager;
