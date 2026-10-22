import React, { useState } from 'react';
import { RarityTier } from '../types/game';

interface SpeciesCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SpeciesEntry {
  id: number;
  name: string;
  scientificName: string;
  rarity: RarityTier;
  preferredPersonality: string;
  habitat: string;
  description: string;
  basePower: number;
  baseHp: number;
}

export const SpeciesCatalogModal: React.FC<SpeciesCatalogModalProps> = ({ isOpen, onClose }) => {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'species' | 'breeding'>('species');

  if (!isOpen) return null;

  // 50 Species catalog
  const speciesList: SpeciesEntry[] = [
    // Common (40%)
    { id: 1, name: 'Tidepool Orca', scientificName: 'Orcinus littoralis', rarity: 'common', preferredPersonality: 'Moderate', habitat: 'Shallow reefs', description: 'Friendly coastal orca that enjoys playing in shore kelp.', basePower: 14, baseHp: 80 },
    { id: 2, name: 'Sand Harbor Porpoise', scientificName: 'Phocoena arenaria', rarity: 'common', preferredPersonality: 'Frugal', habitat: 'Sand bars', description: 'Prudent saver that stashes shiny sea pebbles.', basePower: 11, baseHp: 65 },
    { id: 3, name: 'Reef Pilot Whale', scientificName: 'Globicephala scopulus', rarity: 'common', preferredPersonality: 'Moderate', habitat: 'Coral shelf', description: 'Strong navigator that leads smaller fish through strong currents.', basePower: 15, baseHp: 90 },
    { id: 4, name: 'Minke drifter', scientificName: 'Balaenoptera acutorostrata', rarity: 'common', preferredPersonality: 'Lavish', habitat: 'Open shallows', description: 'Energetic filter-feeder with a passion for flashy acrobatics.', basePower: 13, baseHp: 85 },
    { id: 5, name: 'Striped Dolphin', scientificName: 'Stenella coeruleoalba', rarity: 'common', preferredPersonality: 'Moderate', habitat: 'Sunlit waters', description: 'Performs rhythmic belly flops to entertain passing rays.', basePower: 12, baseHp: 70 },
    { id: 6, name: 'Nurse Shark', scientificName: 'Ginglymostoma cirratum', rarity: 'common', preferredPersonality: 'Frugal', habitat: 'Sandy caves', description: 'Gentle bottom-dweller that sleeps on sand beds during midday.', basePower: 13, baseHp: 80 },
    { id: 7, name: 'Spotted Eagle Ray', scientificName: 'Aetobatus narinari', rarity: 'common', preferredPersonality: 'Moderate', habitat: 'Pelagic flats', description: 'Glides like an eagle above the coral crowns.', basePower: 12, baseHp: 75 },
    { id: 8, name: 'Blacktip Reef Shark', scientificName: 'Carcharhinus melanopterus', rarity: 'common', preferredPersonality: 'Lavish', habitat: 'Reef crests', description: 'Always on the prowl for high-stakes snacks and swift races.', basePower: 16, baseHp: 75 },
    { id: 9, name: 'Spinner Dolphin', scientificName: 'Stenella longirostris', rarity: 'common', preferredPersonality: 'Lavish', habitat: 'Cove surface', description: 'Can spin up to 7 times mid-air before splashing back down.', basePower: 12, baseHp: 65 },
    { id: 10, name: 'Gray Whale Scavenger', scientificName: 'Eschrichtius robustus', rarity: 'common', preferredPersonality: 'Frugal', habitat: 'Seabed silt', description: 'Filters amphipods from seabed sand with steady diligence.', basePower: 15, baseHp: 100 },
    { id: 11, name: 'Seaside Beluga', scientificName: 'Delphinapterus leucas', rarity: 'common', preferredPersonality: 'Moderate', habitat: 'Cool currents', description: 'Known as the sea canary due to high-pitched joyful chirps.', basePower: 13, baseHp: 80 },
    { id: 12, name: 'Cove Leopard Shark', scientificName: 'Triakis semifasciata', rarity: 'common', preferredPersonality: 'Frugal', habitat: 'Kelp forests', description: 'Features patterned brown rosettes that camouflage in shadows.', basePower: 14, baseHp: 78 },

    // Uncommon (30%)
    { id: 13, name: 'Glacier Blue Orca', scientificName: 'Orcinus glacialis', rarity: 'uncommon', preferredPersonality: 'Frugal', habitat: 'Deep trenches', description: 'Pale frosted hide with intense frost-resistant blubber.', basePower: 18, baseHp: 105 },
    { id: 14, name: 'Great Hammerhead', scientificName: 'Sphyrna mokarran', rarity: 'uncommon', preferredPersonality: 'Moderate', habitat: 'Open channels', description: 'Cephalofoil snout senses electrical heartbeats of hidden rays.', basePower: 20, baseHp: 95 },
    { id: 15, name: 'Humpback Songstress', scientificName: 'Megaptera novaeangliae', rarity: 'uncommon', preferredPersonality: 'Lavish', habitat: 'Echo canyon', description: 'Composes viral underwater symphonies that echo for leagues.', basePower: 19, baseHp: 120 },
    { id: 16, name: 'Bottlenose Sentinel', scientificName: 'Tursiops truncatus', rarity: 'uncommon', preferredPersonality: 'Moderate', habitat: 'Cove inlet', description: 'Protector of the baby pod and swift responder to shark raids.', basePower: 16, baseHp: 85 },
    { id: 17, name: 'Tiger Shark', scientificName: 'Galeocerdo cuvier', rarity: 'uncommon', preferredPersonality: 'Lavish', habitat: 'Deep shelf', description: 'Voracious apex predator known as the waste-disposal of the sea.', basePower: 22, baseHp: 100 },
    { id: 18, name: 'Giant Oceanic Manta', scientificName: 'Mobula birostris', rarity: 'uncommon', preferredPersonality: 'Frugal', habitat: 'Thermal plumes', description: 'Wingspan exceeding 7 meters; gently barrel-rolls through plankton.', basePower: 17, baseHp: 110 },
    { id: 19, name: 'Short-finned Pilot Whale', scientificName: 'Globicephala macrorhynchus', rarity: 'uncommon', preferredPersonality: 'Moderate', habitat: 'Drop-off zone', description: 'Deep-diving hunter capable of chasing giant squid into the abyss.', basePower: 19, baseHp: 105 },
    { id: 20, name: 'Silky Shark', scientificName: 'Carcharhinus falciformis', rarity: 'uncommon', preferredPersonality: 'Moderate', habitat: 'Pelagic open sea', description: 'Smooth, lustrous skin and razor-sharp sensory awareness.', basePower: 18, baseHp: 90 },
    { id: 21, name: 'Fraser Dolphin', scientificName: 'Lagenodelphis hosei', rarity: 'uncommon', preferredPersonality: 'Frugal', habitat: 'Offshore deep', description: 'Tight pod formation swimmer that rarely leaves the school.', basePower: 15, baseHp: 80 },
    { id: 22, name: 'Basking Giant', scientificName: 'Cetorhinus maximus', rarity: 'uncommon', preferredPersonality: 'Frugal', habitat: 'Plankton bloom', description: 'Passive colossus filtering millions of liters of sea water daily.', basePower: 17, baseHp: 130 },
    { id: 23, name: 'Risso Dolphin', scientificName: 'Grampus griseus', rarity: 'uncommon', preferredPersonality: 'Moderate', habitat: 'Steep continental slopes', description: 'Heavily scarred skin tells tales of duels with colossal squid.', basePower: 18, baseHp: 95 },
    { id: 24, name: 'Thresher Shark', scientificName: 'Alopias vulpinus', rarity: 'uncommon', preferredPersonality: 'Lavish', habitat: 'Upper pelagic', description: 'Whips its elongated tail fin like a scythe to stun prey schools.', basePower: 21, baseHp: 88 },

    // Rare (25% - Sparkle Effects)
    { id: 25, name: 'Bioluminescent Orca', scientificName: 'Orcinus bioluminescens', rarity: 'rare', preferredPersonality: 'Lavish', habitat: 'Abyssal vents', description: 'Skin emits a mesmerizing neon cyan glimmer in midnight waters.', basePower: 25, baseHp: 130 },
    { id: 26, name: 'Emerald Whale Shark', scientificName: 'Rhincodon smaragdinus', rarity: 'rare', preferredPersonality: 'Moderate', habitat: 'Emerald kelp grottos', description: 'Dotted with glowing emerald constellations across its back.', basePower: 24, baseHp: 160 },
    { id: 27, name: 'Shadow Fin Mako', scientificName: 'Isurus oxyrinchus umbra', rarity: 'rare', preferredPersonality: 'Lavish', habitat: 'Jet streams', description: 'Fastest swimmer in the cove, reaching bursts of 74 km/h.', basePower: 27, baseHp: 110 },
    { id: 28, name: 'Commerson Phantom', scientificName: 'Cephalorhynchus commersonii', rarity: 'rare', preferredPersonality: 'Frugal', habitat: 'Frigid shallows', description: 'High-contrast panda markings and ghostly silent stealth.', basePower: 22, baseHp: 95 },
    { id: 29, name: 'Amethyst Hammerhead', scientificName: 'Sphyrna amethystea', rarity: 'rare', preferredPersonality: 'Moderate', habitat: 'Gemstone reef', description: 'Scales glimmer with embedded quartz crystals that refract sunlight.', basePower: 26, baseHp: 125 },
    { id: 30, name: 'Narwhal Lancer', scientificName: 'Monodon monoceros', rarity: 'rare', preferredPersonality: 'Moderate', habitat: 'Pack ice edges', description: 'Spiraled ivory tusk jousts in underwater honor tournaments.', basePower: 24, baseHp: 120 },
    { id: 31, name: 'Bowhead Patriarch', scientificName: 'Balaena mysticetus', rarity: 'rare', preferredPersonality: 'Frugal', habitat: 'Deep permafrost', description: 'Can live over 200 years and holds ancient cove wisdom.', basePower: 23, baseHp: 170 },
    { id: 32, name: 'Irrawaddy River Warden', scientificName: 'Orcaella brevirostris', rarity: 'rare', preferredPersonality: 'Moderate', habitat: 'Estuary delta', description: 'Expressive face with bulging forehead and water-spitting trick.', basePower: 21, baseHp: 100 },
    { id: 33, name: 'Megamouth Lurker', scientificName: 'Megachasma pelagios', rarity: 'rare', preferredPersonality: 'Frugal', habitat: 'Mesopelagic zone', description: 'Glow-in-the-dark mouth lining attracts curious krill in pitch black.', basePower: 25, baseHp: 145 },
    { id: 34, name: 'Golden Fin Finback', scientificName: 'Balaenoptera physalus aureus', rarity: 'rare', preferredPersonality: 'Lavish', habitat: 'Sunken shipwrecks', description: 'Asymmetrical coloring with brilliant golden right-side jaws.', basePower: 26, baseHp: 140 },
    { id: 35, name: 'Blue Ringed Manta', scientificName: 'Mobula caerulocincta', rarity: 'rare', preferredPersonality: 'Lavish', habitat: 'Sulfur fissures', description: 'Flashes glowing indigo warning rings when threatened.', basePower: 23, baseHp: 115 },
    { id: 36, name: 'Greenland Ancient', scientificName: 'Somniosus microcephalus', rarity: 'rare', preferredPersonality: 'Frugal', habitat: 'Benthic darkness', description: 'Slow-moving ancient with flesh enriched by natural antifreeze.', basePower: 24, baseHp: 155 },

    // Legendary (20% - Heavy Gold Glow & Sparkles)
    { id: 37, name: 'Sovereign Titan Orca', scientificName: 'Orcinus imperator', rarity: 'legendary', preferredPersonality: 'Moderate', habitat: 'Cove High Seas', description: 'Regal matriarch crowned by golden sea-spray and thunderous sonar.', basePower: 34, baseHp: 200 },
    { id: 38, name: 'Megalodon Reborn', scientificName: 'Otodus megalodon resurrectus', rarity: 'legendary', preferredPersonality: 'Lavish', habitat: 'The Mariana Rupture', description: 'Prehistoric behemoth with serrated teeth the size of dinner plates.', basePower: 38, baseHp: 190 },
    { id: 39, name: 'Colossus Blue Whale', scientificName: 'Balaenoptera musculus gigas', rarity: 'legendary', preferredPersonality: 'Frugal', habitat: 'Abyssal Expanse', description: 'Heart the size of a shell house; heartbeat echoes across oceans.', basePower: 32, baseHp: 240 },
    { id: 40, name: 'Crown Manta Sovereign', scientificName: 'Mobula diadema', rarity: 'legendary', preferredPersonality: 'Lavish', habitat: 'The Sunken Cathedral', description: 'Glows with celestial gold trails as it soars through the current.', basePower: 30, baseHp: 185 },
    { id: 41, name: 'Abyssal Leviathan', scientificName: 'Balaena abyssus', rarity: 'legendary', preferredPersonality: 'Moderate', habitat: 'Hydrothermal spires', description: 'Armored plates forged from centuries of hydrothermal mineral crust.', basePower: 35, baseHp: 220 },
    { id: 42, name: 'Spectral White Shark', scientificName: 'Carcharodon spectralis', rarity: 'legendary', preferredPersonality: 'Lavish', habitat: 'The Midnight Trench', description: 'Translucent alabaster hide that phases through shadow kelp.', basePower: 36, baseHp: 180 },
    { id: 43, name: 'Solaris Dolphin King', scientificName: 'Delphinus solaris', rarity: 'legendary', preferredPersonality: 'Moderate', habitat: 'Golden Surface Atoll', description: 'Body absorbs sunlight and unleashes blazing auroral wave blasts.', basePower: 31, baseHp: 175 },
    { id: 44, name: 'Crystal Horn Narwhal', scientificName: 'Monodon crystallus', rarity: 'legendary', preferredPersonality: 'Frugal', habitat: 'Glacial Sanctuary', description: 'Tusk composed of solid diamond quartz that channels frost pulses.', basePower: 33, baseHp: 180 },

    // Mythic Tier (Lured with rare setups)
    { id: 45, name: 'Oreo the Primordial Whale', scientificName: 'Orcinus primordialis', rarity: 'mythic', preferredPersonality: 'Moderate', habitat: 'Heart of Whale Cove', description: 'The guardian avatar of the cove, linking all whale souls together.', basePower: 45, baseHp: 280 },
    { id: 46, name: 'Aetherial Sky Whale', scientificName: 'Aerocephus caelum', rarity: 'mythic', preferredPersonality: 'Lavish', habitat: 'Atmospheric Thermocline', description: 'Can breach into the clouds and swim on moonbeams at night.', basePower: 44, baseHp: 260 },
    { id: 47, name: 'Kraken Hunter Sperm Whale', scientificName: 'Physeter macrocephalus rex', rarity: 'mythic', preferredPersonality: 'Frugal', habitat: 'Benthic Hadal Depths', description: 'Commands spermaceti sonic cannon strong enough to shatter stone.', basePower: 48, baseHp: 300 },
    { id: 48, name: 'Nebula Glider Manta', scientificName: 'Mobula stellaris', rarity: 'mythic', preferredPersonality: 'Lavish', habitat: 'Starlight Shallows', description: 'Wings mirror the starry cosmos with shifting supernovas.', basePower: 42, baseHp: 250 },
    { id: 49, name: 'Tiamat Sea Wyrm Shark', scientificName: 'Chondrichthyes draco', rarity: 'mythic', preferredPersonality: 'Lavish', habitat: 'Volcanic Core Trench', description: 'Draconic gills exhale scalding volcanic vapor into the brine.', basePower: 47, baseHp: 275 },
    { id: 50, name: 'Chronos Time Whale', scientificName: 'Aeternus chronos', rarity: 'mythic', preferredPersonality: 'Moderate', habitat: 'Temporal Eddy', description: 'Swims backwards in time to prevent extinction events.', basePower: 50, baseHp: 320 },
  ];

  const breedingCombos = [
    { parentA: 'Tidepool Orca (Common)', parentB: 'Great Hammerhead (Uncommon)', result: 'Amethyst Hammerhead (Rare)', chance: '35%' },
    { parentA: 'Glacier Blue Orca (Uncommon)', parentB: 'Humpback Songstress (Uncommon)', result: 'Bioluminescent Orca (Rare)', chance: '40%' },
    { parentA: 'Bioluminescent Orca (Rare)', parentB: 'Shadow Fin Mako (Rare)', result: 'Sovereign Titan Orca (Legendary)', chance: '25%' },
    { parentA: 'Emerald Whale Shark (Rare)', parentB: 'Crown Manta Sovereign (Legendary)', result: 'Oreo the Primordial (Mythic)', chance: '10%' },
    { parentA: 'Amethyst Hammerhead (Rare)', parentB: 'Crystal Horn Narwhal (Legendary)', result: 'Aetherial Sky Whale (Mythic)', chance: '12%' },
    { parentA: 'Great White Shark', parentB: 'Nurse Shark', result: 'Tiger Shark (Uncommon)', chance: '50%' },
  ];

  const filteredSpecies = speciesList.filter(
    (s) => selectedRarity === 'all' || s.rarity === selectedRarity
  );

  const getRarityBadge = (r: RarityTier) => {
    switch (r) {
      case 'mythic':
        return 'bg-gradient-to-r from-red-500 via-amber-500 to-purple-500 text-white font-extrabold shadow-lg';
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-bold border border-yellow-400 shadow-md';
      case 'rare':
        return 'bg-purple-900/80 text-purple-300 border border-purple-600';
      case 'uncommon':
        return 'bg-emerald-900/80 text-emerald-300 border border-emerald-600';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <h2 className="text-xl font-bold text-cyan-400">Whale Cove Species Catalog (50 Marine Species)</h2>
              <p className="text-xs text-slate-400">
                Official taxonomic field guide, rarity tiers, psychology profiles, and cross-species breeding
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-700/80 px-6 bg-slate-950/40 gap-4">
          <button
            onClick={() => setActiveTab('species')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'species'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🐋 Species Field Guide</span>
            <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{speciesList.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('breeding')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'breeding'
                ? 'border-pink-400 text-pink-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🧬 Cross-Breeding Lab</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'species' && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'common', 'uncommon', 'rare', 'legendary', 'mythic'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedRarity(tier)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                        selectedRarity === tier
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tier} {tier === 'rare' && '✨'} {tier === 'legendary' && '🌟'}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">
                  Showing {filteredSpecies.length} of {speciesList.length}
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSpecies.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col justify-between hover:border-cyan-500/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-slate-400">#{s.id.toString().padStart(2, '0')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${getRarityBadge(s.rarity)}`}>
                          {s.rarity}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm">{s.name}</h4>
                      <p className="text-[11px] italic text-cyan-300/80 mb-2">{s.scientificName}</p>
                      <p className="text-xs text-slate-300 leading-snug mb-3">{s.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Preferred Mindset:</span>
                        <span className="text-slate-200 font-semibold">{s.preferredPersonality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Stats:</span>
                        <span className="text-slate-200">
                          HP: <strong className="text-emerald-400">{s.baseHp}</strong> | Power: <strong className="text-rose-400">{s.basePower}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'breeding' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-pink-950/30 border border-pink-800/40">
                <h3 className="font-bold text-pink-300">🧬 High-Tide Genetic Synergy</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Pairing two compatible whales in a double Shell Cottage can yield rare offspring that inherit enhanced stats and sparkle mutations.
                </p>
              </div>

              <div className="space-y-3">
                {breedingCombos.map((combo, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">❤️</span>
                      <div>
                        <div className="font-semibold text-slate-200 text-sm">
                          {combo.parentA} <span className="text-pink-400">+</span> {combo.parentB}
                        </div>
                        <p className="text-xs text-slate-400">Target Offspring: <span className="text-cyan-300 font-bold">{combo.result}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-900 px-3 py-1 rounded-full border border-slate-700 text-amber-400 font-bold">
                        Success Chance: {combo.chance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
