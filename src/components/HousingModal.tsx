import React, { useState } from 'react';
import { CaughtCreature, ShellHouse } from '../types/game';

interface HousingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: CaughtCreature[];
  houses: ShellHouse[];
  onBuildHouse: () => void;
  onAssignHouse: (creatureId: string, houseId: string) => void;
  onPardonDebt: (creatureId: string) => void;
  playerCoins: number;
}

export const HousingModal: React.FC<HousingModalProps> = ({
  isOpen,
  onClose,
  roster,
  houses,
  onBuildHouse,
  onAssignHouse,
  onPardonDebt,
  playerCoins,
}) => {
  const [activeTab, setActiveTab] = useState<'estates' | 'reef' | 'bills'>('estates');

  if (!isOpen) return null;

  const homelessOrEvicted = roster.filter(
    (c) => c.economy.isEvicted || c.economy.isHomeless || !c.houseId
  );
  const housedWhales = roster.filter((c) => c.houseId && !c.economy.isEvicted);
  const totalOutstandingDebt = roster.reduce((sum, c) => sum + c.economy.debt, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐚</span>
            <div>
              <h2 className="text-xl font-bold text-cyan-400">Whale Cove Housing & Civil Registry</h2>
              <p className="text-xs text-slate-400">
                Snap-grid shell properties, rent & utility collection, debt relief & eviction oversight
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

        {/* Tab navigation */}
        <div className="flex border-b border-slate-700/80 px-6 bg-slate-950/40 gap-4">
          <button
            onClick={() => setActiveTab('estates')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'estates'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏘️ Shell Estates</span>
            <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{houses.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'bills'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚡ Bills & Debt Management</span>
            {totalOutstandingDebt > 0 && (
              <span className="bg-amber-900/80 text-amber-300 text-xs px-2 py-0.5 rounded-full">
                {totalOutstandingDebt}🪙
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reef')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'reef'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🪸 The Reef (Homeless District)</span>
            {homelessOrEvicted.length > 0 && (
              <span className="bg-rose-950 text-rose-300 text-xs px-2 py-0.5 rounded-full">
                {homelessOrEvicted.length}
              </span>
            )}
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'estates' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40">
                <div>
                  <h3 className="font-semibold text-cyan-200">Expand Ocean Snap-Grid Capacity</h3>
                  <p className="text-xs text-slate-400">
                    Construct a Nautilus Shell Cottage on the seabed. Whales living in homes stay clean and regenerate mood faster.
                  </p>
                </div>
                <button
                  onClick={onBuildHouse}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/40 flex items-center gap-2 transition"
                >
                  <span>🔨 Build Shell Cottage</span>
                  <span className="text-xs bg-slate-900/60 px-2 py-0.5 rounded">100 🪙</span>
                </button>
              </div>

              {/* Houses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {houses.map((house) => {
                  const occupant = roster.find((r) => r.houseId === house.id && !r.economy.isEvicted);
                  return (
                    <div
                      key={house.id}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col justify-between hover:border-cyan-500/50 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-cyan-300">{house.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-cyan-950 text-cyan-400 rounded-full border border-cyan-800/50">
                            Grid [{house.gridX}, {house.gridZ}]
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mb-3">
                          {occupant ? (
                            <div className="space-y-1">
                              <p className="text-emerald-400 font-semibold flex items-center gap-1">
                                <span>🐋 Resident:</span> {occupant.name}
                              </p>
                              <p>Rent: {occupant.economy.rentBill}🪙/cycle</p>
                              <p>Utilities: {occupant.economy.utilityBill}🪙 | Power: {occupant.economy.electricBill}🪙</p>
                            </div>
                          ) : (
                            <p className="text-slate-500 italic">Unoccupied Shell — Ready to house a whale.</p>
                          )}
                        </div>
                      </div>

                      {/* Assignment selector */}
                      <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
                        <select
                          value={occupant?.id || ''}
                          onChange={(e) => onAssignHouse(e.target.value, house.id)}
                          className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:border-cyan-400"
                        >
                          <option value="">-- Vacant / Evict --</option>
                          {roster.map((wh) => (
                            <option key={wh.id} value={wh.id}>
                              {wh.name} ({wh.personality}) {wh.houseId === house.id ? '✓ Current' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {houses.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-3xl mb-2">🐚</p>
                  <p>No shell homes built yet. Click "Build Shell Cottage" to house your whales!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-amber-300">Cove Utility & Rent Delinquency</h4>
                  <p className="text-xs text-slate-400">
                    Lavish whales often skip bills for luxury accessories. Unpaid debt leads to eviction and homelessness.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Unpaid Debt</span>
                  <span className="text-xl font-bold text-amber-400">{totalOutstandingDebt} 🪙</span>
                </div>
              </div>

              <div className="space-y-3">
                {roster.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                        🐋
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{wh.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                              wh.personality === 'lavish'
                                ? 'bg-purple-900/70 text-purple-300 border border-purple-700'
                                : wh.personality === 'frugal'
                                ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700'
                                : 'bg-blue-900/70 text-blue-300 border border-blue-700'
                            }`}
                          >
                            {wh.personality}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Wallet: {wh.economy.wallet}🪙 | Debt: <span className="text-rose-400 font-bold">{wh.economy.debt}🪙</span> |
                          Days delinquent: {wh.economy.daysDelinquent}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {wh.economy.debt > 0 ? (
                        <button
                          onClick={() => onPardonDebt(wh.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1.5"
                        >
                          <span>📜 Grant Debt Pardon</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          ✓ Bills in Good Standing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reef' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50">
                <h4 className="font-bold text-rose-300 flex items-center gap-2">
                  <span>⚠️</span> The Reef: Homelessness & Crisis Zone
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Whales evicted due to unpaid debt or lack of housing dwell in the dangerous Outer Reef. Whales here have a <strong>30% chance</strong> of developing severe sickness or substance dependency. Build houses and grant pardons to rehabilitate them!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homelessOrEvicted.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-4 rounded-xl bg-slate-800/80 border border-rose-900/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{wh.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-rose-900/80 text-rose-300 rounded-full">
                          {wh.economy.isEvicted ? 'Evicted' : 'Homeless'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Status: <span className="text-amber-400">{wh.status.hunger}</span> | Sickness:{' '}
                        <span className={wh.status.sickness !== 'healthy' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {wh.status.sickness}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Outstanding Debt: {wh.economy.debt} 🪙
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center gap-2">
                      <button
                        onClick={() => onPardonDebt(wh.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex-1 transition"
                      >
                        Pardon & Rehabilitate
                      </button>
                    </div>
                  </div>
                ))}

                {homelessOrEvicted.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                    🎉 Excellent! Every whale currently has a warm Nautilus Shell Home.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
