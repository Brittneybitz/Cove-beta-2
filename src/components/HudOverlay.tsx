import React, { useState, useEffect } from 'react';
import { CameraViewMode, Inventory, TimeOfDay, ControlScheme } from '../types/game';
import { soundManager } from '../audio/soundManager';
import {
  Volume2,
  VolumeX,
  Compass,
  Eye,
  EyeOff,
  Trophy,
  Sparkles,
  Home,
  GraduationCap,
  Heart,
  BookOpen,
  Sun,
  Flame,
  Settings,
  Music,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Utensils,
  Radio,
  Mic,
  MicOff,
  Terminal,
  Activity,
  Upload,
  Gamepad2,
} from 'lucide-react';
import { organicAudioController, ControllerLogEntry } from '../audio/organicAudioController';
import {
  gamepadService,
  GamepadLiveState,
  GamepadConfig,
  GamepadAction,
  XBOX_BUTTON_NAMES,
  ACTION_DESCRIPTIONS,
} from '../services/gamepadService';

interface HudOverlayProps {
  inventory: Inventory;
  rosterCount: number;
  swimSpeed: number;
  onSpeedChange: (speed: number) => void;
  cameraMode: CameraViewMode;
  onCameraModeChange: (mode: CameraViewMode) => void;
  onCraftFlute: (type: 'standard' | 'silver' | 'golden') => void;
  onOpenRoster: () => void;
  onOpenModelManager: () => void;
  onOpenChat: () => void;
  onCopyCode: () => void;
  customModelCount: number;
  onSummonWild: () => void;
  oreoBubble: {
    visible: boolean;
    x: number;
    y: number;
    text: string;
  } | null;
  onFeedFish: () => void;
  onFeedKelp: () => void;
  onCloseBubble: () => void;
  toastMessage: string | null;
  // GDD Features
  timeOfDay: TimeOfDay;
  onCycleTimeOfDay: () => void;
  isRaveParty: boolean;
  onTriggerRave: () => void;
  onOpenHousing: () => void;
  onOpenCollege: () => void;
  onOpenTherapy: () => void;
  onOpenCatalog: () => void;
  isSharkRaidActive?: boolean;
  // New Controls & Audio
  controlScheme: ControlScheme;
  onToggleControlScheme: (scheme: ControlScheme) => void;
  onMobileMoveVectorChange?: (vec: { x: number; y: number; z: number }) => void;
  // Microphone Whistle Summon
  isMicListening?: boolean;
  audioMicLevel?: number;
  onToggleMic?: () => void;
  // Nintendogs & Voice Studio
  isNintendogsMode?: boolean;
  onToggleNintendogsMode?: () => void;
  onOpenCryStudio?: () => void;
  showNameplates?: boolean;
  onToggleNameplates?: () => void;
  onTapGlass?: () => void;
  // Settings & Hideable Resources
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
  isResourcesHidden?: boolean;
  onToggleResources?: () => void;
  activeTabName?: string;
  onOpenXboxTutorial?: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  inventory,
  rosterCount,
  swimSpeed,
  onSpeedChange,
  cameraMode,
  onCameraModeChange,
  onCraftFlute,
  onOpenRoster,
  onOpenModelManager,
  onOpenChat,
  onCopyCode,
  customModelCount,
  onSummonWild,
  oreoBubble,
  onFeedFish,
  onFeedKelp,
  onCloseBubble,
  toastMessage,
  timeOfDay,
  onCycleTimeOfDay,
  isRaveParty,
  onTriggerRave,
  onOpenHousing,
  onOpenCollege,
  onOpenTherapy,
  onOpenCatalog,
  isSharkRaidActive = false,
  controlScheme,
  onToggleControlScheme,
  onMobileMoveVectorChange,
  isMicListening = false,
  audioMicLevel = 0,
  onToggleMic,
  isNintendogsMode = false,
  onToggleNintendogsMode,
  onOpenCryStudio,
  showNameplates = true,
  onToggleNameplates,
  onTapGlass,
  isSettingsOpen: propsIsSettingsOpen,
  onToggleSettings,
  isResourcesHidden: propsIsResourcesHidden,
  onToggleResources,
  activeTabName,
  onOpenXboxTutorial,
}) => {
  const [uiMinimized, setUiMinimized] = useState(false);
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const isSettingsOpen = propsIsSettingsOpen !== undefined ? propsIsSettingsOpen : internalSettingsOpen;

  const toggleSettings = () => {
    if (onToggleSettings) {
      onToggleSettings();
    } else {
      setInternalSettingsOpen((prev) => !prev);
    }
  };

  const closeSettings = () => {
    if (propsIsSettingsOpen !== undefined && onToggleSettings) {
      if (propsIsSettingsOpen) onToggleSettings();
    } else {
      setInternalSettingsOpen(false);
    }
  };

  const [internalResourcesHidden, setInternalResourcesHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('whale_cove_resources_hidden') === 'true';
    } catch {
      return false;
    }
  });

  const isResourcesHidden = propsIsResourcesHidden !== undefined ? propsIsResourcesHidden : internalResourcesHidden;

  const toggleResources = () => {
    if (onToggleResources) {
      onToggleResources();
    } else {
      setInternalResourcesHidden((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('whale_cove_resources_hidden', String(next));
        } catch {}
        return next;
      });
    }
  };

  // Gamepad State & Live Tracking
  const [gamepadState, setGamepadState] = useState<GamepadLiveState>(gamepadService.getLiveState());
  const [gamepadConfig, setGamepadConfig] = useState<GamepadConfig>(gamepadService.getConfig());
  const [remappingAction, setRemappingAction] = useState<GamepadAction | null>(null);

  useEffect(() => {
    const unsub = gamepadService.subscribe((state) => {
      setGamepadState(state);
    });
    return () => unsub();
  }, []);

  const handleStartRemap = (action: GamepadAction) => {
    soundManager.playClick();
    setRemappingAction(action);
    gamepadService.startListeningForRemap(action, () => {
      setGamepadConfig(gamepadService.getConfig());
      setRemappingAction(null);
      soundManager.playCatchSuccess();
    });
  };

  const handleCancelRemap = () => {
    soundManager.playClick();
    gamepadService.cancelRemap();
    setRemappingAction(null);
  };

  const handleResetGamepadDefaults = () => {
    soundManager.playClick();
    gamepadService.resetToDefaults();
    setGamepadConfig(gamepadService.getConfig());
  };

  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isMusicPlaying, setIsMusicPlaying] = useState(soundManager.isAmbientMusicPlaying());

  // Organic Whale Audio Controller State
  const [isOrganicEnabled, setIsOrganicEnabled] = useState(organicAudioController.getIsEnabled());
  const [organicFileName, setOrganicFileName] = useState<string | null>(organicAudioController.getLoadedFileName());
  const [aiState, setAiState] = useState<'idle' | 'busy' | 'off'>(organicAudioController.getAiState());
  const [organicLogs, setOrganicLogs] = useState<ControllerLogEntry[]>(organicAudioController.getLogs());
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    const unsubState = organicAudioController.subscribeState(() => {
      setIsOrganicEnabled(organicAudioController.getIsEnabled());
      setOrganicFileName(organicAudioController.getLoadedFileName());
      setAiState(organicAudioController.getAiState());
    });
    const unsubLogs = organicAudioController.subscribeLogs((logs) => {
      setOrganicLogs(logs);
    });
    return () => {
      unsubState();
      unsubLogs();
    };
  }, []);

  // Mobile virtual joystick state
  const [mobileKeys, setMobileKeys] = useState<{
    forward: boolean;
    back: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  }>({
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  useEffect(() => {
    if (onMobileMoveVectorChange) {
      let x = 0;
      let z = 0;
      let y = 0;
      if (mobileKeys.forward) z -= 1;
      if (mobileKeys.back) z += 1;
      if (mobileKeys.left) x -= 1;
      if (mobileKeys.right) x += 1;
      if (mobileKeys.up) y += 1;
      if (mobileKeys.down) y -= 1;
      onMobileMoveVectorChange({ x, y, z });
    }
  }, [mobileKeys, onMobileMoveVectorChange]);

  const toggleMute = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  const toggleAmbientMusic = () => {
    const playing = soundManager.toggleOceanAmbientMusic();
    setIsMusicPlaying(playing);
  };

  const canCraftStandard = inventory.fishTreats >= 3 && inventory.kelpSnacks >= 3;
  const canCraftSilver = inventory.fishTreats >= 5 && inventory.kelpSnacks >= 5 && inventory.quartz >= 2;
  const canCraftGolden = inventory.fishTreats >= 8 && inventory.kelpSnacks >= 8 && inventory.topaz >= 2;

  const timeIcons: Record<TimeOfDay, string> = {
    morning: '🌅 Morning',
    midday: '☀️ Midday',
    sunset: '🌇 Sunset',
    night: '🌙 Midnight',
  };

  // If UI is minimized, only display restore button
  if (uiMinimized) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden font-sans select-none z-30">
        <div className="pointer-events-auto absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setUiMinimized(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-900/90 border border-sky-400 text-sky-200 shadow-2xl backdrop-blur-md hover:bg-slate-800 transition transform hover:scale-105 active:scale-95"
          >
            <Eye size={16} />
            <span>Restore UI HUD</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden font-sans select-none z-10">
      {/* Top Banner / Shark Raid Alert */}
      {isSharkRaidActive && (
        <div className="pointer-events-auto absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/90 border-2 border-red-400 text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider animate-pulse flex items-center gap-2 shadow-2xl shadow-red-900">
          <Flame size={16} />
          <span>⚠️ SHARK RAID IN PROGRESS! Protect the Cove & Defend the Pod!</span>
        </div>
      )}

      {/* Top Navigation Bar: GDD Systems */}
      <div className="pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-md max-w-[96vw] overflow-x-auto">
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenHousing();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-cyan-300 hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Home size={14} />
          <span>Housing & Bills</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenCollege();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-300 hover:bg-slate-800 transition whitespace-nowrap"
        >
          <GraduationCap size={14} />
          <span>College & Careers</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenTherapy();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-pink-300 hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Heart size={14} />
          <span>Therapy & Drama</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenCatalog();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:bg-slate-800 transition whitespace-nowrap"
        >
          <BookOpen size={14} />
          <span>50 Species Dex</span>
        </button>

        {/* Time of Day Cycle */}
        <button
          onClick={() => {
            soundManager.playClick();
            onCycleTimeOfDay();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-sky-200 hover:bg-slate-700 transition border border-slate-700 whitespace-nowrap"
          title="Toggle Time of Day"
        >
          <Sun size={13} />
          <span>{timeIcons[timeOfDay]}</span>
        </button>

        {/* Ambient Ocean Music Toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            toggleAmbientMusic();
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border whitespace-nowrap ${
            isMusicPlaying
              ? 'bg-sky-600/90 text-white border-sky-400 shadow-md'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Toggle Ambient Ocean Synth Soundtrack"
        >
          <Music size={13} />
          <span>{isMusicPlaying ? 'Ocean Music 🎵' : 'Mute Music'}</span>
        </button>

        {/* Whistle Mic Summon Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleMic?.();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border whitespace-nowrap shadow-lg ${
            isMicListening
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white border-emerald-300 ring-2 ring-emerald-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Turn on mic and whistle to summon your whale to the screen!"
        >
          {isMicListening ? <Mic size={14} className="text-white animate-pulse" /> : <MicOff size={14} />}
          <span>{isMicListening ? 'Whistle Mic: ON' : 'Whistle Mic: OFF'}</span>
          {isMicListening && (
            <div className="w-10 h-2 bg-slate-950/80 rounded-full overflow-hidden border border-emerald-400/60 ml-0.5">
              <div
                className="h-full bg-emerald-400 transition-all duration-75"
                style={{ width: `${Math.min(100, (audioMicLevel || 0) * 1.6)}%` }}
              />
            </div>
          )}
        </button>

        {/* Rave Candy Strobe Party Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onTriggerRave();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            isRaveParty
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white animate-pulse shadow-lg'
              : 'bg-slate-800 hover:bg-purple-950 text-purple-300 border border-purple-800/60'
          }`}
        >
          <span>🍭</span>
          <span>{isRaveParty ? 'Rave Active!' : `Rave (${inventory.raveCandies})`}</span>
        </button>

        {/* Nintendogs Mode Screen Call Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onToggleNintendogsMode?.();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-lg border ${
            isNintendogsMode
              ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 text-white border-pink-300 ring-2 ring-pink-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-pink-300 border-pink-700/50'
          }`}
          title="Call Oreo directly to the screen like a Nintendog for close-up petting & feeding!"
        >
          <span>🐾</span>
          <span>{isNintendogsMode ? 'Oreo at Glass 💕' : 'Screen Call'}</span>
        </button>

        {/* Whale Cry Studio Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenCryStudio?.();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-cyan-700/50 transition whitespace-nowrap"
          title="Record or upload custom cries for all 7 whale emotions!"
        >
          <Mic size={13} className="text-cyan-400" />
          <span>Cry Studio 🎙️</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            toggleSettings();
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
            isSettingsOpen ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
          title="Controls & Audio Settings"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        {/* Universal Minimize Tab Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            setUiMinimized(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition"
          title="Hide All UI (Clean View)"
        >
          <EyeOff size={14} />
          <span>Hide UI</span>
        </button>
      </div>

      {/* Listening status badge when Mic is active */}
      {isMicListening && (
        <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 bg-emerald-950/90 border border-emerald-400/70 text-emerald-200 text-xs px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>
            Whistle into your mic or call <strong>"Hey Oreo!"</strong> to summon your whale to the screen! 💖🐳
          </span>
        </div>
      )}

      {/* Top Left: Quick Controls & Roster Hub */}
      <div className="pointer-events-auto absolute top-16 left-4 flex flex-col gap-2 max-w-[280px]">
        {/* Model Customizer & 3D Tools */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenModelManager();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-slate-900/90 border border-emerald-500/40 shadow-lg hover:bg-slate-800 transition"
          >
            <span>📦</span>
            <span>3D Models ({customModelCount}/6)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenRoster();
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-sky-300 bg-slate-900/90 border border-sky-500/40 shadow-lg hover:bg-slate-800 transition"
          >
            <Trophy size={14} />
            <span>Pod ({rosterCount})</span>
          </button>
        </div>

        {/* Copy Code for VS Code button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onCopyCode();
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 bg-slate-900/90 border border-indigo-500/40 shadow-lg hover:bg-slate-800 transition"
        >
          <span>📋</span>
          <span>Copy Code for VS Code</span>
        </button>
      </div>

      {/* Top Right: Economy & Resources Bar (Hideable) */}
      {isResourcesHidden ? (
        <button
          onClick={() => {
            soundManager.playClick();
            toggleResources();
          }}
          className="pointer-events-auto absolute top-16 right-4 flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-800 border border-amber-500/50 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold text-amber-300 transition transform hover:scale-105 active:scale-95 group cursor-pointer z-20"
          title="Expand Resource Tab (or press View/Back on Xbox controller)"
        >
          <span className="flex items-center gap-1">💰 {inventory.playerCoins}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-mono text-[11px]">🍖 {inventory.whaleMeat + inventory.sharkMeat}</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-300 flex items-center gap-1 text-[11px] group-hover:text-sky-200 font-sans">
            <Eye size={12} className="text-sky-400" />
            <span>Resources ▼</span>
          </span>
        </button>
      ) : (
        <div className="pointer-events-auto absolute top-16 right-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-md max-w-[320px] flex flex-col gap-2.5 z-20 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-300">💰 Coins: {inventory.playerCoins}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-emerald-400">
                🍖 Meat: {inventory.whaleMeat + inventory.sharkMeat}
              </span>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onSummonWild();
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white shadow transition"
              >
                Summon Wild ⚔️
              </button>
              {/* Hide Resources Tab Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  toggleResources();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
                title="Hide Resource Tab (or press View on Xbox controller)"
              >
                <EyeOff size={13} />
              </button>
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-slate-300">
              🪵 Drift: {inventory.driftwood}
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-rose-300">
              🪸 Coral: {inventory.coral}
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-amber-200">
              🪨 Stone: {inventory.stone}
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-cyan-200">
              🔩 Iron: {inventory.iron}
            </div>
          </div>

          {/* Gems & Meat */}
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px]">
            <div className="bg-amber-950/50 p-1 rounded border border-amber-800/40 text-amber-300">
              Topaz: {inventory.topaz}
            </div>
            <div className="bg-cyan-950/50 p-1 rounded border border-cyan-800/40 text-cyan-300">
              Quartz: {inventory.quartz}
            </div>
            <div className="bg-rose-950/50 p-1 rounded border border-rose-800/40 text-rose-300">
              Ruby: {inventory.ruby}
            </div>
            <div className="bg-blue-950/50 p-1 rounded border border-blue-800/40 text-blue-300">
              Saph: {inventory.sapphire}
            </div>
            <div className="bg-purple-950/50 p-1 rounded border border-purple-800/40 text-purple-300">
              Ameth: {inventory.amethyst}
            </div>
          </div>

          {/* Flute Counts */}
          <div className="flex items-center justify-between text-[11px] bg-slate-950/50 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400">🎵 Sea Flutes:</span>
            <span className="text-cyan-300 font-bold">
              Std:{inventory.standardFlutes} | Silv:{inventory.silverFlutes} | Gold:{inventory.goldenFlutes}
            </span>
          </div>

          {/* Quick Flute Crafting */}
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <button
              onClick={() => onCraftFlute('standard')}
              disabled={!canCraftStandard}
              className={`py-1 rounded text-[10px] font-bold text-center ${
                canCraftStandard ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              +Std Flute
            </button>
            <button
              onClick={() => onCraftFlute('silver')}
              disabled={!canCraftSilver}
              className={`py-1 rounded text-[10px] font-bold text-center ${
                canCraftSilver ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              +Silver Flute
            </button>
            <button
              onClick={() => onCraftFlute('golden')}
              disabled={!canCraftGolden}
              className={`py-1 rounded text-[10px] font-bold text-center ${
                canCraftGolden ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500'
              }`}
            >
              +Gold Flute
            </button>
          </div>
        </div>
      )}

      {/* Mobile Multi-Touch Virtual Controls Overlay */}
      {controlScheme === 'minecraft' && (
        <div className="pointer-events-auto absolute bottom-6 left-6 flex items-end gap-3 select-none">
          {/* Virtual D-Pad / Joystick */}
          <div className="bg-slate-900/80 border border-sky-500/40 p-2 rounded-2xl backdrop-blur-md shadow-2xl grid grid-cols-3 gap-1.5 w-36 h-36">
            <div />
            <button
              onMouseDown={() => setMobileKeys((k) => ({ ...k, forward: true }))}
              onMouseUp={() => setMobileKeys((k) => ({ ...k, forward: false }))}
              onTouchStart={() => setMobileKeys((k) => ({ ...k, forward: true }))}
              onTouchEnd={() => setMobileKeys((k) => ({ ...k, forward: false }))}
              className="bg-slate-800 active:bg-sky-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow"
            >
              <ArrowUp size={18} />
            </button>
            <div />

            <button
              onMouseDown={() => setMobileKeys((k) => ({ ...k, left: true }))}
              onMouseUp={() => setMobileKeys((k) => ({ ...k, left: false }))}
              onTouchStart={() => setMobileKeys((k) => ({ ...k, left: true }))}
              onTouchEnd={() => setMobileKeys((k) => ({ ...k, left: false }))}
              className="bg-slate-800 active:bg-sky-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center justify-center text-[10px] font-mono text-slate-400 font-bold">
              SWIM
            </div>

            <button
              onMouseDown={() => setMobileKeys((k) => ({ ...k, right: true }))}
              onMouseUp={() => setMobileKeys((k) => ({ ...k, right: false }))}
              onTouchStart={() => setMobileKeys((k) => ({ ...k, right: true }))}
              onTouchEnd={() => setMobileKeys((k) => ({ ...k, right: false }))}
              className="bg-slate-800 active:bg-sky-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow"
            >
              <ArrowRight size={18} />
            </button>

            <div />
            <button
              onMouseDown={() => setMobileKeys((k) => ({ ...k, back: true }))}
              onMouseUp={() => setMobileKeys((k) => ({ ...k, back: false }))}
              onTouchStart={() => setMobileKeys((k) => ({ ...k, back: true }))}
              onTouchEnd={() => setMobileKeys((k) => ({ ...k, back: false }))}
              className="bg-slate-800 active:bg-sky-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow"
            >
              <ArrowDown size={18} />
            </button>
            <div />
          </div>

          {/* Up & Down Float Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onMouseDown={() => setMobileKeys((k) => ({ ...k, up: true }))}
              onMouseUp={() => setMobileKeys((k) => ({ ...k, up: false }))}
              onTouchStart={() => setMobileKeys((k) => ({ ...k, up: true }))}
              onTouchEnd={() => setMobileKeys((k) => ({ ...k, up: false }))}
              className="w-12 h-12 bg-sky-600/90 active:bg-sky-400 border border-sky-400 text-white rounded-2xl flex flex-col items-center justify-center font-bold text-[10px] shadow-xl backdrop-blur-md"
            >
              <ArrowUp size={14} />
              <span>UP</span>
            </button>

            <button
              onMouseDown={() => setMobileKeys((k) => ({ ...k, down: true }))}
              onMouseUp={() => setMobileKeys((k) => ({ ...k, down: false }))}
              onTouchStart={() => setMobileKeys((k) => ({ ...k, down: true }))}
              onTouchEnd={() => setMobileKeys((k) => ({ ...k, down: false }))}
              className="w-12 h-12 bg-indigo-600/90 active:bg-indigo-400 border border-indigo-400 text-white rounded-2xl flex flex-col items-center justify-center font-bold text-[10px] shadow-xl backdrop-blur-md"
            >
              <ArrowDown size={14} />
              <span>DOWN</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 bg-sky-950/95 border border-sky-400 text-sky-200 text-xs font-semibold py-2 px-4 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-sky-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Oreo Speech Bubble */}
      {oreoBubble && oreoBubble.visible && (
        <div
          key={oreoBubble.text}
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full bg-slate-900/95 border-2 border-sky-400 text-white rounded-2xl p-3.5 shadow-2xl shadow-sky-950/80 w-56 text-center flex flex-col gap-2 animate-pop-bubble after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-sky-400"
          style={{
            left: `${Math.max(120, Math.min(window.innerWidth - 120, oreoBubble.x))}px`,
            top: `${Math.max(90, Math.min(window.innerHeight - 80, oreoBubble.y - 20))}px`,
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-sky-300">{oreoBubble.text}</span>
            <button onClick={onCloseBubble} className="text-slate-400 hover:text-white text-xs px-1">
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                soundManager.playWhaleChirp();
                onOpenChat();
              }}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>💬 Chat with Oreo!</span>
            </button>

            <button
              onClick={() => {
                soundManager.playFeed();
                onFeedFish();
              }}
              disabled={inventory.fishTreats <= 0}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span>Feed Fish 🐟</span>
              <span className="text-[10px] opacity-80">({inventory.fishTreats})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playFeed();
                onFeedKelp();
              }}
              disabled={inventory.kelpSnacks <= 0}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span>Feed Kelp 🌿</span>
              <span className="text-[10px] opacity-80">({inventory.kelpSnacks})</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Hint Banner */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/85 border border-slate-700/80 text-slate-300 text-xs px-4 py-1.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2">
        <span>💡</span>
        <span>
          <strong>{controlScheme === 'minecraft' ? 'Minecraft Controls:' : 'Orbit Controls:'}</strong>{' '}
          {controlScheme === 'minecraft'
            ? 'WASD to swim, Space to float up, Shift/C to dive down, drag right side to look!'
            : 'Click & drag to orbit cove, scroll to zoom.'}
        </span>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900/95 border-2 border-sky-400 rounded-3xl p-6 text-white shadow-2xl shadow-sky-950/80">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="text-sky-400" size={20} />
                <h3 className="font-bold text-lg text-sky-200">Game & Control Settings</h3>
              </div>
              <button
                onClick={closeSettings}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Control Scheme Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Control Scheme Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onToggleControlScheme('minecraft')}
                    className={`p-3 rounded-xl border text-left transition ${
                      controlScheme === 'minecraft'
                        ? 'bg-sky-600/40 border-sky-400 text-white font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>🕹️</span>
                      <span className="text-sm">Minecraft Swim</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-normal">
                      WASD + Space/Shift on PC. Multi-touch D-pad + Touch Look on Mobile.
                    </p>
                  </button>

                  <button
                    onClick={() => onToggleControlScheme('orbit')}
                    className={`p-3 rounded-xl border text-left transition ${
                      controlScheme === 'orbit'
                        ? 'bg-sky-600/40 border-sky-400 text-white font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>🔄</span>
                      <span className="text-sm">Orbit Camera</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-normal">
                      Drag to orbit around cove, automatic natural whale swimming.
                    </p>
                  </button>
                </div>
              </div>

              {/* Xbox One Controller Settings & Custom Mapping */}
              <div className="border-t border-slate-800 pt-3.5 space-y-3">
                <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-3.5 space-y-3 shadow-xl">
                  {/* Header & Mode Switch */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
                        <Gamepad2 size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-300">Xbox One & Gamepad Mode</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-md font-mono">
                            Chromebook Ready
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Plug Xbox One controller into Chromebook USB or Bluetooth.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        const next = !gamepadConfig.controllerMode;
                        gamepadService.setControllerMode(next);
                        setGamepadConfig(gamepadService.getConfig());
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md ${
                        gamepadConfig.controllerMode
                          ? 'bg-emerald-600 text-white shadow-emerald-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {gamepadConfig.controllerMode ? 'CONTROLLER ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Connection Status Banner */}
                  <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          gamepadState.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200">
                          {gamepadState.connected
                            ? `${gamepadState.isXbox ? 'Xbox One Controller' : 'Gamepad'} Connected`
                            : 'No Gamepad Detected'}
                        </span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
                          {gamepadState.connected
                            ? gamepadState.gamepadId
                            : 'Plug in via USB or pair via Bluetooth to your Chromebook'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenXboxTutorial && (
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onOpenXboxTutorial();
                          }}
                          className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-sm"
                          title="Open step-by-step beginner tutorial for Xbox One controller"
                        >
                          <span>🎮 Tutorial</span>
                        </button>
                      )}
                      <button
                        onClick={handleResetGamepadDefaults}
                        className="text-[10px] font-semibold text-slate-400 hover:text-sky-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 transition"
                        title="Reset all bindings to standard Xbox One defaults"
                      >
                        Reset Defaults
                      </button>
                    </div>
                  </div>

                  {/* Live Controller Buttons Monitor */}
                  {gamepadState.connected && (
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>LIVE XBOX INPUT TESTER</span>
                        <span className="text-emerald-400">Press buttons to test</span>
                      </div>
                      <div className="flex flex-wrap gap-1 font-mono text-[9px]">
                        {[
                          { id: 7, label: 'RT (Whistle)' },
                          { id: 6, label: 'LT (Dive)' },
                          { id: 4, label: 'LB (Tab)' },
                          { id: 5, label: 'RB (Tab)' },
                          { id: 0, label: 'A (Up/Pet)' },
                          { id: 1, label: 'B (Back)' },
                          { id: 2, label: 'X (Screen)' },
                          { id: 3, label: 'Y (Cry)' },
                          { id: 8, label: 'View (Res)' },
                          { id: 9, label: 'Menu' },
                          { id: 10, label: 'L3 (Sprint)' },
                          { id: 11, label: 'R3 (Reset)' },
                          { id: 12, label: '▲' },
                          { id: 13, label: '▼' },
                          { id: 14, label: '◄' },
                          { id: 15, label: '►' },
                        ].map((btn) => {
                          const isPressed = gamepadState.buttonsDown[btn.id] || false;
                          return (
                            <span
                              key={btn.id}
                              className={`px-1.5 py-0.5 rounded border transition-all ${
                                isPressed
                                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-300 scale-105 shadow-sm shadow-emerald-400'
                                  : 'bg-slate-950/80 text-slate-400 border-slate-800'
                              }`}
                            >
                              {btn.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tuning Sliders (Sensitivity, Deadzone, Invert Y) */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Look Sensitivity</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {gamepadConfig.lookSensitivity.toFixed(1)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={gamepadConfig.lookSensitivity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          gamepadService.setLookSensitivity(val);
                          setGamepadConfig(gamepadService.getConfig());
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-300">Stick Deadzone</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {Math.round(gamepadConfig.deadzone * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.30"
                        step="0.01"
                        value={gamepadConfig.deadzone}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          gamepadService.setDeadzone(val);
                          setGamepadConfig(gamepadService.getConfig());
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-300">Invert Vertical Look (Pitch)</span>
                        <p className="text-[9px] text-slate-500">Flight-simulator style Y-axis inversion</p>
                      </div>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          const next = !gamepadConfig.invertY;
                          gamepadService.setInvertY(next);
                          setGamepadConfig(gamepadService.getConfig());
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          gamepadConfig.invertY ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {gamepadConfig.invertY ? 'INVERTED' : 'STANDARD'}
                      </button>
                    </div>
                  </div>

                  {/* Custom Action Mapping List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
                      <span>🎮 Custom Xbox Button Mapping</span>
                      {remappingAction && (
                        <span className="text-amber-400 animate-pulse text-[10px] font-mono">
                          Listening for button press...
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
                      {(Object.keys(ACTION_DESCRIPTIONS) as GamepadAction[]).map((actionKey) => {
                        const meta = ACTION_DESCRIPTIONS[actionKey];
                        const btnIndex = gamepadConfig.mapping[actionKey];
                        const btnName = XBOX_BUTTON_NAMES[btnIndex] || `Button ${btnIndex}`;
                        const isRemappingThis = remappingAction === actionKey;

                        return (
                          <div
                            key={actionKey}
                            className={`flex items-center justify-between p-2 text-xs transition ${
                              isRemappingThis ? 'bg-amber-950/40 border-l-2 border-amber-400' : ''
                            }`}
                          >
                            <div className="pr-2">
                              <span className="font-semibold text-slate-200 text-[11px]">{meta.label}</span>
                              <p className="text-[9px] text-slate-400">{meta.desc}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                                  actionKey === 'callWhale'
                                    ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300 font-bold'
                                    : 'bg-slate-950 border-slate-700 text-sky-300'
                                }`}
                              >
                                {btnName}
                              </span>

                              {isRemappingThis ? (
                                <button
                                  onClick={handleCancelRemap}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartRemap(actionKey)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                  title="Press any button on Xbox controller to map"
                                >
                                  Remap
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music size={16} className="text-sky-400" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Ambient Ocean Music</span>
                      <p className="text-[10px] text-slate-400">Atmospheric oceanic synth soundscape</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleAmbientMusic}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isMusicPlaying ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isMusicPlaying ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} className="text-emerald-400" />}
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Sound Effects</span>
                      <p className="text-[10px] text-slate-400">Flute chimes, victory fanfare, splashes</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleMute}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      !isMuted ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {!isMuted ? 'UNMUTED' : 'MUTED'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={16} className="text-sky-400" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Overhead 3D Nameplates</span>
                      <p className="text-[10px] text-slate-400">Display floating tags above pod whales</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onToggleNameplates?.();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      showNameplates ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {showNameplates ? 'SHOWN' : 'HIDDEN'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isMicListening ? <Mic size={16} className="text-emerald-400" /> : <MicOff size={16} className="text-slate-400" />}
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Whistle Mic Summon</span>
                      <p className="text-[10px] text-slate-400">Whistle into microphone to summon whale</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onToggleMic?.();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isMicListening ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isMicListening ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                {/* Whale Game Audio Controller & Organic AI Section */}
                <div className="bg-slate-950/90 border border-purple-500/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                        🐋
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-300">Organic Audio Controller</span>
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded-md font-mono">
                            v1.0.0
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Runs in background when mic is on. Slices & pitch-shifts organic cries when you whistle or speak!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${isMicListening ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}
                        title={isMicListening ? 'Mic Active' : 'Mic Inactive'}
                      />
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${aiState === 'busy' ? 'bg-amber-400' : aiState === 'idle' ? 'bg-sky-400' : 'bg-slate-600'}`}
                        title={`AI Loop: ${aiState}`}
                      />
                    </div>
                  </div>

                  {/* Toggle Controller Switch */}
                  <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Controller State</span>
                      <p className="text-[10px] text-slate-400">
                        {isOrganicEnabled ? 'Active: Running in background' : 'Inactive: Native audio only'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        soundManager.playClick();
                        const next = !isOrganicEnabled;
                        await organicAudioController.setEnabled(next);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isOrganicEnabled
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isOrganicEnabled ? 'ACTIVE (ON)' : 'TURN ON'}
                    </button>
                  </div>

                  {/* Audio File Loader */}
                  <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Organic Cry Sample</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                        {organicFileName || 'Default Harmonic Orca Cry'}
                      </p>
                    </div>

                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1">
                      <Upload size={12} />
                      <span>Upload (.MP3/.WAV)</span>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await organicAudioController.loadAudioFile(file);
                            soundManager.playCatchSuccess();
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Triggers Bar */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        organicAudioController.triggerCry('respond');
                      }}
                      className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-[10px] py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer"
                      title="Simulate speech or whistle response (2.0x - 2.8x pitch)"
                    >
                      🗣️ Test Respond
                    </button>
                    <button
                      onClick={() => {
                        organicAudioController.triggerCry('idle');
                      }}
                      className="bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-200 text-[10px] py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer"
                      title="Simulate ambient idle cry (1.5x - 2.0x pitch)"
                    >
                      🌊 Test Idle Cry
                    </button>
                    <button
                      onClick={() => {
                        organicAudioController.triggerCry('battle');
                      }}
                      className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-[10px] py-1.5 px-2 rounded-lg font-semibold transition cursor-pointer"
                      title="Simulate battle cry (1.2x - 1.5x pitch)"
                    >
                      ⚔️ Test Battle
                    </button>
                  </div>

                  {/* Diagnostic Console Toggle */}
                  <div className="pt-1">
                    <button
                      onClick={() => setShowConsole((prev) => !prev)}
                      className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1 px-1.5 rounded-md hover:bg-slate-900/60 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-mono">
                        <Terminal size={12} className="text-purple-400" />
                        <span>Diagnostic Console ({organicLogs.length} events)</span>
                      </span>
                      <span>{showConsole ? '▲ Hide' : '▼ Show'}</span>
                    </button>

                    {showConsole && (
                      <div className="mt-2 bg-[#010409] border border-gray-800 rounded-lg p-2.5 max-h-36 overflow-y-auto font-mono text-[10px] space-y-1 select-text">
                        {organicLogs.map((log) => {
                          const typeClass =
                            log.type === 'system'
                              ? 'text-sky-400 border-l-2 border-sky-400 pl-1.5'
                              : log.type === 'audio'
                              ? 'text-emerald-400 border-l-2 border-emerald-400 pl-1.5'
                              : log.type === 'ai'
                              ? 'text-purple-300 border-l-2 border-purple-400 pl-1.5'
                              : log.type === 'mic'
                              ? 'text-rose-400 border-l-2 border-rose-400 pl-1.5'
                              : log.type === 'warn'
                              ? 'text-amber-400 border-l-2 border-amber-400 pl-1.5'
                              : 'text-slate-400 border-l-2 border-transparent pl-1.5';
                          return (
                            <div key={log.id} className={typeClass}>
                              <span className="opacity-60">[{log.timestamp}]</span> {log.message}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={closeSettings}
                className="w-full mt-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white shadow-lg transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nintendogs Close-Up Interactive Screen Dock */}
      {isNintendogsMode && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border-2 border-pink-400 rounded-3xl p-3 shadow-2xl flex flex-col items-center gap-2 max-w-[94vw] backdrop-blur-md animate-in slide-in-from-bottom-6 z-40">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-200">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping" />
            <span>🐾 Oreo at the Glass (Nintendogs Mode) — Stroke screen to pet, or feed treats! 💕</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => {
                soundManager.playHappyWhaleCry();
                onFeedFish();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition"
              title="Feed 1 Fish Treat directly at the glass"
            >
              <span>🐟</span>
              <span>Feed Fish ({inventory.fishTreats})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playHappyWhaleCry();
                onFeedKelp();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow transition"
              title="Feed 1 Kelp Snack directly at the glass"
            >
              <span>🌿</span>
              <span>Feed Kelp ({inventory.kelpSnacks})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                soundManager.playCuteCry();
                onTapGlass?.();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white shadow transition"
              title="Tap the glass to get Oreo's attention!"
            >
              <span>🖐️</span>
              <span>Tap Glass</span>
            </button>

            <button
              onClick={() => {
                soundManager.playEmotionCry('cute');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white shadow transition"
              title="Playful chirp vocalization"
            >
              <span>💖</span>
              <span>Pet / Chirp</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenCryStudio?.();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/50 shadow transition"
              title="Open Whale Cry Studio"
            >
              <Mic size={13} />
              <span>Cry Studio 🎙️</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onToggleNintendogsMode?.();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow transition"
              title="Let Oreo swim back into the cove"
            >
              <span>🌊</span>
              <span>Let Oreo Swim Freely</span>
            </button>
          </div>
        </div>
      )}

      {/* Xbox Controller On-Screen Quick Prompts Bar */}
      {gamepadConfig.controllerMode && (
        <div
          className={`pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md text-[10px] font-mono z-30 select-none overflow-x-auto max-w-[96vw] border transition-all ${
            gamepadState.connected
              ? 'bg-slate-950/90 border-emerald-500/50 text-slate-200 ring-1 ring-emerald-500/20'
              : 'bg-slate-950/70 border-slate-800 text-slate-400'
          }`}
        >
          <span className="flex items-center gap-1 font-bold text-emerald-400 whitespace-nowrap">
            <Gamepad2 size={13} />
            <span>{gamepadState.connected ? 'Xbox Connected' : 'Xbox Mode'}</span>
          </span>
          {onOpenXboxTutorial && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenXboxTutorial();
              }}
              className="px-2 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-bold hover:bg-emerald-900 transition flex items-center gap-1"
              title="Open step-by-step Xbox tutorial"
            >
              <span>🎮 Tutorial</span>
            </button>
          )}
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-slate-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-sky-300">
              LS
            </span>{' '}
            Move
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-slate-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-sky-300">
              RS
            </span>{' '}
            Look
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-emerald-300 font-bold whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-500/50 rounded text-[9px]">RT</span> Call
            Whale 🐋
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-cyan-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px]">LT</span> Dive
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-green-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-green-950 border border-green-500/50 rounded text-[9px]">A</span> Up / Pet
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-pink-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-pink-950 border border-pink-500/50 rounded text-[9px]">X</span> Screen Call
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-indigo-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px]">LB/RB</span> Tabs
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-amber-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-amber-950 border border-amber-500/50 rounded text-[9px]">View</span>{' '}
            {isResourcesHidden ? 'Show Res' : 'Hide Res'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-rose-300 whitespace-nowrap">
            <span className="px-1.5 py-0.2 bg-rose-950 border border-rose-500/50 rounded text-[9px]">B</span> Back
          </span>
        </div>
      )}
    </div>
  );
};
