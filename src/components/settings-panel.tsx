'use client';

import { useState } from 'react';
import { CHECK_INTERVALS, DEFAULT_CHECK_INTERVAL } from '@/types/product';
import { cn } from '@/lib/utils';
import { NotificationSettings } from './notification-settings';
import { Trash2, RotateCcw, Download, Upload, FileText, Bell, Info } from 'lucide-react';
import { getSettings, saveSettings, clearAllData, getStoredProducts } from '@/lib/storage';

interface SettingsPanelProps {
  globalInterval: number;
  onGlobalIntervalChange: (interval: number) => void;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  onNotificationsToggle: (enabled: boolean) => void;
  onSoundToggle: (enabled: boolean) => void;
  onClearAll: () => void;
}

export function SettingsPanel({ 
  globalInterval, 
  onGlobalIntervalChange,
  notificationsEnabled,
  soundEnabled,
  onNotificationsToggle,
  onSoundToggle,
  onClearAll
}: SettingsPanelProps) {
  const [exportData, setExportData] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExport = () => {
    const products = getStoredProducts();
    const settings = getSettings();
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      products,
      settings,
    };
    const json = JSON.stringify(data, null, 2);
    setExportData(json);
    setShowExport(true);
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotwheels-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImportFile(file);
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;
    
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      if (data.products && Array.isArray(data.products)) {
        localStorage.setItem('hotwheels-tracked-products', JSON.stringify(data.products));
      }
      if (data.settings) {
        localStorage.setItem('hotwheels-settings', JSON.stringify(data.settings));
      }
      
      window.location.reload();
    } catch (error) {
      alert('Failed to import: Invalid file format');
    }
  };

  const handleClearAll = () => {
    if (confirm('This will delete ALL tracked cars and settings. Are you sure?')) {
      onClearAll();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Global Check Interval */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary" />
          Global Check Interval
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          How often to check all tracked products for availability. 
          Shorter intervals use more resources but detect changes faster.
        </p>
        <div className="flex flex-wrap gap-2">
          {CHECK_INTERVALS.map(interval => (
            <button
              key={interval.value}
              onClick={() => onGlobalIntervalChange(interval.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                globalInterval === interval.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          Notifications
        </h3>
        <NotificationSettings
          browserEnabled={notificationsEnabled}
          soundEnabled={soundEnabled}
          onBrowserToggle={onNotificationsToggle}
          onSoundToggle={onSoundToggle}
        />
      </div>

      {/* Data Management */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">Download all tracked cars and settings as JSON</p>
            </div>
            <button onClick={handleExport} className="btn-outline flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Import Data</p>
              <p className="text-sm text-muted-foreground">Restore from a previously exported JSON file</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="btn-outline flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Choose File
              </label>
              {importFile && (
                <button onClick={handleImportConfirm} className="btn-primary text-sm">
                  Import
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Clear All Data</p>
              <p className="text-sm text-muted-foreground">Permanently delete all tracked cars and settings</p>
            </div>
            <button 
              onClick={handleClearAll} 
              className="btn-outline text-destructive border-destructive/50 hover:bg-destructive/10 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Info className="w-5 h-5 text-primary" />
          </div>
          About
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Hot Wheels Restock Tracker</strong> v1.0.0</p>
          <p>A frontend-only tracker for Hot Wheels cars across Indian e-commerce platforms.</p>
          <div className="pt-3 border-t">
            <p className="font-medium text-foreground mb-2">Supported Platforms:</p>
            <ul className="space-y-1">
              <li>• Blinkit</li>
              <li>• Zepto</li>
              <li>• FirstCry</li>
              <li>• Amazon India</li>
            </ul>
          </div>
          <div className="pt-3 border-t">
            <p className="font-medium text-foreground mb-2">Limitations:</p>
            <ul className="space-y-1 text-xs">
              <li>• Tracking only works while the browser tab is open</li>
              <li>• Automatic stock checking is blocked by marketplace anti-bot protection</li>
              <li>• Manual verification required via "Open Product" links</li>
              <li>• No backend - all data stored locally in your browser</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}