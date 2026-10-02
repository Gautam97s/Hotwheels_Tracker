'use client';

import { useState } from 'react';
import { CHECK_INTERVALS } from '@/types/product';
import { cn } from '@/lib/utils';
import { NotificationSettings } from './notification-settings';
import { Trash2, RotateCcw, Download, Upload, FileText, Bell, Info, Plus, Edit, Trash, Save, X, Loader2, Shield } from 'lucide-react';
import { useTrackerConfig } from '@/hooks/use-tracker-config';
import { Platform, PLATFORMS } from '@/types/product';

export function SettingsPanel() {
  const { config, loading, error, updateConfig, addProduct, updateProduct, removeProduct, updateTelegram, fetchConfig } = useTrackerConfig();
  const [exportData, setExportData] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    pincode: '',
    urls: { blinkit: '', zepto: '', firstcry: '', amazon: '' },
    checkIntervalMinutes: 10,
    notifyOnRestock: true,
    targetPrice: 199,
  });
  const [saving, setSaving] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    pincode: '110001',
    urls: { blinkit: '', zepto: '', firstcry: '', amazon: '' },
    checkIntervalMinutes: 10,
    notifyOnRestock: true,
    targetPrice: 199,
  });

  const handleExport = () => {
    if (!config) return;
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      config,
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
    a.download = `hotwheels-config-${new Date().toISOString().split('T')[0]}.json`;
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
      if (data.config) {
        await updateConfig(data.config);
        alert('Config imported successfully!');
      } else {
        alert('Invalid config format');
      }
    } catch {
      alert('Failed to import: Invalid file format');
    }
  };

  const handleClearAll = async () => {
    if (confirm('This will delete ALL tracked cars and settings. Are you sure?')) {
      await updateConfig({ products: [], telegram: { botToken: '', chatId: '', enabled: false } });
    }
  };

  const startEditProduct = (product: NonNullable<typeof config>['products'][0]) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name,
      pincode: product.pincode,
      urls: {
        blinkit: product.urls.blinkit || '',
        zepto: product.urls.zepto || '',
        firstcry: product.urls.firstcry || '',
        amazon: product.urls.amazon || '',
      },
      checkIntervalMinutes: product.checkIntervalMinutes,
      notifyOnRestock: product.notifyOnRestock,
      targetPrice: product.targetPrice || 199,
    });
  };

  const saveEditProduct = async () => {
    if (!editingProductId) return;
    setSaving(true);
    const success = await updateProduct(editingProductId, editForm);
    if (success) {
      setEditingProductId(null);
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Delete this product from tracking?')) {
      await removeProduct(id);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) return;
    setSaving(true);
    const product = {
      id: `hw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newProduct,
    };
    const success = await addProduct(product);
    if (success) {
      setShowAddProduct(false);
      setNewProduct({ name: '', pincode: '110001', urls: { blinkit: '', zepto: '', firstcry: '', amazon: '' }, checkIntervalMinutes: 10, notifyOnRestock: true, targetPrice: 199 });
    }
    setSaving(false);
  };

  const handleUrlChange = (platform: Platform, url: string) => {
    if (editingProductId) {
      setEditForm(prev => ({ ...prev, urls: { ...prev.urls, [platform]: url } }));
    } else {
      setNewProduct(prev => ({ ...prev, urls: { ...prev.urls, [platform]: url } }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="card p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading config...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="card p-6 text-center text-destructive">
          <Shield className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load config: {error}</p>
          <button onClick={fetchConfig} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Products List */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Tracked Products ({config?.products.length || 0})
          </h3>
          <button
            onClick={() => setShowAddProduct(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {config?.products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No products tracked yet</p>
            <p className="text-sm">Click "Add Product" to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config?.products.map(product => (
              <div
                key={product.id}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  editingProductId === product.id ? 'border-primary bg-primary/5' : 'hover:border-primary/20'
                )}
              >
                {editingProductId === product.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field flex-1"
                        placeholder="Product name"
                      />
                      <input
                        type="text"
                        value={editForm.pincode}
                        onChange={e => setEditForm(prev => ({ ...prev, pincode: e.target.value }))}
                        className="input-field w-24 text-center"
                        placeholder="Pincode"
                        maxLength={6}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {PLATFORMS.map(p => (
                        <div key={p.id} className="md:col-span-1">
                          <label className="block text-xs text-muted-foreground mb-1">{p.name}</label>
                          <input
                            type="url"
                            value={editForm.urls[p.id]}
                            onChange={e => handleUrlChange(p.id, e.target.value)}
                            className="input-field text-sm"
                            placeholder={p.id}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Check Interval</label>
                        <select
                          value={editForm.checkIntervalMinutes}
                          onChange={e => setEditForm(prev => ({ ...prev, checkIntervalMinutes: Number(e.target.value) }))}
                          className="input-field text-sm"
                        >
                          {CHECK_INTERVALS.map(i => (
                            <option key={i.value} value={i.value / 60000}>{i.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Target Price (₹)</label>
                        <input
                          type="number"
                          value={editForm.targetPrice}
                          onChange={e => setEditForm(prev => ({ ...prev, targetPrice: Number(e.target.value) }))}
                          className="input-field text-sm"
                          placeholder="199"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.notifyOnRestock}
                            onChange={e => setEditForm(prev => ({ ...prev, notifyOnRestock: e.target.checked }))}
                            className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <span className="text-sm">Notify on restock</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={saveEditProduct} disabled={saving} className="btn-primary flex-1">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                      </button>
                      <button onClick={cancelEdit} className="btn-outline flex-1">
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{product.name}</h4>
                        <span className="px-2 py-0.5 text-xs bg-muted rounded">Pincode: {product.pincode}</span>
                        {product.targetPrice && (
                          <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning rounded">Target: ≤₹{product.targetPrice}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {PLATFORMS.filter(p => product.urls[p.id]).map(p => (
                          <span key={p.id} className={cn('px-2 py-0.5 rounded', p.color + '/20 text-' + p.color.replace('bg-', '').replace('-500', '-700'))}>
                            {p.icon} {p.name}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Check: every {product.checkIntervalMinutes} min</span>
                        <span>{product.notifyOnRestock ? '🔔 Alerts ON' : '🔕 Alerts OFF'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="btn-ghost p-2"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="btn-ghost p-2 text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-xl shadow-xl animate-in slide-in-from-top-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="btn-ghost p-1.5" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Hot Wheels Porsche 911 GT3 RS"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode</label>
                <input
                  type="text"
                  value={newProduct.pincode}
                  onChange={e => setNewProduct(prev => ({ ...prev, pincode: e.target.value }))}
                  className="input-field w-24"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Product URLs (at least one required)</label>
                {PLATFORMS.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className={cn('w-8 text-center text-sm', p.color.replace('bg-', 'text-'))}>{p.icon}</span>
                    <input
                      type="url"
                      value={newProduct.urls[p.id]}
                      onChange={e => handleUrlChange(p.id, e.target.value)}
                      className="input-field"
                      placeholder={`${p.name} URL`}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Check Interval</label>
                  <select
                    value={newProduct.checkIntervalMinutes}
                    onChange={e => setNewProduct(prev => ({ ...prev, checkIntervalMinutes: Number(e.target.value) }))}
                    className="input-field"
                  >
                    {CHECK_INTERVALS.map(i => <option key={i.value} value={i.value / 60000}>{i.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    value={newProduct.targetPrice}
                    onChange={e => setNewProduct(prev => ({ ...prev, targetPrice: Number(e.target.value) }))}
                    className="input-field"
                    placeholder="199"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newProduct.notifyOnRestock}
                  onChange={e => setNewProduct(prev => ({ ...prev, notifyOnRestock: e.target.checked }))}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm">Notify when in stock at/below target price</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddProduct(false)} className="btn-outline flex-1">Cancel</button>
                <button onClick={handleAddProduct} disabled={saving || !newProduct.name.trim()} className="btn-primary flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Check Interval */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-primary" />
          Global Check Interval
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          How often to check all tracked products for availability.
        </p>
        <div className="flex flex-wrap gap-2">
          {CHECK_INTERVALS.map(interval => (
            <button
              key={interval.value}
              onClick={() => updateConfig({ 
                products: config?.products.map(p => ({ ...p, checkIntervalMinutes: interval.value / 60000 })) || [] 
              })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                config?.products[0]?.checkIntervalMinutes === interval.value / 60000
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      {/* Telegram Notifications */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          Notifications
        </h3>
        <NotificationSettings
          browserEnabled={config?.telegram.enabled || false}
          soundEnabled={false}
          onBrowserToggle={async (enabled) => {
            await updateTelegram({ enabled, botToken: config?.telegram.botToken || '', chatId: config?.telegram.chatId || '' });
          }}
          onSoundToggle={() => {}}
        />
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Bot Token</label>
            <input
              type="password"
              value={config?.telegram.botToken || ''}
              onChange={e => updateTelegram({ botToken: e.target.value, enabled: config?.telegram.enabled || false, chatId: config?.telegram.chatId || '' })}
              className="input-field"
              placeholder="123456789:ABCdefGHI..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Chat ID</label>
            <input
              type="text"
              value={config?.telegram.chatId || ''}
              onChange={e => updateTelegram({ chatId: e.target.value, enabled: config?.telegram.enabled || false, botToken: config?.telegram.botToken || '' })}
              className="input-field"
              placeholder="123456789"
            />
          </div>
        </div>
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
              <p className="font-medium">Export Config</p>
              <p className="text-sm text-muted-foreground">Download all products and settings as JSON</p>
            </div>
            <button onClick={handleExport} className="btn-outline flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Import Config</p>
              <p className="text-sm text-muted-foreground">Restore from a previously exported JSON file</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file" />
              <label htmlFor="import-file" className="btn-outline flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Choose File
              </label>
              {importFile && <button onClick={handleImportConfirm} className="btn-primary text-sm">Import</button>}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
            <div>
              <p className="font-medium text-destructive">Clear All Data</p>
              <p className="text-sm text-muted-foreground">Permanently delete all products and settings</p>
            </div>
            <button onClick={handleClearAll} className="btn-outline text-destructive border-destructive/50 hover:bg-destructive/10 flex items-center gap-2">
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
          <p>Config stored in Vercel KV - synced across frontend & backend</p>
          <div className="pt-3 border-t">
            <p className="font-medium text-foreground mb-2">Supported Platforms:</p>
            <ul className="space-y-1">
              {PLATFORMS.map(p => <li key={p.id}>• {p.name}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}