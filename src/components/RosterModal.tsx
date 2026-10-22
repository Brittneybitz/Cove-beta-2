import React from 'react';
import { CaughtCreature, CreatureType, RarityTier } from '../types/game';
import { Trophy, Check, X, Sparkles, Heart } from 'lucide-react';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: CaughtCreature[];
  activeCompanion: string;
  onSelectCompanion: (type: CreatureType) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  roster,
  activeCompanion,
  onSelectCompanion,
}) => {
  if (!isOpen) return null;

  const getRarityBadge = (r?: RarityTier) => {
    switch (r) {
      case 'mythic':
        return 'bg-gradient-to-r from-red-500 via-amber-500 to-purple-500 text-white font-extrabold';
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-bold';
      case 'rare':
        return 'bg-purple-900 text-purple-300 border border-purple-700';
      case 'uncommon':
        return 'bg-emerald-900 text-emerald-300 border border-emerald-700';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-500/40 rounded-2xl p-6 text-white shadow-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sky-300">Caught Creature & Whale Roster</h2>
              <p className="text-xs text-slate-400">
                {roster.length} {roster.length === 1 ? 'creature' : 'creatures'} befriended with Sea Flutes
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

        {/* Content list */}
        <div className="overflow-y-auto space-y-3.5 pr-1 flex-1">
          {/* Starter: Oreo */}
          <div
            className={`border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all ${
              activeCompanion === 'orca'
                ? 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-900/60 border border-sky-600/40 flex items-center justify-center text-2xl">
                🐋
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-sky-200">Oreo</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-900/80 text-sky-300 font-mono border border-sky-700">
                    Starter Guardian
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
                    Moderate
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Species: Orca Whale • LVL 12 • Profession: Cove Defender
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-2">
                  <span className="text-emerald-400">Mood: 100%</span>
                  <span className="text-cyan-400">Hunger: Well Fed</span>
                  <span className="text-teal-400">Health: Pristine</span>
                </div>
              </div>
            </div>

            <div>
              {activeCompanion === 'orca' ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/40">
                  <Check size={14} /> Active
                </span>
              ) : (
                <button
                  onClick={() => onSelectCompanion('orca')}
                  className="text-xs font-semibold bg-sky-700 hover:bg-sky-600 px-3.5 py-1.5 rounded-lg text-white transition-colors"
                >
                  Swim As
                </button>
              )}
            </div>
          </div>

          {roster.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <Sparkles size={28} className="mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No wild creatures caught yet!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Craft a Sea Flute (Standard, Silver, or Golden), engage wild creatures in battle, and play the flute to catch them!
              </p>
            </div>
          ) : (
            roster.map((c) => {
              const iconMap: Record<CreatureType, string> = {
                orca: '🐋',
                shark: '🦈',
                dolphin: '🐬',
                hammerhead: '🦈',
                manta: '🌊',
              };
              const isCurrent = activeCompanion === c.type;

              return (
                <div
                  key={c.id}
                  className={`border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all ${
                    isCurrent
                      ? 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-2xl">
                      {iconMap[c.type] || '🐟'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-100">{c.nickname}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${getRarityBadge(c.rarity)}`}>
                          {c.rarity || 'common'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize border border-slate-700">
                          {c.personality}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono">
                          LVL {c.level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {c.speciesName || c.name} • Career: <strong className="text-slate-300 capitalize">{c.career?.profession || 'unemployed'}</strong> (Lvl {c.career?.level || 1})
                      </div>

                      {/* Vital stats */}
                      <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-2.5">
                        <span>Hunger: <strong className="text-cyan-300">{c.status?.hunger || 'well_fed'}</strong></span>
                        <span>Sickness: <strong className={c.status?.sickness !== 'healthy' ? 'text-rose-400' : 'text-emerald-400'}>{c.status?.sickness || 'healthy'}</strong></span>
                        <span>Wallet: <strong className="text-amber-300">{c.economy?.wallet || 0}🪙</strong></span>
                        {c.economy?.debt > 0 && (
                          <span>Debt: <strong className="text-rose-400">{c.economy.debt}🪙</strong></span>
                        )}
                        {c.social?.marriedToId && (
                          <span className="text-pink-400 flex items-center gap-1 font-semibold">
                            <Heart size={11} fill="currentColor" /> Married
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-500/40">
                        <Check size={14} /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectCompanion(c.type)}
                        className="text-xs font-semibold bg-indigo-700 hover:bg-indigo-600 px-3.5 py-1.5 rounded-lg text-white transition-colors"
                      >
                        Swim As
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-colors"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};
