'use client';

import { useState, useRef, useEffect } from 'react';
import { Platform, PLATFORMS, getPlatformFromUrl } from '@/types/product';
import { cn } from '@/lib/utils';
import { X, Loader2, ExternalLink, Search, Image, Link2, Trash2 } from 'lucide-react';

interface AddProductProps {
  onAdd: (product: {
    name: string;
    image?: string;
    url: string;
    platform: Platform;
    checkInterval: number;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
  }) => void;
  onClose: () => void;
  defaultInterval: number;
}

export function AddProduct({ onAdd, onClose, defaultInterval }: AddProductProps) {
  const [step, setStep] = useState<'url' | 'manual'>('url');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [platform, setPlatform] = useState<Platform>('blinkit');
  const [checkInterval, setCheckInterval] = useState(defaultInterval);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect platform from URL
  useEffect(() => {
    if (url) {
      const detected = getPlatformFromUrl(url);
      if (detected) {
        setPlatform(detected);
      }
    }
  }, [url]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      setExtractError('Please enter a valid URL');
      return;
    }

    const detectedPlatform = getPlatformFromUrl(url);
    if (!detectedPlatform) {
      setExtractError('This URL is not from a supported platform (Blinkit, Zepto, FirstCry, Amazon India)');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    // Simulate extraction attempt - in reality, this would be blocked by CORS
    // We'll show the manual fallback after a short delay
    setTimeout(() => {
      setIsExtracting(false);
      setShowManualFallback(true);
      setExtractError('Unable to extract product details automatically. This marketplace blocks browser-based requests.');
    }, 1500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    try {
      new URL(url);
    } catch {
      setExtractError('Please enter a valid URL');
      return;
    }

    onAdd({
      name: name.trim(),
      image: image.trim() || undefined,
      url: url.trim(),
      platform,
      checkInterval,
      notificationsEnabled,
      soundEnabled,
    });
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlPaste = (e: React.ClipboardEvent) => {
    const pastedUrl = e.clipboardData.getData('text');
    if (pastedUrl.startsWith('http') || pastedUrl.startsWith('data:')) {
      e.preventDefault();
      setImage(pastedUrl);
    }
  };

  const resetForm = () => {
    setStep('url');
    setUrl('');
    setName('');
    setImage('');
    setPlatform('blinkit');
    setCheckInterval(defaultInterval);
    setNotificationsEnabled(true);
    setSoundEnabled(true);
    setIsExtracting(false);
    setExtractError(null);
    setShowManualFallback(false);
  };

  useEffect(() => {
    resetForm();
  }, []);

  const platformOptions = PLATFORMS.map(p => ({
    value: p.id,
    label: p.name,
    icon: p.icon,
    color: p.color,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <div className="w-full max-w-md bg-card rounded-xl shadow-xl animate-in slide-in-from-top-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add Hot Wheels Car</h2>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5 rounded-lg hover:bg-accent"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium', step === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              1
            </div>
            <span className={cn('text-sm font-medium', step === 'url' ? 'text-foreground' : 'text-muted-foreground')}>
              Product URL
            </span>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium', step === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              2
            </div>
            <span className={cn('text-sm font-medium', step === 'manual' ? 'text-foreground' : 'text-muted-foreground')}>
              Details
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {step === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label htmlFor="product-url" className="block text-sm font-medium mb-1">
                  Product URL
                </label>
                <div className="relative">
                  <input
                    id="product-url"
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://blinkit.com/product/... or https://www.zepto.com/..."
                    className={cn('input-field pr-10', extractError && 'border-destructive')}
                    disabled={isExtracting}
                    autoFocus
                  />
                  {isExtracting && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {extractError && (
                  <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                    <X className="w-3.5 h-3.5" />
                    {extractError}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported: Blinkit, Zepto, FirstCry, Amazon India
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Check Interval</label>
                <select
                  value={checkInterval}
                  onChange={e => setCheckInterval(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={30 * 1000}>Every 30 seconds</option>
                  <option value={60 * 1000}>Every 1 minute</option>
                  <option value={5 * 60 * 1000}>Every 5 minutes (default)</option>
                  <option value={10 * 60 * 1000}>Every 10 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={e => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Enable browser notifications when restocked</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={e => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                    disabled={!notificationsEnabled}
                  />
                  <span className={cn('text-sm', !notificationsEnabled && 'text-muted-foreground')}>
                    Play sound alert
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('manual')}
                  className="btn-outline flex-1"
                >
                  Enter Details Manually
                </button>
                <button
                  type="submit"
                  disabled={isExtracting || !url.trim()}
                  className="btn-primary flex-1"
                >
                  {isExtracting ? 'Trying to Extract...' : 'Try Auto-Extract'}
                </button>
              </div>
            </form>
          )}

          {step === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium mb-1">
                  Car Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Porsche 911 GT3 RS"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="product-image" className="block text-sm font-medium mb-1">
                  Image URL (optional)
                </label>
                <div className="relative">
                  <input
                    id="product-image"
                    type="text"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    onPaste={handleImageUrlPaste}
                    placeholder="Paste image URL or upload file"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost p-1"
                    aria-label="Upload image"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {image && (
                  <div className="mt-2 relative max-w-xs">
                    <img src={image} alt="Preview" className="rounded-lg max-h-32 w-auto" />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-1 right-1 btn-ghost p-1 rounded-full"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="product-url-manual" className="block text-sm font-medium mb-1">
                  Product URL <span className="text-destructive">*</span>
                </label>
                <input
                  id="product-url-manual"
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {platformOptions.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlatform(p.value as Platform)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all',
                        platform === p.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="text-2xl" aria-hidden="true">{p.icon}</span>
                      <span className={cn('text-xs font-medium', platform === p.value ? 'text-primary' : 'text-muted-foreground')}>
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Check Interval</label>
                <select
                  value={checkInterval}
                  onChange={e => setCheckInterval(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={30 * 1000}>Every 30 seconds</option>
                  <option value={60 * 1000}>Every 1 minute</option>
                  <option value={5 * 60 * 1000}>Every 5 minutes (default)</option>
                  <option value={10 * 60 * 1000}>Every 10 minutes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={e => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Enable browser notifications when restocked</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={e => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                    disabled={!notificationsEnabled}
                  />
                  <span className={cn('text-sm', !notificationsEnabled && 'text-muted-foreground')}>
                    Play sound alert
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('url')}
                  className="btn-outline flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Add to Tracker
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Help text */}
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Note: Automatic extraction is blocked by marketplace anti-bot protection. 
            You'll need to enter details manually after providing the URL.
          </p>
        </div>
      </div>
    </div>
  );
}