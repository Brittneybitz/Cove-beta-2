import React, { useState } from 'react';
import {
  CustomModelConfig,
  ModelTarget,
  exportConfigToJSON,
  ModelExportPreset,
} from '../services/customModelStorage';
import { soundManager } from '../audio/soundManager';
import {
  Upload,
  Link,
  Copy,
  ClipboardCheck,
  RotateCcw,
  Sliders,
  Check,
  X,
  Sparkles,
  FileCode,
  Download,
} from 'lucide-react';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: Record<ModelTarget, CustomModelConfig>;
  onSaveModel: (config: CustomModelConfig) => Promise<void>;
  onResetModel: (target: ModelTarget) => Promise<void>;
  onImportConfig: (jsonText: string) => Promise<boolean>;
}

const CREATURE_TABS: { id: ModelTarget; label: string; icon: string; defaultDesc: string }[] = [
  { id: 'orca', label: 'Oreo (Orca)', icon: '🐋', defaultDesc: 'Hero companion with white patches & flukes' },
  { id: 'shark', label: 'Wild Shark', icon: '🦈', defaultDesc: 'Apex predator with sharp dorsal and gills' },
  { id: 'dolphin', label: 'Wild Dolphin', icon: '🐬', defaultDesc: 'Playful marine friend with curved rostrum' },
  { id: 'hammerhead', label: 'Hammerhead', icon: '🦈', defaultDesc: 'Titan predator with T-cephalofoil head' },
  { id: 'manta', label: 'Azure Manta', icon: '🌊', defaultDesc: 'Cove glider with wide diamond pectoral wings' },
  { id: 'fish', label: 'Schooling Fish', icon: '🐟', defaultDesc: 'Ambient orange koi & tropical swimmers' },
];

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
  models,
  onSaveModel,
  onResetModel,
  onImportConfig,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<ModelTarget>('orca');
  const [urlInput, setUrlInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const currentConfig: CustomModelConfig = models[selectedTarget] || {
    target: selectedTarget,
    sourceType: 'default',
    scale: 1.0,
    offsetY: 0,
  };

  // Handle local GLB/GLTF file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      await onSaveModel({
        target: selectedTarget,
        sourceType: 'file',
        fileName: file.name,
        fileBuffer: buffer,
        scale: currentConfig.scale || 1.0,
        offsetY: currentConfig.offsetY || 0,
      });
      soundManager.playCatchSuccess();
    } catch {
      alert('Error loading GLB/GLTF file. Ensure it is a valid 3D file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL model load
  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    try {
      await onSaveModel({
        target: selectedTarget,
        sourceType: 'url',
        url: urlInput.trim(),
        fileName: urlInput.split('/').pop() || 'model.glb',
        scale: currentConfig.scale || 1.0,
        offsetY: currentConfig.offsetY || 0,
      });
      setUrlInput('');
      soundManager.playCatchSuccess();
    } catch {
      alert('Failed to load model from URL. Check if CORS is enabled on the host.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sliders for scale and offset
  const handleScaleChange = async (newScale: number) => {
    await onSaveModel({
      ...currentConfig,
      scale: newScale,
    });
  };

  const handleOffsetChange = async (newOffset: number) => {
    await onSaveModel({
      ...currentConfig,
      offsetY: newOffset,
    });
  };

  // Copy Config JSON to clipboard
  const handleCopyConfig = () => {
    const json = exportConfigToJSON(models);
    navigator.clipboard.writeText(json);
    setCopied(true);
    soundManager.playForage();
    setTimeout(() => setCopied(false), 2000);
  };

  // Paste & Apply Config
  const handleApplyPastedConfig = async () => {
    if (!pastedJson.trim()) return;
    setIsLoading(true);
    try {
      const success = await onImportConfig(pastedJson);
      if (success) {
        setImportStatus('Config applied successfully!');
        soundManager.playCatchSuccess();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Invalid JSON format or missing model keys.');
      }
    } catch {
      setImportStatus('Failed to parse JSON config.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-500/40 rounded-2xl p-6 text-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/40 text-lg">
              📦
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300">3D Creature Model Manager</h2>
              <p className="text-xs text-slate-400">
                Load, customize, and save custom .GLB models for any creature in the cove
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Creature Selector Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-4 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
          {CREATURE_TABS.map((tab) => {
            const hasCustom = models[tab.id]?.sourceType && models[tab.id].sourceType !== 'default';
            const isActive = selectedTarget === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedTarget(tab.id);
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs transition-all relative ${
                  isActive
                    ? 'bg-sky-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="truncate max-w-full text-[11px] mt-0.5">{tab.label.split(' ')[0]}</span>
                {hasCustom && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Creature Management Panel */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {/* Status Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-sky-300">
                  {CREATURE_TABS.find((t) => t.id === selectedTarget)?.label}
                </span>
                {currentConfig.sourceType !== 'default' ? (
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-md font-medium">
                    Custom Model Active: {currentConfig.fileName || 'URL Model'}
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md font-medium">
                    Default Procedural Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {CREATURE_TABS.find((t) => t.id === selectedTarget)?.defaultDesc}
              </p>
            </div>

            {currentConfig.sourceType !== 'default' && (
              <button
                onClick={() => onResetModel(selectedTarget)}
                className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/50 hover:bg-rose-950 border border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset to Default</span>
              </button>
            )}
          </div>

          {/* Model Import Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Upload Local File */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                  <Upload size={15} className="text-sky-400" />
                  <span>Upload Local 3D Model</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Upload your own <code>.glb</code> or <code>.gltf</code> file (e.g. from Sketchfab or Blender). Saved permanently to your browser!
                </p>
              </div>

              <label className="cursor-pointer flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl text-sky-300 transition-colors">
                <Upload size={15} />
                <span>Select .GLB / .GLTF File</span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </div>

            {/* 2. Load from Direct URL */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                  <Link size={15} className="text-sky-400" />
                  <span>Load from Model URL</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Paste a direct link to a hosted <code>.glb</code> model file.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/orca.glb"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
                <button
                  onClick={handleUrlLoad}
                  disabled={!urlInput.trim() || isLoading}
                  className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition-colors"
                >
                  Load
                </button>
              </div>
            </div>
          </div>

          {/* Model Adjustments (Scale & Offset) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Sliders size={15} className="text-sky-400" />
              <span>Proportions & Alignment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Model Scale</span>
                  <span className="font-mono text-sky-400">
                    {(currentConfig.scale || 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={currentConfig.scale || 1.0}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Vertical Offset (Y)</span>
                  <span className="font-mono text-sky-400">
                    {(currentConfig.offsetY || 0).toFixed(2)}m
                  </span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.1"
                  value={currentConfig.offsetY || 0}
                  onChange={(e) => handleOffsetChange(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Copy & Paste Configuration (Full Portability) */}
          <div className="bg-slate-950/60 border border-purple-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <FileCode size={15} />
                <span>Copy & Paste Model Configuration</span>
              </div>
              <button
                onClick={handleCopyConfig}
                className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold py-1 px-3 rounded-lg transition-colors"
              >
                {copied ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied Config!' : 'Copy Config JSON'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Copy your creature configurations (model links, scales, alignments) to backup, share, or paste into another session:
            </p>

            <div className="space-y-2">
              <textarea
                rows={3}
                placeholder="Paste model configuration JSON here to import..."
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-hidden focus:border-purple-500 resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-medium">
                  {importStatus}
                </span>
                <button
                  onClick={handleApplyPastedConfig}
                  disabled={!pastedJson.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                >
                  Import & Apply Configuration
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>💡 Models persist in your browser across sessions.</span>
          <button
            onClick={onClose}
            className="font-semibold bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
