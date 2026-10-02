'use client';

import { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestNotificationPermission, getNotificationPermission, canNotify } from '@/lib/notifications';

interface NotificationSettingsProps {
  browserEnabled: boolean;
  soundEnabled: boolean;
  onBrowserToggle: (enabled: boolean) => void;
  onSoundToggle: (enabled: boolean) => void;
}

export function NotificationSettings({ 
  browserEnabled, 
  soundEnabled, 
  onBrowserToggle, 
  onSoundToggle 
}: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleBrowserToggle = async () => {
    const newEnabled = !browserEnabled;
    
    if (newEnabled && permission !== 'granted') {
      setIsRequesting(true);
      const granted = await requestNotificationPermission();
      setPermission(granted);
      setIsRequesting(false);
      
      if (granted === 'granted') {
        onBrowserToggle(true);
      }
    } else {
      onBrowserToggle(newEnabled);
    }
  };

  const handleSoundToggle = () => {
    onSoundToggle(!soundEnabled);
  };

  const permissionStatus = {
    granted: { label: 'Granted', color: 'text-success', icon: Check },
    denied: { label: 'Blocked', color: 'text-destructive', icon: X },
    default: { label: 'Not requested', color: 'text-muted-foreground', icon: X },
  }[permission];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Browser Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Get alerted when a tracked car comes back in stock
            </p>
          </div>
        </div>
        <button
          onClick={handleBrowserToggle}
          disabled={isRequesting}
          className={cn(
            'relative w-12 h-7 rounded-full transition-colors',
            browserEnabled ? 'bg-primary' : 'bg-muted'
          )}
          aria-label={browserEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform',
              browserEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          >
            {isRequesting ? (
              <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              browserEnabled ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </span>
        </button>
      </div>

      {permission !== 'granted' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pl-10">
          <span className={cn(permissionStatus.color)}>●</span>
          <span>Permission: {permissionStatus.label}</span>
          {permission === 'denied' && (
            <span className="text-xs">(Enable in browser settings)</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-primary" />
            ) : (
              <VolumeX className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-medium">Sound Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Play a notification sound when a car is restocked
            </p>
          </div>
        </div>
        <button
          onClick={handleSoundToggle}
          disabled={!browserEnabled}
          className={cn(
            'relative w-12 h-7 rounded-full transition-colors',
            soundEnabled ? 'bg-primary' : 'bg-muted',
            !browserEnabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform',
              soundEnabled ? 'translate-x-5' : 'translate-x-0'
            )}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </span>
        </button>
      </div>

      {!browserEnabled && soundEnabled && (
        <p className="text-xs text-muted-foreground pl-10">
          Sound alerts require browser notifications to be enabled
        </p>
      )}

      <div className="p-3 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground">
          <strong>How it works:</strong> Notifications only work while this tab is open. 
          The browser cannot check for stock changes when the tab is closed.
        </p>
      </div>
    </div>
  );
}