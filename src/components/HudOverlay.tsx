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
} from 'lucide-react';

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
}) => {
  const [uiMinimized, setUiMinimized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isMusicPlaying, setIsMusicPlaying] = useState(soundManager.isAmbientMusicPlaying());

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

        {/* Settings Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            setIsSettingsOpen(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
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

      {/* Top Right: Economy & Resources Bar */}
      <div className="pointer-events-auto absolute top-16 right-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-md max-w-[320px] flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-amber-300">💰 Coins: {inventory.playerCoins}</span>
          <div className="flex items-center gap-2">
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
                onClick={() => setIsSettingsOpen(false)}
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
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full mt-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white shadow-lg transition"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
