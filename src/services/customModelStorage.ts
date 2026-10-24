import { CreatureType } from '../types/game';

export type ModelTarget = CreatureType | 'fish';

export interface CustomModelConfig {
  target: ModelTarget;
  sourceType: 'default' | 'url' | 'file';
  url?: string;
  fileName?: string;
  fileBuffer?: ArrayBuffer;
  base64Data?: string;
  skinFileName?: string;
  skinBuffer?: ArrayBuffer;
  skinBase64?: string;
  scale: number;
  offsetY: number;
  rotationY?: number;
  lastUpdated?: number;
}

const DB_NAME = 'WhaleCoveModelDB';
const DB_VERSION = 3;
const STORE_NAME = 'custom_models';

// ArrayBuffer to Base64 helper
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Base64 to ArrayBuffer helper
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'target' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomModel(config: CustomModelConfig): Promise<void> {
  // If we have an ArrayBuffer and no base64, create base64 backup
  let base64 = config.base64Data;
  if (config.fileBuffer && !base64) {
    try {
      base64 = arrayBufferToBase64(config.fileBuffer);
    } catch {
      // ignore
    }
  }

  let skinBase64 = config.skinBase64;
  if (config.skinBuffer && !skinBase64) {
    try {
      skinBase64 = arrayBufferToBase64(config.skinBuffer);
    } catch {
      // ignore
    }
  }

  const modelRecord: CustomModelConfig = {
    ...config,
    base64Data: base64,
    skinBase64: skinBase64,
    lastUpdated: Date.now(),
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(modelRecord);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // If IndexedDB fails, save metadata in localStorage
  }

  // Also store metadata in localStorage for instant synchronization
  try {
    const meta = JSON.parse(localStorage.getItem('whale_cove_models_meta') || '{}');
    meta[config.target] = {
      target: config.target,
      sourceType: config.sourceType,
      url: config.url,
      fileName: config.fileName,
      skinFileName: config.skinFileName,
      scale: config.scale,
      offsetY: config.offsetY,
      rotationY: config.rotationY || 0,
      lastUpdated: Date.now(),
      base64Data: base64 && base64.length < 2500000 ? base64 : undefined,
      skinBase64: skinBase64 && skinBase64.length < 2500000 ? skinBase64 : undefined,
    };
    localStorage.setItem('whale_cove_models_meta', JSON.stringify(meta));
  } catch {
    // Storage quota protection
  }
}

export async function getCustomModel(target: ModelTarget): Promise<CustomModelConfig | null> {
  try {
    const db = await openDB();
    const result = await new Promise<CustomModelConfig | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(target);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (result) {
      if (!result.fileBuffer && result.base64Data) {
        result.fileBuffer = base64ToArrayBuffer(result.base64Data);
      }
      if (!result.skinBuffer && result.skinBase64) {
        result.skinBuffer = base64ToArrayBuffer(result.skinBase64);
      }
      return result;
    }
  } catch {
    // Fallback to localStorage
  }

  try {
    const meta = JSON.parse(localStorage.getItem('whale_cove_models_meta') || '{}');
    const item = meta[target];
    if (item) {
      if (item.base64Data) {
        item.fileBuffer = base64ToArrayBuffer(item.base64Data);
      }
      if (item.skinBase64) {
        item.skinBuffer = base64ToArrayBuffer(item.skinBase64);
      }
      return item;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function getAllCustomModels(): Promise<Record<ModelTarget, CustomModelConfig>> {
  const result = {} as Record<ModelTarget, CustomModelConfig>;

  // 1. Load from IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as CustomModelConfig[];
        list.forEach((item) => {
          if (!item.fileBuffer && item.base64Data) {
            item.fileBuffer = base64ToArrayBuffer(item.base64Data);
          }
          if (!item.skinBuffer && item.skinBase64) {
            item.skinBuffer = base64ToArrayBuffer(item.skinBase64);
          }
          result[item.target] = item;
        });
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch {
    // fallback
  }

  // 2. Fallback / Merge from localStorage metadata if IndexedDB missed anything
  try {
    const meta = JSON.parse(localStorage.getItem('whale_cove_models_meta') || '{}');
    Object.keys(meta).forEach((key) => {
      const t = key as ModelTarget;
      if (!result[t] && meta[t]) {
        const item = meta[t];
        if (item.base64Data && !item.fileBuffer) {
          item.fileBuffer = base64ToArrayBuffer(item.base64Data);
        }
        if (item.skinBase64 && !item.skinBuffer) {
          item.skinBuffer = base64ToArrayBuffer(item.skinBase64);
        }
        result[t] = item;
      }
    });
  } catch {
    // ignore
  }

  return result;
}

export async function deleteCustomModel(target: ModelTarget): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(target);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }

  try {
    const meta = JSON.parse(localStorage.getItem('whale_cove_models_meta') || '{}');
    delete meta[target];
    localStorage.setItem('whale_cove_models_meta', JSON.stringify(meta));
  } catch {
    // ignore
  }
}

export interface ModelExportPreset {
  version: number;
  models: Partial<
    Record<
      ModelTarget,
      {
        url?: string;
        fileName?: string;
        base64Data?: string;
        skinFileName?: string;
        skinBase64?: string;
        scale: number;
        offsetY: number;
        rotationY?: number;
      }
    >
  >;
}

export function exportConfigToJSON(models: Record<ModelTarget, CustomModelConfig>): string {
  const exportData: ModelExportPreset = {
    version: 3,
    models: {},
  };

  (Object.keys(models) as ModelTarget[]).forEach((key) => {
    const m = models[key];
    if (m && (m.sourceType !== 'default' || m.skinBase64 || m.skinFileName)) {
      exportData.models[key] = {
        url: m.url,
        fileName: m.fileName,
        base64Data: m.base64Data,
        skinFileName: m.skinFileName,
        skinBase64: m.skinBase64,
        scale: m.scale,
        offsetY: m.offsetY,
        rotationY: m.rotationY || 0,
      };
    }
  });

  return JSON.stringify(exportData, null, 2);
}
