import React, { useState, useEffect } from 'react';
import { BattleState, CaughtCreature } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Shield, Sparkles, Waves, Music, ArrowRight, X, ChevronDown, ChevronUp, Award } from 'lucide-react';

interface BattleModalProps {
  battleState: BattleState;
  companionName?: string;
  companionLevel?: number;
  companionExp?: number;
  companionExpNext?: number;
  standardFlutes: number;
  silverFlutes: number;
  goldenFlutes: number;
  onAction: (action: 'splash' | 'crash' | 'guard' | 'catch' | 'flee', fluteType?: 'standard' | 'silver' | 'golden') => void;
  onClose: () => void;
  onCreatureCaught?: (creature: CaughtCreature) => void;
  playerScreenPos?: { x: number; y: number } | null;
}

export const BattleModal: React.FC<BattleModalProps> = ({
  battleState,
  companionName = 'Oreo',
  companionLevel = 12,
  companionExp = 30,
  companionExpNext = 100,
  standardFlutes,
  silverFlutes,
  goldenFlutes,
  onAction,
  onClose,
  playerScreenPos,
}) => {
  const { enemy, playerHp, playerMaxHp, status, log, leveledUp, expGained } = battleState;
  const [shaking, setShaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (status === 'enemy_turn') {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!battleState.active || !enemy) return null;

  const enemyHpPercent = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));

  const isBusy = status === 'enemy_turn' || status === 'catching';

  const getRarityBadge = () => {
    const r = enemy.rarity || 'common';
    switch (r) {
      case 'mythic':
        return 'bg-gradient-to-r from-red-500 via-amber-500 to-purple-500 text-white font-extrabold shadow-lg';
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-bold border border-yellow-400';
      case 'rare':
        return 'bg-purple-900 text-purple-300 border border-purple-600';
      case 'uncommon':
        return 'bg-emerald-900 text-emerald-300 border border-emerald-600';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const expPercent = Math.min(100, Math.max(0, (companionExp / (companionExpNext || 100)) * 100));

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200">
      {/* Top Center: Encounter Title & Minimize Button */}
      <div className="pointer-events-auto flex items-center justify-between mx-auto w-full max-w-4xl">
        <div className="bg-slate-900/90 border border-sky-400/50 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-xl flex items-center gap-3">
          <span className="text-lg">⚔️</span>
          <div>
            <h3 className="font-black text-sm text-sky-200 tracking-wide">
              {status === 'victory'
                ? '🏆 Battle Victory!'
                : status === 'fled'
                ? '💨 Escaped Encounter'
                : status === 'defeated'
                ? '💀 Companion Fainted'
                : `Wild ${enemy.name} Encounter`}
            </h3>
            <span className="text-[10px] text-slate-400">Pokemon-style 3D Ocean Duel</span>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="bg-slate-900/90 border border-slate-700 hover:border-sky-400 text-sky-300 p-2 rounded-2xl shadow-lg backdrop-blur-md transition"
          title={isMinimized ? 'Expand Battle HUD' : 'Minimize Battle HUD'}
        >
          {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Opponent Status Card (Top Right - Classic Pokemon placement) */}
      {!isMinimized && (
        <div className="pointer-events-auto self-end max-w-xs w-full mr-1 sm:mr-6 mt-2 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-950/85 border-2 border-rose-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-rose-300 text-sm truncate">{enemy.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold border border-slate-700">
                  Lv. {Math.max(1, Math.floor(enemy.maxHp / 10))}
                </span>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${getRarityBadge()}`}>
                  {enemy.rarity}
                </span>
              </div>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-rose-400 font-mono">HP</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    enemyHpPercent > 50 ? 'bg-emerald-500' : enemyHpPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${enemyHpPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-300 font-bold">
                {Math.max(0, enemy.hp)}/{enemy.maxHp}
              </span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="capitalize">{enemy.personality} nature</span>
              <span>ATK: {enemy.attackPower}</span>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Banner Overlay if active */}
      {leveledUp && (
        <div className="pointer-events-auto mx-auto bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-6 py-2.5 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-2 animate-bounce border-2 border-white">
          <Award size={20} />
          <span>LEVEL UP! {companionName} grew to Level {companionLevel}! (+HP, +ATK, +DEF, +SPD)</span>
        </div>
      )}

      {/* 1. Player HP/Level Panel Anchored in 3D over the Orca (Replaces generic nametag) */}
      {!isMinimized && (
        <div
          className="pointer-events-auto transition-all duration-75 ease-out select-none"
          style={
            playerScreenPos
              ? {
                  position: 'fixed',
                  left: `${playerScreenPos.x}px`,
                  top: `${playerScreenPos.y}px`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 45,
                }
              : {
                  position: 'fixed',
                  left: '22%',
                  top: '68%',
                  transform: 'translate(-50%, -100%)',
                  zIndex: 45,
                }
          }
        >
          <div className="relative bg-slate-950/90 border-2 border-sky-400/80 rounded-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md min-w-[170px] max-w-[210px]">
            {/* Name & Level */}
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-black text-sky-200 truncate">{companionName}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 font-bold border border-sky-500/50 shrink-0">
                  Lv.{companionLevel}
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-200 font-bold shrink-0">
                {playerHp}/{playerMaxHp}
              </span>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black text-sky-400 font-mono">HP</span>
              <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700/80">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    playerHpPercent > 50 ? 'bg-sky-400' : playerHpPercent > 25 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${playerHpPercent}%` }}
                />
              </div>
            </div>

            {/* EXP Progress Bar */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-bold text-indigo-400 font-mono">EXP</span>
              <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
              <span className="text-[8px] font-mono text-slate-400">
                {companionExp}/{companionExpNext}
              </span>
            </div>

            {/* Downward indicator triangle pointing directly at Orca model */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-sky-400/80" />
          </div>
        </div>
      )}

      {/* 2. Compact Bottom-Right Battle Action Menu (Significantly reduced footprint for 3D visibility) */}
      {!isMinimized && (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 pointer-events-auto z-40 max-w-[280px] sm:max-w-[310px] w-[calc(100vw-24px)] animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-950/90 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md">
            {/* Compact Live Battle Log Stream */}
            <div className="bg-slate-950/90 rounded-lg px-2 py-1 h-8 sm:h-9 overflow-y-auto border border-slate-800/80 mb-2 space-y-0.5">
              {log.slice(-2).map((line, idx) => (
                <p key={idx} className="text-slate-300 font-mono text-[10px] leading-tight truncate">
                  &gt; {line}
                </p>
              ))}
            </div>

            {/* Action Buttons */}
            {status === 'player_turn' && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => {
                      soundManager.playAttackSplash();
                      onAction('splash');
                    }}
                    disabled={isBusy}
                    className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-[9px] rounded-lg shadow transition-all active:scale-95"
                    title="Aqua Splash attack"
                  >
                    <Waves size={12} className="mb-0.5" />
                    <span>Splash</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playAttackCrash();
                      onAction('crash');
                    }}
                    disabled={isBusy}
                    className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[9px] rounded-lg shadow transition-all active:scale-95"
                    title="Fin Strike attack"
                  >
                    <Sparkles size={12} className="mb-0.5" />
                    <span>Strike</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playFeed();
                      onAction('guard');
                    }}
                    disabled={isBusy}
                    className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-[9px] rounded-lg shadow transition-all active:scale-95"
                    title="Barrier defense"
                  >
                    <Shield size={12} className="mb-0.5" />
                    <span>Guard</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onAction('flee');
                    }}
                    disabled={isBusy}
                    className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold text-[9px] rounded-lg shadow transition-all active:scale-95"
                    title="Escape duel"
                  >
                    <ArrowRight size={12} className="mb-0.5" />
                    <span>Flee</span>
                  </button>
                </div>

                {/* Catch Flutes */}
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  <button
                    onClick={() => {
                      soundManager.playFluteCatchChime();
                      onAction('catch', 'standard');
                    }}
                    disabled={standardFlutes <= 0 || isBusy}
                    className="flex items-center justify-center gap-1 py-1 px-1 rounded-lg text-[9px] font-bold bg-teal-800/80 hover:bg-teal-700 border border-teal-600/50 disabled:opacity-40 text-teal-200 truncate"
                  >
                    <Music size={10} className="shrink-0" />
                    <span className="truncate">Std ({standardFlutes}) 40%</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playFluteCatchChime();
                      onAction('catch', 'silver');
                    }}
                    disabled={silverFlutes <= 0 || isBusy}
                    className="flex items-center justify-center gap-1 py-1 px-1 rounded-lg text-[9px] font-bold bg-slate-700 hover:bg-slate-600 border border-slate-500/50 disabled:opacity-40 text-slate-200 truncate"
                  >
                    <Music size={10} className="shrink-0" />
                    <span className="truncate">Silv ({silverFlutes}) 50%</span>
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playFluteCatchChime();
                      onAction('catch', 'golden');
                    }}
                    disabled={goldenFlutes <= 0 || isBusy}
                    className="flex items-center justify-center gap-1 py-1 px-1 rounded-lg text-[9px] font-black bg-amber-500 hover:bg-amber-400 border border-yellow-300 text-slate-950 shadow truncate"
                  >
                    <Music size={10} className="shrink-0" />
                    <span className="truncate">Gold ({goldenFlutes}) 80%</span>
                  </button>
                </div>
              </div>
            )}

            {status === 'enemy_turn' && (
              <div className="py-1.5 text-center text-[10px] text-amber-300 font-semibold animate-pulse">
                ⚡ {enemy.name} is counter-attacking...
              </div>
            )}

            {status === 'catching' && (
              <div className="py-1.5 text-center text-[10px] text-purple-300 font-semibold flex items-center justify-center gap-1.5">
                <Music size={12} className="animate-spin text-purple-400" />
                <span>Playing Sea Flute melody...</span>
              </div>
            )}

            {(status === 'victory' || status === 'fled' || status === 'defeated') && (
              <div className="pt-0.5">
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow transition active:scale-95"
                >
                  Return to Free Ocean 🌊
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
