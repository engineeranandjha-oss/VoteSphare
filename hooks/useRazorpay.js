'use client';

import { useState, useEffect, useCallback } from 'react';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Custom React hook to dynamically load the Razorpay Standard Checkout SDK
 * and manage client-side payment modal execution.
 *
 * @returns {{
 *   isLoaded: boolean,
 *   isLoading: boolean,
 *   error: string | null,
 *   openCheckout: (options: Object) => Promise<Object>
 * }}
 */
export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if script is already present in window
    if (typeof window !== 'undefined' && window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    // Check if script element is already added to document
    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        setIsLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        existingScript.addEventListener('error', () => setError('Failed to load Razorpay SDK'));
      }
      return;
    }

    setIsLoading(true);
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      setIsLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      setError('Unable to load payment gateway script. Please check your network connection.');
      setIsLoading(false);
    };

    document.body.appendChild(script);
  }, []);

  /**
   * Opens the Razorpay Standard Checkout modal.
   *
   * @param {Object} options - Standard Razorpay options (key, subscription_id or order_id, handler, prefill, theme)
   * @returns {Promise<Object>} Resolves on payment success, rejects on modal dismissal or failure.
   */
  const openCheckout = useCallback(
    (options) => {
      return new Promise((resolve, reject) => {
        // Handle local development sandbox mock mode
        if (
          options.subscription_id?.startsWith('sub_mock_') ||
          options.order_id?.startsWith('order_mock_')
        ) {
          const confirmed = typeof window !== 'undefined'
            ? window.confirm(
                `[VoteSphere Dev Sandbox Checkout]\n\nItem: ${options.description || 'Subscription'}\nMode: Simulated Razorpay Gateway\n\nClick OK to simulate successful payment, or Cancel to simulate user dismissal.`
              )
            : true;

          if (!confirmed) {
            if (options.modal?.ondismiss) {
              options.modal.ondismiss();
            }
            reject(new Error('Payment checkout was closed by the user.'));
            return;
          }

          const mockPaymentId = `pay_mock_${Date.now()}`;
          const mockResponse = {
            razorpay_payment_id: mockPaymentId,
            razorpay_subscription_id: options.subscription_id || undefined,
            razorpay_order_id: options.order_id || undefined,
            razorpay_signature: `mock_sig_${Date.now()}`,
          };

          if (options.handler) {
            options.handler(mockResponse);
          }
          resolve(mockResponse);
          return;
        }

        if (typeof window === 'undefined' || !window.Razorpay) {
          reject(new Error('Razorpay SDK is not loaded. Please refresh the page and try again.'));
          return;
        }

        const checkoutOptions = {
          ...options,
          modal: {
            ondismiss: () => {
              if (options.modal?.ondismiss) {
                options.modal.ondismiss();
              }
              reject(new Error('Payment checkout was closed by the user.'));
            },
            ...options.modal,
          },
          handler: (response) => {
            if (options.handler) {
              options.handler(response);
            }
            resolve(response);
          },
        };

        try {
          const rzpInstance = new window.Razorpay(checkoutOptions);

          rzpInstance.on('payment.failed', (response) => {
            reject(
              new Error(
                response?.error?.description ||
                  response?.error?.reason ||
                  'Payment processing failed.'
              )
            );
          });

          rzpInstance.open();
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  return {
    isLoaded,
    isLoading,
    error,
    openCheckout,
  };
}

export default useRazorpay;

