'use client';

import { TrackedProduct } from '@/types/product';

let audioContext: AudioContext | null = null;
let notificationPermission: NotificationPermission = 'default';

export function initNotifications(): void {
  if (typeof window === 'undefined') return;
  if ('Notification' in window) {
    notificationPermission = Notification.permission;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied';
  if (!('Notification' in window)) return 'denied';
  
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  
  const permission = await Notification.requestPermission();
  notificationPermission = permission;
  return permission;
}

export function showNotification(product: TrackedProduct, previousStatus: string): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (previousStatus === 'IN_STOCK') return; // Don't notify if already in stock
  
  const platform = product.platform.charAt(0).toUpperCase() + product.platform.slice(1);
  const price = product.status.price ? `₹${product.status.price}` : '';
  
  const notification = new Notification('🔥 Hot Wheels Restocked!', {
    body: `${product.name} is now available.\n${price} on ${platform}`,
    icon: product.image || '/icon-192.png',
    tag: `hotwheels-${product.id}`,
    requireInteraction: true,
  });
  
  notification.onclick = () => {
    window.focus();
    window.open(product.url, '_blank');
    notification.close();
  };
  
  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000);
}

export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Create a pleasant notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Two-tone notification sound
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.15); // E6
    oscillator.frequency.setValueAtTime(1760, audioContext.currentTime + 0.3); // A6
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined') return 'denied';
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export function canNotify(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
}