'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TrackedProduct, ProductStatus, AvailabilityStatus, Platform, CHECK_INTERVALS, DEFAULT_CHECK_INTERVAL } from '@/types/product';
import { getStoredProducts, saveProducts, updateProductStatus } from '@/lib/storage';
import { checkProductAvailability } from '@/services';
import { showNotification, playNotificationSound, initNotifications, requestNotificationPermission } from '@/lib/notifications';

export function useProductTracker() {
  const [products, setProducts] = useState<TrackedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalInterval, setGlobalInterval] = useState(DEFAULT_CHECK_INTERVAL);
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isCheckingRef = useRef<Set<string>>(new Set());

  // Initialize products from localStorage
  useEffect(() => {
    const stored = getStoredProducts();
    setProducts(stored);
    setIsLoading(false);
    initNotifications();
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveProducts(products);
    }
  }, [products, isLoading]);

  // Check a single product
  const checkProduct = useCallback(async (product: TrackedProduct): Promise<ProductStatus> => {
    if (isCheckingRef.current.has(product.id)) {
      return product.status;
    }

    isCheckingRef.current.add(product.id);

    try {
      // Update status to checking
      setProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, status: { ...p.status, status: 'UNKNOWN' as AvailabilityStatus, checkedAt: new Date().toISOString() } }
          : p
      ));

      const result = await checkProductAvailability(product.url, product.platform);
      
      // Determine the new status
      const newStatus: ProductStatus = {
        ...result,
        status: result.error ? 'CHECK_FAILED' : (result.available ? 'IN_STOCK' : 'OUT_OF_STOCK'),
      };

      // Check if status changed to IN_STOCK
      const previousStatus = product.status.status;
      const isRestocked = previousStatus !== 'IN_STOCK' && newStatus.status === 'IN_STOCK';

      // Update product with new status
      const updatedProduct = updateProductStatus(product.id, newStatus);
      
      if (updatedProduct) {
        setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
      }

      // Trigger notifications if restocked
      if (isRestocked && product.notificationsEnabled) {
        showNotification(updatedProduct!, previousStatus);
        if (product.soundEnabled) {
          playNotificationSound();
        }
      }

      return newStatus;
    } catch (error) {
      const errorStatus: ProductStatus = {
        available: null,
        price: undefined,
        name: undefined,
        image: undefined,
        checkedAt: new Date().toISOString(),
        status: 'CHECK_FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      const updatedProduct = updateProductStatus(product.id, errorStatus);
      if (updatedProduct) {
        setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
      }
      
      return errorStatus;
    } finally {
      isCheckingRef.current.delete(product.id);
    }
  }, []);

  // Start tracking a product
  const startTracking = useCallback((product: TrackedProduct) => {
    // Clear existing interval if any
    stopTracking(product.id);
    
    const interval = product.checkInterval || globalInterval;
    const intervalId = setInterval(() => {
      checkProduct(product);
    }, interval);
    
    // Also check immediately
    checkProduct(product);
    
    intervalRefs.current.set(product.id, intervalId);
  }, [checkProduct, globalInterval]);

  // Stop tracking a product
  const stopTracking = useCallback((id: string) => {
    const intervalId = intervalRefs.current.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      intervalRefs.current.delete(id);
    }
  }, []);

  // Start tracking all products
  const startAllTracking = useCallback(() => {
    products.forEach(product => startTracking(product));
  }, [products, startTracking]);

  // Stop tracking all products
  const stopAllTracking = useCallback(() => {
    intervalRefs.current.forEach((_, id) => stopTracking(id));
  }, [stopTracking]);

  // Add a new product
  const addProduct = useCallback((product: Omit<TrackedProduct, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newProduct = {
      ...product,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: {
        available: null,
        price: undefined,
        name: undefined,
        image: undefined,
        checkedAt: new Date().toISOString(),
        status: 'UNKNOWN' as AvailabilityStatus,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  }, []);

  // Update a product
  const updateProduct = useCallback((id: string, updates: Partial<TrackedProduct>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
  }, []);

  // Remove a product
  const removeProduct = useCallback((id: string) => {
    stopTracking(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [stopTracking]);

  // Check all products now
  const checkAllNow = useCallback(() => {
    products.forEach(product => checkProduct(product));
  }, [products, checkProduct]);

  // Update global interval
  const updateGlobalInterval = useCallback((interval: number) => {
    setGlobalInterval(interval);
    // Restart all tracking with new interval
    stopAllTracking();
    startAllTracking();
  }, [stopAllTracking, startAllTracking]);

  // Request notification permission
  const enableNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission();
    return permission === 'granted';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(intervalId => clearInterval(intervalId));
      intervalRefs.current.clear();
    };
  }, []);

  // Compute stats
  const stats = {
    total: products.length,
    inStock: products.filter(p => p.status.status === 'IN_STOCK').length,
    outOfStock: products.filter(p => p.status.status === 'OUT_OF_STOCK').length,
    failed: products.filter(p => p.status.status === 'CHECK_FAILED').length,
    unknown: products.filter(p => p.status.status === 'UNKNOWN').length,
  };

  return {
    products,
    isLoading,
    stats,
    globalInterval,
    checkIntervals: CHECK_INTERVALS,
    checkProduct,
    startTracking,
    stopTracking,
    startAllTracking,
    stopAllTracking,
    addProduct,
    updateProduct,
    removeProduct,
    checkAllNow,
    updateGlobalInterval,
    enableNotifications,
  };
}