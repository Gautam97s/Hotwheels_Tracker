'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrackerConfig } from '@/app/api/config/route';

export function useTrackerConfig() {
  const [config, setConfig] = useState<TrackerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<TrackerConfig>): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update config');
      const data = await response.json();
      setConfig(data.config);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  const addProduct = useCallback(async (product: TrackerConfig['products'][0]): Promise<boolean> => {
    if (!config) return false;
    const updatedProducts = [...config.products, product];
    return updateConfig({ products: updatedProducts });
  }, [config, updateConfig]);

  const updateProduct = useCallback(async (id: string, updates: Partial<TrackerConfig['products'][0]>): Promise<boolean> => {
    if (!config) return false;
    const updatedProducts = config.products.map(p => p.id === id ? { ...p, ...updates } : p);
    return updateConfig({ products: updatedProducts });
  }, [config, updateConfig]);

  const removeProduct = useCallback(async (id: string): Promise<boolean> => {
    if (!config) return false;
    const updatedProducts = config.products.filter(p => p.id !== id);
    return updateConfig({ products: updatedProducts });
  }, [config, updateConfig]);

  const updateTelegram = useCallback(async (telegram: Partial<TrackerConfig['telegram']>): Promise<boolean> => {
    if (!config) return false;
    return updateConfig({ telegram: { ...config.telegram, ...telegram } });
  }, [config, updateConfig]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    fetchConfig,
    updateConfig,
    addProduct,
    updateProduct,
    removeProduct,
    updateTelegram,
  };
}