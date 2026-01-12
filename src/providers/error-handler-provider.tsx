'use client';

import { useEffect } from 'react';
import { Props } from '@/lib/types';

/**
 * Provider that filters out expected WebSocket connection errors
 * These errors are normal behavior for Polkadot RPC connections
 * and don't indicate actual problems
 */
export function ErrorHandlerProvider({ children }: Props) {
  useEffect(() => {
    // Store original console.error
    const originalConsoleError = console.error;

    // Helper function to check if error should be filtered
    const shouldFilterError = (message: string): boolean => {
      const lowerMessage = message.toLowerCase();

      // Filter out expected WebSocket disconnection errors (code 1006)
      if (
        lowerMessage.includes('disconnected from wss://') &&
        (lowerMessage.includes('1006') || lowerMessage.includes('disconnected'))
      ) {
        return true;
      }

      // Filter out WebSocket connection errors from Polkadot RPC
      if (
        lowerMessage.includes('websocket') &&
        (lowerMessage.includes('connection') ||
          lowerMessage.includes('disconnect') ||
          lowerMessage.includes('1006'))
      ) {
        return true;
      }

      // Filter out specific RPC endpoint disconnections
      if (lowerMessage.includes('asset-hub-paseo') && lowerMessage.includes('disconnected')) {
        return true;
      }

      return false;
    };

    // Override console.error to filter WebSocket disconnection errors
    const filteredConsoleError = (...args: unknown[]) => {
      const message = args.map((arg) => String(arg || '')).join(' ');

      if (shouldFilterError(message)) {
        // These are expected disconnections and don't need to be logged
        return;
      }

      // Call original console.error for all other errors
      originalConsoleError.apply(console, args);
    };

    // Assign the filtered function
    console.error = filteredConsoleError;

    // Also handle unhandled errors/rejections that might come from WebSocket
    const handleError = (event: ErrorEvent) => {
      if (shouldFilterError(event.message || '')) {
        event.preventDefault();
        return;
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = String(event.reason || event.reason?.message || '');
      if (shouldFilterError(message)) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return <>{children}</>;
}