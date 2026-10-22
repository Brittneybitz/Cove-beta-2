import React, { useState } from 'react';
import { CaughtCreature } from '../types/game';

interface TherapyModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: CaughtCreature[];
  onMarryWhales: (idA: string, idB: string) => void;
  onDivorceWhales: (idA: string, idB: string) => void;
  onMediateCouples: (idA: string, idB: string, outcome: 'reconcile' | 'divorce') => void;
}

export const TherapyModal: React.FC<TherapyModalProps> = ({
  isOpen,
  onClose,
  roster,
  onMarryWhales,
  onDivorceWhales,
  onMediateCouples,
}) => {
  const [selectedCouple, setSelectedCouple] = useState<{ idA: string; idB: string } | null>(null);
  const [divorceConfirmStep, setDivorceConfirmStep] = useState<number>(0);
  const [mediationDialogue, setMediationDialogue] = useState<string[]>([]);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  // Matchmaking selection
  const [marryA, setMarryA] = useState<string>('');
  const [marryB, setMarryB] = useState<string>('');

  if (!isOpen) return null;

  // Find married couples
  const couples: { whaleA: CaughtCreature; whaleB: CaughtCreature }[] = [];
  const processed = new Set<string>();

  roster.forEach((whale) => {
    if (whale.social.marriedToId && !processed.has(whale.id)) {
      const spouse = roster.find((r) => r.id === whale.social.marriedToId);
      if (spouse) {
        couples.push({ whaleA: whale, whaleB: spouse });
        processed.add(whale.id);
        processed.add(spouse.id);
      }
    }
  });

  const startMediation = (whaleA: CaughtCreature, whaleB: CaughtCreature) => {
    setSelectedCouple({ idA: whaleA.id, idB: whaleB.id });
    setIsSessionActive(true);
    setDivorceConfirmStep(0);

    const issues: string[] = [];
    if (whaleA.personality === 'lavish' || whaleB.personality === 'lavish') {
      issues.push(
        `Dr. Fin: "Welcome both of you. It appears excessive spending on bioluminescent pearls and late nights at the Coral Casino has put strain on your marriage."`
      );
    }
    if (whaleA.social.isCheating || whaleB.social.isCheating) {
      issues.push(
        `Dr. Fin: "We need to address the dolphin in the room: rumors of late-night swimming flings in the deep trench."`
      );
    } else {
      issues.push(
        `Dr. Fin: "Communication is breaking down over who forages the kelp and who cleans the shell cottage floor."`
      );
    }

    issues.push(
      `${whaleA.name}: "I just feel like my sonar signals aren't being heard! *dramatic whale click*"`
    );
    issues.push(
      `${whaleB.name}: "And I'm tired of working double shifts at the Stone Mine while you dance to Sandstorm!"`
    );

    setMediationDialogue(issues);
  };

  const handleReconcile = () => {
    if (!selectedCouple) return;
    onMediateCouples(selectedCouple.idA, selectedCouple.idB, 'reconcile');
    setMediationDialogue((prev) => [
      ...prev,
      `🤝 Breakthrough! Both whales practiced deep breathing exercises and agreed to split the utility bills evenly. Bond increased by +3!`,
    ]);
    setTimeout(() => {
      setIsSessionActive(false);
      setSelectedCouple(null);
    }, 2500);
  };

  const handleDivorceClick = () => {
    if (divorceConfirmStep < 2) {
      setDivorceConfirmStep((prev) => prev + 1);
    } else {
      if (selectedCouple) {
        onDivorceWhales(selectedCouple.idA, selectedCouple.idB);
        setMediationDialogue((prev) => [
          ...prev,
          `💔 Divorce finalized! The shell house has been partitioned, alimony negotiated in squid treats, and both whales have regained independent bachelor status.`,
        ]);
        setTimeout(() => {
          setIsSessionActive(false);
          setSelectedCouple(null);
          setDivorceConfirmStep(0);
        }, 2500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900/95 border border-pink-500/40 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❤️</span>
            <div>
              <h2 className="text-xl font-bold text-pink-400">Couples Therapy & Whale Matrimony</h2>
              <p className="text-xs text-slate-400">
                Resolve domestic disputes, mediate infidelity drama, or navigate the 3-click divorce protocol
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
          {/* Active Mediation Session */}
          {isSessionActive && selectedCouple && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-pink-500/50 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
                <span className="font-bold text-pink-300 flex items-center gap-2">
                  <span>🛋️</span> In Mediation with Dr. Fin
                </span>
                <span className="text-xs px-2.5 py-1 bg-pink-950 text-pink-300 rounded-full border border-pink-800/60">
                  Active Counseling
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm">
                {mediationDialogue.map((line, idx) => (
                  <p key={idx} className="leading-relaxed text-slate-200">
                    {line}
                  </p>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleReconcile}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex-1 shadow-lg shadow-emerald-900/30"
                >
                  🌱 Restore Trust & Reconcile (+3 Bond)
                </button>

                <button
                  onClick={handleDivorceClick}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-950/40"
                >
                  {divorceConfirmStep === 0 && '💔 File for Divorce (Click 1/3)'}
                  {divorceConfirmStep === 1 && '⚠️ Confirm Irreconcilable Differences? (Click 2/3)'}
                  {divorceConfirmStep === 2 && '🚨 FINAL CONFIRMATION: Sever Matrimony (Click 3/3)'}
                </button>
              </div>
            </div>
          )}

          {/* Married Whales Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              💍 Current Whale Marriages ({couples.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {couples.map(({ whaleA, whaleB }) => (
                <div
                  key={`${whaleA.id}-${whaleB.id}`}
                  className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col justify-between hover:border-pink-500/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-pink-300 text-sm">
                        {whaleA.name} & {whaleB.name}
                      </span>
                      <span className="text-xs bg-pink-950/80 text-pink-300 px-2 py-0.5 rounded-full border border-pink-800/40">
                        Bond: {whaleA.social.bondPoints}/10
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>
                        {whaleA.name} ({whaleA.personality}) — Wallet: {whaleA.economy.wallet}🪙
                      </p>
                      <p>
                        {whaleB.name} ({whaleB.personality}) — Wallet: {whaleB.economy.wallet}🪙
                      </p>
                      {(whaleA.social.isCheating || whaleB.social.isCheating) && (
                        <p className="text-amber-400 font-semibold">
                          ⚠️ Suspected Infidelity Detected!
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center gap-2">
                    <button
                      onClick={() => startMediation(whaleA, whaleB)}
                      className="w-full py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <span>🛋️ Enter Couples Therapy</span>
                    </button>
                  </div>
                </div>
              ))}

              {couples.length === 0 && (
                <div className="col-span-2 text-center py-6 text-slate-500 italic bg-slate-950/30 rounded-xl border border-slate-800">
                  No married whale couples yet. Matchmake two compatible whales below!
                </div>
              )}
            </div>
          </div>

          {/* Matchmaking Section */}
          <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <h3 className="text-sm font-bold text-pink-300">💘 Whale Matchmaking & Nuptials</h3>
            <p className="text-xs text-slate-400">
              Select two unmarried whales to tie the knot. Married whales share shell cottages and gain joint income boosts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={marryA}
                onChange={(e) => setMarryA(e.target.value)}
                className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-pink-400"
              >
                <option value="">-- Select First Whale --</option>
                {roster
                  .filter((w) => !w.social.marriedToId && w.id !== marryB)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.personality})
                    </option>
                  ))}
              </select>

              <select
                value={marryB}
                onChange={(e) => setMarryB(e.target.value)}
                className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg p-2 focus:outline-none focus:border-pink-400"
              >
                <option value="">-- Select Second Whale --</option>
                {roster
                  .filter((w) => !w.social.marriedToId && w.id !== marryA)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.personality})
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (marryA && marryB) {
                  onMarryWhales(marryA, marryB);
                  setMarryA('');
                  setMarryB('');
                }
              }}
              disabled={!marryA || !marryB}
              className="w-full py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition"
            >
              💍 Officiate Whale Marriage Ceremony
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
