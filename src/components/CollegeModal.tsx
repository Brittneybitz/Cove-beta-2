import React from 'react';
import { CaughtCreature, ProfessionType } from '../types/game';

interface CollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: CaughtCreature[];
  onEnrollCollege: (whaleId: string, profession: ProfessionType) => void;
  playerCoins: number;
}

export const CollegeModal: React.FC<CollegeModalProps> = ({
  isOpen,
  onClose,
  roster,
  onEnrollCollege,
  playerCoins,
}) => {
  if (!isOpen) return null;

  const professionCards: {
    type: ProfessionType;
    name: string;
    icon: string;
    color: string;
    tuition: number;
    description: string;
    perk: string;
  }[] = [
    {
      type: 'doctor',
      name: 'Marine Physician',
      icon: '🩺',
      color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20',
      tuition: 40,
      description: 'Studies ocean pathology, antibiotics, and terminal fin recovery.',
      perk: 'Regularly heals sick/infected whales in the cove and reduces infirmary bills.',
    },
    {
      type: 'shopkeeper',
      name: 'Boutique Merchant',
      icon: '🏪',
      color: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/20',
      tuition: 35,
      description: 'Learns inventory logistics, seashell bartering, and wholesale import.',
      perk: 'Generates passive coin income every cycle and provides 20% crafting discounts.',
    },
    {
      type: 'miner',
      name: 'Abyssal Gem Miner',
      icon: '⛏️',
      color: 'border-amber-500/50 text-amber-400 bg-amber-950/20',
      tuition: 30,
      description: 'Trained in deep seismic quarrying, sonar drill techniques, and gem extraction.',
      perk: 'Doubles seafloor gem yields (Topaz, Quartz, Ruby, Sapphire, Amethyst).',
    },
    {
      type: 'banker',
      name: 'High-Seas Financier',
      icon: '🏦',
      color: 'border-indigo-500/50 text-indigo-400 bg-indigo-950/20',
      tuition: 50,
      description: 'Master of macroeconomic trends, mutual sand funds, and low-interest credit.',
      perk: 'Collects 5% interest on all whale wallets and prevents sudden bankruptcies.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900/95 border border-indigo-500/40 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <h2 className="text-xl font-bold text-indigo-400">Whale Cove Institute of Higher Learning</h2>
              <p className="text-xs text-slate-400">
                Enroll whales in prestigious vocational degrees to transform them into productive marine citizens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tuition Balance */}
          <div className="flex items-center justify-between p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
            <div>
              <span className="font-semibold text-indigo-200">Player Scholarship Fund</span>
              <p className="text-xs text-slate-400">Use your coins to sponsor whales through university graduation.</p>
            </div>
            <div className="text-right font-bold text-amber-400 text-lg">
              {playerCoins} 🪙
            </div>
          </div>

          {/* Profession Options Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {professionCards.map((prof) => (
              <div
                key={prof.type}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${prof.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{prof.icon}</span>
                    <span className="text-xs font-bold bg-slate-900/80 px-2 py-0.5 rounded text-amber-400">
                      {prof.tuition} 🪙
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{prof.name}</h4>
                  <p className="text-xs text-slate-300 leading-snug mb-2">{prof.description}</p>
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
                  <strong className="text-slate-200">Perk:</strong> {prof.perk}
                </div>
              </div>
            ))}
          </div>

          {/* Whales Enrollment List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Whale Student Registry ({roster.length})
            </h3>

            <div className="space-y-3">
              {roster.map((whale) => (
                <div
                  key={whale.id}
                  className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                      🐋
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{whale.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-900 text-cyan-400 rounded-full">
                          Lvl {whale.level}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-full capitalize">
                          {whale.career.profession === 'unemployed' ? '🎓 Candidate' : `🎖️ ${whale.career.profession}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Personality: <span className="capitalize text-slate-300">{whale.personality}</span> | Career Rank: Lvl {whale.career.level}/5
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {professionCards.map((p) => {
                      const isCurrent = whale.career.profession === p.type;
                      return (
                        <button
                          key={p.type}
                          onClick={() => onEnrollCollege(whale.id, p.type)}
                          disabled={playerCoins < p.tuition && !isCurrent}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          <span>{p.icon}</span>
                          <span>{p.name.split(' ')[1]}</span>
                          {!isCurrent && <span className="text-[10px] text-amber-400">({p.tuition}🪙)</span>}
                          {isCurrent && <span className="text-[10px] text-emerald-200 font-bold">✓ Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
