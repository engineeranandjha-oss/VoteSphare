'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useGlobalProgress } from '@/components/common/GlobalProgressProvider';

/**
 * Standardized VoteSphere Action Button Component
 * Supports built-in async processing state, global progress tracking, loading spinners, accessible labels, and theme styling.
 */
const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    className = '',
    loading = false,
    loadingText,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    iconClassName = 'h-4 w-4',
    spinnerClassName = 'h-4 w-4 text-current animate-spin shrink-0',
    globalProgress = false,
    onClick,
    ...props
  },
  ref
) {
  const { startProgress, completeProgress } = useGlobalProgress();
  const isDisabled = disabled || loading;
  const prevLoadingRef = useRef(loading);

  // Sync global progress when button loading prop changes if globalProgress is requested
  useEffect(() => {
    if (globalProgress) {
      if (loading && !prevLoadingRef.current) {
        startProgress();
      } else if (!loading && prevLoadingRef.current) {
        completeProgress();
      }
    }
    prevLoadingRef.current = loading;
  }, [loading, globalProgress, startProgress, completeProgress]);

  const handleClick = async (e) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      if (globalProgress) {
        startProgress();
        try {
          const result = onClick(e);
          if (result && typeof result.then === 'function') {
            await result;
          }
        } finally {
          completeProgress();
        }
      } else {
        onClick(e);
      }
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center transition-all duration-200 select-none ${
        isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'active:scale-[0.98]'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={spinnerClassName} aria-hidden="true" />
          <span className="ml-2 inline-flex items-center">
            {loadingText || children}
          </span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className={`${iconClassName} mr-2 shrink-0`} aria-hidden="true" />
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon className={`${iconClassName} ml-2 shrink-0`} aria-hidden="true" />
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
export { Button };
