import React, { useState, useEffect, useRef } from 'react';
import {
  CryEmotion,
  CRY_EMOTION_METAS,
  CustomCryConfig,
  getAllCustomCries,
  saveCustomCry,
  deleteCustomCry,
  exportCriesToJSON,
  importCriesFromJSON,
} from '../services/customCryStorage';
import { soundManager } from '../audio/soundManager';
import {
  Mic,
  MicOff,
  Upload,
  Play,
  RotateCcw,
  Download,
  FolderInput,
  Volume2,
  CheckCircle,
  Sparkles,
  Radio,
  X,
} from 'lucide-react';

interface WhaleCryStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCryUpdated?: (emotion: CryEmotion) => void;
}

export const WhaleCryStudioModal: React.FC<WhaleCryStudioModalProps> = ({
  isOpen,
  onClose,
  onCryUpdated,
}) => {
  const [cries, setCries] = useState<Partial<Record<CryEmotion, CustomCryConfig>>>({});
  const [activeTab, setActiveTab] = useState<CryEmotion>('happy');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingEmotion, setRecordingEmotion] = useState<CryEmotion | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [playingEmotion, setPlayingEmotion] = useState<CryEmotion | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 2800);
  };

  const loadCries = async () => {
    try {
      const stored = await getAllCustomCries();
      setCries(stored);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCries();
    }
  }, [isOpen]);

  const handlePlayCry = (emotion: CryEmotion) => {
    setPlayingEmotion(emotion);
    soundManager.playEmotionCry(emotion);
    setTimeout(() => {
      setPlayingEmotion((c) => (c === emotion ? null : c));
    }, 1500);
  };

  // Start live microphone recording
  const startRecording = async (emotion: CryEmotion) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        // Convert blob to Base64 data URL
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          await saveCustomCry(
            emotion,
            dataUrl,
            `oreo_${emotion}_mic_recording.webm`,
            recordingSeconds
          );
          await loadCries();
          onCryUpdated?.(emotion);
          showToast(`🎙️ Saved custom "${emotion.toUpperCase()}" whale cry!`);
          // Play back recorded audio immediately for confirmation
          soundManager.playEmotionCry(emotion);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingEmotion(emotion);
      setRecordingSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 12) {
            // Auto stop after 12 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      showToast('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingEmotion(null);
  };

  // Upload audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, emotion: CryEmotion) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|webm|flac)$/i)) {
      showToast('Please select a valid audio file (MP3, WAV, OGG, WEBM, M4A).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await saveCustomCry(emotion, dataUrl, file.name);
      await loadCries();
      onCryUpdated?.(emotion);
      showToast(`📁 Uploaded custom cry for "${emotion.toUpperCase()}"!`);
      soundManager.playEmotionCry(emotion);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset emotion cry
  const handleResetCry = async (emotion: CryEmotion) => {
    await deleteCustomCry(emotion);
    await loadCries();
    onCryUpdated?.(emotion);
    showToast(`Restored default procedural sound for "${emotion.toUpperCase()}".`);
  };

  // Export & Import Sound Packs
  const handleExportJSON = async () => {
    try {
      const jsonStr = await exportCriesToJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whale_cove_custom_cries_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📦 Exported custom cry sound pack JSON!');
    } catch {
      showToast('Failed to export sound pack.');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const count = await importCriesFromJSON(text);
        await loadCries();
        showToast(`✨ Successfully imported ${count} custom whale cries!`);
      } catch (err: unknown) {
        showToast(`Import error: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const currentMeta = CRY_EMOTION_METAS.find((m) => m.emotion === activeTab) || CRY_EMOTION_METAS[0];
  const currentRecord = cries[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-cyan-400 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Mic size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                Whale Cry Sound Studio
                <span className="text-xs bg-cyan-950 border border-cyan-500/40 text-cyan-200 px-2.5 py-0.5 rounded-full font-semibold">
                  7 Emotion Categories
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Record or upload your own audio files for Oreo & Pod whale vocalizations!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Emotion Category Tabs */}
        <div className="flex gap-2 overflow-x-auto py-3 border-b border-slate-800 scrollbar-thin">
          {CRY_EMOTION_METAS.map((m) => {
            const hasCustom = Boolean(cries[m.emotion]);
            const isActive = activeTab === m.emotion;
            return (
              <button
                key={m.emotion}
                onClick={() => setActiveTab(m.emotion)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-cyan-600 text-white border-cyan-300 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label.split(' ')[0]}</span>
                {hasCustom && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Custom Voice Loaded" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Emotion Card Content */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{currentMeta.icon}</span>
                <div>
                  <h3 className="text-base font-bold text-white">{currentMeta.label} Cry</h3>
                  <p className="text-xs text-slate-400">{currentMeta.description}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                {currentRecord ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                    <CheckCircle size={12} /> Custom Cry Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    <Volume2 size={12} /> Default Synth
                  </span>
                )}
              </div>
            </div>

            {/* Voice Details */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 text-xs flex flex-col gap-1.5">
              {currentRecord ? (
                <>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">File Name:</span>
                    <span className="font-mono text-cyan-300">{currentRecord.fileName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Loaded:</span>
                    <span className="text-slate-400">
                      {new Date(currentRecord.lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 italic">
                  Default: {currentMeta.defaultDescription}
                </p>
              )}
            </div>

            {/* Interactive Control Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {/* Play / Test Button */}
              <button
                onClick={() => handlePlayCry(currentMeta.emotion)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition border ${
                  playingEmotion === currentMeta.emotion
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg scale-98'
                    : 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400/50'
                }`}
              >
                <Play size={15} fill="currentColor" />
                <span>{playingEmotion === currentMeta.emotion ? 'Playing...' : 'Test Cry'}</span>
              </button>

              {/* Record Microphone Button */}
              {isRecording && recordingEmotion === currentMeta.emotion ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white border border-red-300 animate-pulse"
                >
                  <Radio size={15} />
                  <span>Stop & Save ({recordingSeconds}s)</span>
                </button>
              ) : (
                <button
                  onClick={() => startRecording(currentMeta.emotion)}
                  disabled={isRecording}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-700 hover:bg-rose-600 text-white border border-rose-400/50 disabled:opacity-50 transition"
                >
                  <Mic size={15} />
                  <span>Record with Mic</span>
                </button>
              )}

              {/* Upload Audio File */}
              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition">
                <Upload size={15} />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.flac"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, currentMeta.emotion)}
                />
              </label>
            </div>

            {/* Revert / Reset Button */}
            {currentRecord && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleResetCry(currentMeta.emotion)}
                  className="text-[11px] text-slate-400 hover:text-red-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-red-950/40 border border-transparent hover:border-red-800/40 transition"
                >
                  <RotateCcw size={12} />
                  <span>Reset to default synth sound</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick List of All 7 Emotions & Upload Status */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              All Emotion Sounds ({Object.keys(cries).length} / 7 Custom)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CRY_EMOTION_METAS.map((m) => {
                const hasCustom = Boolean(cries[m.emotion]);
                return (
                  <div
                    key={m.emotion}
                    onClick={() => setActiveTab(m.emotion)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      activeTab === m.emotion
                        ? 'bg-slate-800 border-cyan-400'
                        : 'bg-slate-950/50 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span>{m.icon}</span>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {m.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasCustom ? (
                        <span className="text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                          Custom
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                          Synth
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayCry(m.emotion);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-300 transition"
                        title="Quick Play"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Export / Import Sound Pack & Close */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold transition"
              title="Download your custom cries as a JSON pack"
            >
              <Download size={13} />
              <span>Export Sound Pack</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold cursor-pointer transition">
              <FolderInput size={13} />
              <span>Import Sound Pack</span>
              <input
                ref={jsonImportRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
              />
            </label>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-lg"
          >
            Done
          </button>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs px-4 py-1.5 rounded-full shadow-2xl animate-in fade-in flex items-center gap-2 pointer-events-none">
            <Sparkles size={14} className="text-cyan-300" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
