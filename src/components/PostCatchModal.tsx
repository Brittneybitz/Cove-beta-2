import React, { useState } from 'react';
import { PostCatchData, CaughtCreature } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Heart, Shield, Zap, Sparkles, Award, Utensils, CheckCircle2 } from 'lucide-react';

interface PostCatchModalProps {
  postCatchData: PostCatchData | null;
  onKeep: (caughtCreature: CaughtCreature) => void;
  onButcher: (creature: PostCatchData['creature']) => void;
  onClose: () => void;
}

export const PostCatchModal: React.FC<PostCatchModalProps> = ({
  postCatchData,
  onKeep,
  onButcher,
}) => {
  if (!postCatchData) return null;
  const { creature } = postCatchData;

  const [nickname, setNickname] = useState(creature.name.replace(/^(Wild|✨ Shimmering|🌟 Golden)\s+/, ''));
  const [butcherConfirm, setButcherConfirm] = useState(false);

  const isWhale = creature.type === 'orca';
  const meatType = isWhale ? 'Whale Meat' : 'Shark Meat';

  const getRarityBadge = () => {
    switch (creature.rarity) {
      case 'mythic':
        return 'bg-gradient-to-r from-red-500 via-amber-500 to-purple-500 text-white font-extrabold';
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

  const handleConfirmKeep = () => {
    soundManager.playCatchSuccess();
    const newCaught: CaughtCreature = {
      id: 'caught-' + Date.now(),
      name: nickname.trim() || creature.name,
      type: creature.type,
      caughtAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      level: Math.floor(Math.random() * 4) + 8,
      nickname: nickname.trim() || creature.name,
      rarity: creature.rarity,
      personality: creature.personality,
      speciesName: creature.speciesName,
      exp: 0,
      expToNextLevel: 100,
      stats: {
        hp: creature.maxHp,
        power: creature.attackPower,
        speed: creature.speed || 12,
        defense: creature.defense || 10,
      },
      status: {
        hp: creature.maxHp,
        maxHp: creature.maxHp,
        mood: 90,
        hunger: 'well_fed',
        cleanliness: 'clean',
        sickness: 'healthy',
        honor: 90,
      },
      economy: {
        wallet: 25,
        debt: 0,
        rentBill: 4,
        electricBill: 2,
        utilityBill: 2,
        daysDelinquent: 0,
        isEvicted: false,
        isHomeless: true,
      },
      social: {
        bondPoints: 5,
      },
      career: {
        profession: 'unemployed',
        level: 1,
      },
    };
    onKeep(newCaught);
  };

  const handleExecuteButcher = () => {
    soundManager.playAttackCrash();
    onButcher(creature);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg bg-slate-900/95 border-2 border-amber-400/80 rounded-3xl p-6 text-white shadow-2xl shadow-amber-950/70">
        {/* Header Banner */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} />
            <span>Successful Capture!</span>
          </div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            {creature.name} Befriended!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose to welcome this aquatic companion into your pod or harvest it for valuable survival resources.
          </p>
        </div>

        {/* Creature Stats Profile Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 shadow-inner">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">Species</span>
              <p className="font-bold text-sky-300 text-base">{creature.speciesName}</p>
            </div>
            <div className="flex gap-2">
              <span className={`text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full ${getRarityBadge()}`}>
                {creature.rarity}
              </span>
              <span className="text-[11px] capitalize font-medium px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                {creature.personality}
              </span>
            </div>
          </div>

          {/* Stat Meters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-semibold mb-0.5">
                <Heart size={13} />
                <span>HP</span>
              </div>
              <span className="font-mono font-bold text-sm text-white">{creature.maxHp}</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mb-0.5">
                <Zap size={13} />
                <span>ATK</span>
              </div>
              <span className="font-mono font-bold text-sm text-white">{creature.attackPower}</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-sky-400 text-xs font-semibold mb-0.5">
                <Shield size={13} />
                <span>DEF</span>
              </div>
              <span className="font-mono font-bold text-sm text-white">{creature.defense || 12}</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold mb-0.5">
                <Award size={13} />
                <span>SPD</span>
              </div>
              <span className="font-mono font-bold text-sm text-white">{creature.speed || 14}</span>
            </div>
          </div>

          {/* Nickname Input */}
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Give a Custom Nickname:
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter name (e.g. Bubbles, Echo, Poseidon)..."
              maxLength={24}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400 transition"
            />
          </div>
        </div>

        {/* Butcher Warning / Actions */}
        {butcherConfirm ? (
          <div className="bg-rose-950/70 border-2 border-rose-600 rounded-2xl p-4 mb-4 text-center animate-in fade-in">
            <p className="text-sm font-bold text-rose-300 mb-1">
              ⚠️ Are you sure you want to butcher {creature.name}?
            </p>
            <p className="text-xs text-rose-200/80 mb-3">
              This will yield <strong>+3 {meatType}</strong>, <strong>+50 Coins</strong>, and <strong>+2 Random Gems</strong>, but the creature will not be saved to your pod!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setButcherConfirm(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteButcher}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50 transition flex items-center justify-center gap-1.5"
              >
                <Utensils size={14} />
                <span>Confirm Butcher</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleConfirmKeep}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-950/50 transition transform active:scale-98"
            >
              <CheckCircle2 size={16} />
              <span>Keep in Pod</span>
            </button>

            <button
              onClick={() => setButcherConfirm(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white transition transform active:scale-98"
            >
              <Utensils size={16} />
              <span>Butcher for Meat (+3)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
