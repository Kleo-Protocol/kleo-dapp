'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { KleoClient } from '@kleo-protocol/kleo-sdk';
import { Props } from '@/lib/types';

interface KleoClientContextValue {
  client: KleoClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const KleoClientContext = createContext<KleoClientContextValue | null>(null);

// SDK configuration
const KLEO_CONFIG = {
  endpoint: 'wss://asset-hub-paseo.dotters.network',
  timeout: 30000,
};

export function KleoClientProvider({ children }: Props) {
  const [client, setClient] = useState<KleoClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const kleoClient = new KleoClient(KLEO_CONFIG);
      await kleoClient.connect();
      setClient(kleoClient);
      setIsConnected(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to Kleo SDK');
      setError(error);
      console.error('Kleo SDK connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(async () => {
    if (client) {
      try {
        await client.disconnect();
      } catch (err) {
        console.error('Error disconnecting Kleo SDK:', err);
      }
      setClient(null);
      setIsConnected(false);
    }
  }, [client]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (client) {
        client.disconnect().catch(console.error);
      }
    };
  }, [connect]);

  const value = useMemo(
    () => ({
      client,
      isConnected,
      isConnecting,
      error,
      connect,
      disconnect,
    }),
    [client, isConnected, isConnecting, error, connect, disconnect]
  );

  return <KleoClientContext.Provider value={value}>{children}</KleoClientContext.Provider>;
}

export function useKleoClient() {
  const context = useContext(KleoClientContext);
  if (!context) {
    throw new Error('useKleoClient must be used within a KleoClientProvider');
  }
  return context;
}
