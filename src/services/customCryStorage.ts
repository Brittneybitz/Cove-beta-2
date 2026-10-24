// Storage and playback service for custom whale cries
export type CryEmotion =
  | 'happy'
  | 'cute'
  | 'fighting'
  | 'victory'
  | 'angry'
  | 'sad'
  | 'ko';

export interface CustomCryConfig {
  emotion: CryEmotion;
  dataUrl: string; // Base64 data URL (e.g. data:audio/webm;base64,...)
  fileName?: string;
  duration?: number;
  lastUpdated: number;
}

export interface CryEmotionMeta {
  emotion: CryEmotion;
  label: string;
  description: string;
  icon: string;
  defaultDescription: string;
}

export const CRY_EMOTION_METAS: CryEmotionMeta[] = [
  {
    emotion: 'happy',
    label: 'Happy & Greeting',
    description: 'Played when answering your whistle, greeting you at the screen, or eating treats.',
    icon: '💖',
    defaultDescription: 'Dual-tone joyful whale whistle glissando with bell shimmer.',
  },
  {
    emotion: 'cute',
    label: 'Cute & Petting',
    description: 'Played when stroking or petting Oreo close up on the screen, or gentle clicks.',
    icon: '🥰',
    defaultDescription: 'Sweet rhythmic echolocation clicks and soft underwater purrs.',
  },
  {
    emotion: 'fighting',
    label: 'Fighting Attack',
    description: 'Played in battle when Oreo unleashes Splash Wave or Tidal Crash.',
    icon: '⚔️',
    defaultDescription: 'Resonant underwater sonic boom and deep battle roar.',
  },
  {
    emotion: 'victory',
    label: 'Victory & Catch',
    description: 'Played upon winning battles, catching new creatures, or leveling up.',
    icon: '🏆',
    defaultDescription: 'Uplifting celebratory oceanic fanfare.',
  },
  {
    emotion: 'angry',
    label: 'Angry & Raid Alert',
    description: 'Played when sharks raid the cove or when provoked.',
    icon: '💢',
    defaultDescription: 'Low menacing oceanic rumble and warning clicks.',
  },
  {
    emotion: 'sad',
    label: 'Sad & Distressed',
    description: 'Played when sick, facing eviction, or having low pod happiness.',
    icon: '😢',
    defaultDescription: 'Descending melancholic low-frequency whale moan.',
  },
  {
    emotion: 'ko',
    label: 'K.O. & Faint',
    description: 'Played when falling to 0 HP in battle or exhausting all stamina.',
    icon: '💫',
    defaultDescription: 'Slow pitch-dropping flutter and faint underwater ripple.',
  },
];

const DB_NAME = 'WhaleCoveCryDB';
const DB_VERSION = 1;
const STORE_NAME = 'whale_cries';

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
        db.createObjectStore(STORE_NAME, { keyPath: 'emotion' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// In-memory audio elements cache for zero-latency instant playback
const audioCache: Partial<Record<CryEmotion, HTMLAudioElement>> = {};

export async function saveCustomCry(
  emotion: CryEmotion,
  dataUrl: string,
  fileName?: string,
  duration?: number
): Promise<void> {
  const record: CustomCryConfig = {
    emotion,
    dataUrl,
    fileName: fileName || `${emotion}_cry.webm`,
    duration,
    lastUpdated: Date.now(),
  };

  // Update in-memory cache
  try {
    const audio = new Audio(dataUrl);
    audioCache[emotion] = audio;
  } catch {
    // Ignore audio pre-creation error
  }

  // 1. Save to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[CustomCryStorage] IndexedDB save failed, using localStorage:', err);
  }

  // 2. Backup to localStorage (if dataUrl is reasonable size)
  try {
    if (dataUrl.length < 2_500_000) {
      localStorage.setItem(`whale_cry_${emotion}`, JSON.stringify(record));
    }
  } catch {
    // LocalStorage quota safety
  }
}

export async function getCustomCry(emotion: CryEmotion): Promise<CustomCryConfig | null> {
  try {
    const db = await openDB();
    const result = await new Promise<CustomCryConfig | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(emotion);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
    if (result) {
      if (!audioCache[emotion]) {
        audioCache[emotion] = new Audio(result.dataUrl);
      }
      return result;
    }
  } catch {
    // fallback
  }

  try {
    const local = localStorage.getItem(`whale_cry_${emotion}`);
    if (local) {
      const parsed = JSON.parse(local) as CustomCryConfig;
      if (!audioCache[emotion]) {
        audioCache[emotion] = new Audio(parsed.dataUrl);
      }
      return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function getAllCustomCries(): Promise<Partial<Record<CryEmotion, CustomCryConfig>>> {
  const result: Partial<Record<CryEmotion, CustomCryConfig>> = {};

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as CustomCryConfig[];
        list.forEach((item) => {
          result[item.emotion] = item;
          if (!audioCache[item.emotion]) {
            audioCache[item.emotion] = new Audio(item.dataUrl);
          }
        });
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch {
    // fallback
  }

  // Fallback / merge from localStorage
  const emotions: CryEmotion[] = ['happy', 'cute', 'fighting', 'victory', 'angry', 'sad', 'ko'];
  emotions.forEach((emo) => {
    if (!result[emo]) {
      try {
        const local = localStorage.getItem(`whale_cry_${emo}`);
        if (local) {
          const parsed = JSON.parse(local) as CustomCryConfig;
          result[emo] = parsed;
          if (!audioCache[emo]) {
            audioCache[emo] = new Audio(parsed.dataUrl);
          }
        }
      } catch {
        // ignore
      }
    }
  });

  return result;
}

export async function deleteCustomCry(emotion: CryEmotion): Promise<void> {
  delete audioCache[emotion];
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(emotion);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }

  try {
    localStorage.removeItem(`whale_cry_${emotion}`);
  } catch {
    // ignore
  }
}

/**
 * Play custom cry for an emotion if uploaded; returns true if custom cry played,
 * or false if default fallback should be played.
 */
export function playCustomCryIfAvailable(emotion: CryEmotion): boolean {
  const cachedAudio = audioCache[emotion];
  if (cachedAudio) {
    try {
      cachedAudio.currentTime = 0;
      cachedAudio.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function exportCriesToJSON(): Promise<string> {
  const all = await getAllCustomCries();
  return JSON.stringify(
    {
      format: 'whale-cove-cry-pack',
      version: 1,
      exportedAt: new Date().toISOString(),
      cries: all,
    },
    null,
    2
  );
}

export async function importCriesFromJSON(jsonText: string): Promise<number> {
  const parsed = JSON.parse(jsonText);
  if (!parsed || !parsed.cries) throw new Error('Invalid cry pack JSON format');
  let count = 0;
  for (const [key, val] of Object.entries(parsed.cries)) {
    const emotion = key as CryEmotion;
    const config = val as CustomCryConfig;
    if (config && config.dataUrl) {
      await saveCustomCry(emotion, config.dataUrl, config.fileName, config.duration);
      count++;
    }
  }
  return count;
}

export function fileToDataUrl(file: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}
