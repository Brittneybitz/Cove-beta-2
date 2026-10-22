import { useState, useEffect } from 'react';
import { OceanScene } from './three/OceanScene';
import { BattleModal } from './components/BattleModal';
import { RosterModal } from './components/RosterModal';
import { HudOverlay } from './components/HudOverlay';
import { ModelManagerModal } from './components/ModelManagerModal';
import { WhaleChatModal } from './components/WhaleChatModal';
import { HousingModal } from './components/HousingModal';
import { TherapyModal } from './components/TherapyModal';
import { CollegeModal } from './components/CollegeModal';
import { SpeciesCatalogModal } from './components/SpeciesCatalogModal';
import { PostCatchModal } from './components/PostCatchModal';
import {
  BattleState,
  CameraViewMode,
  CaughtCreature,
  CreatureType,
  Inventory,
  WildCreatureData,
  TimeOfDay,
  ShellHouse,
  ProfessionType,
  ControlScheme,
  PostCatchData,
} from './types/game';
import {
  CustomModelConfig,
  ModelTarget,
  getAllCustomModels,
  saveCustomModel,
  deleteCustomModel,
  ModelExportPreset,
} from './services/customModelStorage';
import { soundManager } from './audio/soundManager';

const DEFAULT_MODELS_STATE: Record<ModelTarget, CustomModelConfig> = {
  orca: { target: 'orca', sourceType: 'default', scale: 1.0, offsetY: 0 },
  shark: { target: 'shark', sourceType: 'default', scale: 1.0, offsetY: 0 },
  dolphin: { target: 'dolphin', sourceType: 'default', scale: 1.0, offsetY: 0 },
  hammerhead: { target: 'hammerhead', sourceType: 'default', scale: 1.0, offsetY: 0 },
  manta: { target: 'manta', sourceType: 'default', scale: 1.0, offsetY: 0 },
  fish: { target: 'fish', sourceType: 'default', scale: 1.0, offsetY: 0 },
};

export default function App() {
  // GDD Full Inventory
  const [inventory, setInventory] = useState<Inventory>({
    fishTreats: 6,
    kelpSnacks: 6,
    driftwood: 25,
    coral: 20,
    stone: 15,
    iron: 10,
    sand: 30,
    topaz: 3,
    quartz: 4,
    ruby: 2,
    sapphire: 2,
    amethyst: 2,
    bloom: 2,
    seaAnemone: 2,
    standardFlutes: 1,
    silverFlutes: 0,
    goldenFlutes: 0,
    raveCandies: 1,
    whaleMeat: 0,
    sharkMeat: 0,
    playerCoins: 220,
  });

  // Shell Houses
  const [houses, setHouses] = useState<ShellHouse[]>([
    { id: 'house-1', name: 'Nautilus Haven', gridX: 0, gridZ: 0, level: 1 },
    { id: 'house-2', name: 'Coral Cove Villa', gridX: 1, gridZ: 0, level: 1 },
  ]);

  // Caught whales
  const [roster, setRoster] = useState<CaughtCreature[]>([
    {
      id: 'oreo-starter',
      name: 'Oreo',
      type: 'orca',
      caughtAt: 'Day 1',
      level: 12,
      nickname: 'Oreo',
      rarity: 'mythic',
      personality: 'moderate',
      speciesName: 'Oreo the Primordial Whale',
      houseId: 'house-1',
      stats: { hp: 100, speed: 14, power: 22, defense: 18 },
      status: {
        hp: 100,
        maxHp: 100,
        mood: 95,
        hunger: 'well_fed',
        cleanliness: 'clean',
        sickness: 'healthy',
        honor: 100,
      },
      economy: {
        wallet: 45,
        debt: 0,
        rentBill: 5,
        electricBill: 2,
        utilityBill: 3,
        daysDelinquent: 0,
        isEvicted: false,
        isHomeless: false,
      },
      social: {
        bondPoints: 8,
      },
      career: {
        profession: 'doctor',
        level: 2,
      },
    },
  ]);

  const [activeCompanion, setActiveCompanion] = useState<CreatureType>('orca');
  const [swimSpeed, setSwimSpeed] = useState<number>(0.5);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('free');

  // Pokémon-style Level & EXP System
  const [companionLevel, setCompanionLevel] = useState<number>(12);
  const [companionExp, setCompanionExp] = useState<number>(35);
  const [companionExpNext, setCompanionExpNext] = useState<number>(120);

  // Minecraft vs Orbit Control Scheme
  const [controlScheme, setControlScheme] = useState<ControlScheme>('minecraft');
  const [mobileMoveVector, setMobileMoveVector] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // Post-Catch Inspection & Butcher Screen
  const [postCatchData, setPostCatchData] = useState<PostCatchData | null>(null);

  // Time of Day & Environmental Events
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('midday');
  const [isRaveParty, setIsRaveParty] = useState<boolean>(false);
  const [isSharkRaidActive, setIsSharkRaidActive] = useState<boolean>(false);

  // Custom 3D Models
  const [customModels, setCustomModels] = useState<Record<ModelTarget, CustomModelConfig>>(DEFAULT_MODELS_STATE);

  // Modals
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isHousingOpen, setIsHousingOpen] = useState(false);
  const [isCollegeOpen, setIsCollegeOpen] = useState(false);
  const [isTherapyOpen, setIsTherapyOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Load saved models from browser IndexedDB
  useEffect(() => {
    getAllCustomModels()
      .then((stored) => {
        if (stored && Object.keys(stored).length > 0) {
          setCustomModels((prev) => ({
            ...prev,
            ...stored,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const customModelCount = Object.values(customModels).filter(
    (m) => m && m.sourceType !== 'default'
  ).length;

  const [wildEncounterTrigger, setWildEncounterTrigger] = useState<number>(0);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // Periodic Life Simulation Loop (Bills, Jobs, Health)
  useEffect(() => {
    const simTimer = setInterval(() => {
      setRoster((prevRoster) => {
        return prevRoster.map((whale) => {
          // Profession perks
          let addedWallet = 0;
          if (whale.career.profession === 'shopkeeper') {
            addedWallet += 5 * whale.career.level;
          } else if (whale.career.profession === 'banker') {
            addedWallet += Math.floor(whale.economy.wallet * 0.05) + 3;
          }

          // Bills
          const billsDue = whale.economy.rentBill + whale.economy.electricBill + whale.economy.utilityBill;
          let currentWallet = whale.economy.wallet + addedWallet;
          let currentDebt = whale.economy.debt;
          let daysDelinquent = whale.economy.daysDelinquent;
          let isEvicted = whale.economy.isEvicted;

          // Lavish whales spend extravagantly on accessories
          if (whale.personality === 'lavish' && Math.random() < 0.3) {
            currentWallet = Math.max(0, currentWallet - 12);
          }

          if (currentWallet >= billsDue) {
            currentWallet -= billsDue;
            daysDelinquent = 0;
          } else {
            const shortfall = billsDue - currentWallet;
            currentWallet = 0;
            currentDebt += shortfall;
            daysDelinquent += 1;

            if (daysDelinquent >= 3 && !isEvicted) {
              isEvicted = true;
            }
          }

          // Health / Sickness progression
          let sickness = whale.status.sickness;
          if (isEvicted && sickness === 'healthy' && Math.random() < 0.3) {
            sickness = 'sick';
          }

          return {
            ...whale,
            status: {
              ...whale.status,
              sickness,
            },
            economy: {
              ...whale.economy,
              wallet: currentWallet,
              debt: currentDebt,
              daysDelinquent,
              isEvicted,
            },
          };
        });
      });

      // Doctor whales heal the pod!
      const doctors = roster.filter((r) => r.career.profession === 'doctor');
      if (doctors.length > 0) {
        setRoster((prev) =>
          prev.map((w) =>
            w.status.sickness !== 'healthy' && Math.random() < 0.5
              ? { ...w, status: { ...w.status, sickness: 'healthy' } }
              : w
          )
        );
      }

      // Shopkeepers generate passive player coins
      const shopkeepers = roster.filter((r) => r.career.profession === 'shopkeeper');
      if (shopkeepers.length > 0) {
        setInventory((prev) => ({
          ...prev,
          playerCoins: prev.playerCoins + shopkeepers.length * 4,
        }));
      }
    }, 35000);

    return () => clearInterval(simTimer);
  }, [roster]);

  // Periodic Shark Raid Event (30% chance every 75 seconds)
  useEffect(() => {
    const raidTimer = setInterval(() => {
      if (!isSharkRaidActive && Math.random() < 0.35) {
        setIsSharkRaidActive(true);
        soundManager.playAttackCrash();
        showToast('⚠️ SHARK RAID ALERT! Marauding sharks are circling the cove!');
        setTimeout(() => {
          setIsSharkRaidActive(false);
          showToast('🛡️ Pod defense successful! The marauders retreated into the deep!');
        }, 22000);
      }
    }, 75000);

    return () => clearInterval(raidTimer);
  }, [isSharkRaidActive]);

  // Time of Day Cycler
  const handleCycleTimeOfDay = () => {
    const sequence: TimeOfDay[] = ['morning', 'midday', 'sunset', 'night'];
    const curIdx = sequence.indexOf(timeOfDay);
    const nextTod = sequence[(curIdx + 1) % sequence.length];
    setTimeOfDay(nextTod);
    showToast(`Time shifted to ${nextTod.toUpperCase()} 🌊`);
  };

  // Rave Candy Party (Sandstorm 2-minute dance party!)
  const handleTriggerRave = () => {
    if (inventory.raveCandies <= 0) {
      showToast('Need 1 Rave Candy! (Craft with 1 Bloom + 1 Sea Anemone)');
      return;
    }

    setInventory((prev) => ({ ...prev, raveCandies: prev.raveCandies - 1 }));
    setIsRaveParty(true);
    soundManager.playCatchSuccess();
    showToast('🎉 RAVE CANDY ACTIVATED! SANDSTORM DISCO PARTY! 🌈');

    setTimeout(() => {
      setIsRaveParty(false);
      showToast('The rave party settled down. The cove rests. ✨');
    }, 120000); // 2 minutes
  };

  // Gem mining on seabed
  const handleMineGem = (
    type: 'topaz' | 'quartz' | 'ruby' | 'sapphire' | 'amethyst'
  ) => {
    const minerBoost = roster.some((r) => r.career.profession === 'miner') ? 2 : 1;
    setInventory((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + minerBoost,
      playerCoins: prev.playerCoins + 8,
    }));
    showToast(`💎 Mined +${minerBoost} ${type.toUpperCase()} & +8 Coins!`);
  };

  // Custom Model Actions
  const handleSaveModel = async (config: CustomModelConfig) => {
    await saveCustomModel(config);
    setCustomModels((prev) => ({
      ...prev,
      [config.target]: config,
    }));
    showToast(`Saved 3D model for ${config.target}!`);
  };

  const handleResetModel = async (target: ModelTarget) => {
    await deleteCustomModel(target);
    const resetConfig: CustomModelConfig = {
      target,
      sourceType: 'default',
      scale: 1.0,
      offsetY: 0,
    };
    setCustomModels((prev) => ({
      ...prev,
      [target]: resetConfig,
    }));
    showToast(`Reset ${target} to default procedural 3D model.`);
  };

  const handleImportConfig = async (jsonText: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonText) as ModelExportPreset;
      if (!parsed || !parsed.models) return false;

      const updatedModels = { ...customModels };

      for (const [key, val] of Object.entries(parsed.models)) {
        const target = key as ModelTarget;
        if (val) {
          const newConfig: CustomModelConfig = {
            target,
            sourceType: val.url ? 'url' : 'default',
            url: val.url,
            fileName: val.fileName || 'imported_model.glb',
            scale: val.scale || 1.0,
            offsetY: val.offsetY || 0,
          };
          await saveCustomModel(newConfig);
          updatedModels[target] = newConfig;
        }
      }

      setCustomModels(updatedModels);
      showToast('Imported and applied model configuration! 📦');
      return true;
    } catch {
      return false;
    }
  };

  // Oreo speech bubble
  const [oreoBubble, setOreoBubble] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  } | null>(null);

  // Battle State
  const [battleState, setBattleState] = useState<BattleState>({
    active: false,
    enemy: null,
    playerHp: 100,
    playerMaxHp: 100,
    status: 'player_turn',
    log: [],
  });

  // Clicking Oreo
  const handleSelectOreo = (screenPos: { x: number; y: number }) => {
    const greetings = [
      'Hungry... 🐟',
      'Ready for adventure! 🌊',
      'The water is warm today! ☀️',
      'Splashing around! 💦',
      'Whale whistle! 🎵',
    ];
    const text = greetings[Math.floor(Math.random() * greetings.length)];
    setOreoBubble({
      visible: true,
      x: screenPos.x,
      y: screenPos.y,
      text,
    });
  };

  // Feeding Oreo
  const handleFeedFish = () => {
    if (inventory.fishTreats <= 0) return;
    setInventory((prev) => ({ ...prev, fishTreats: prev.fishTreats - 1 }));
    setOreoBubble((prev) =>
      prev ? { ...prev, text: 'Yummy fish! Oreo feels loved! 💖' } : null
    );
    showToast('Fed Oreo 1 Fish Treat! +10 Friendship ✨');
  };

  const handleFeedKelp = () => {
    if (inventory.kelpSnacks <= 0) return;
    setInventory((prev) => ({ ...prev, kelpSnacks: prev.kelpSnacks - 1 }));
    setOreoBubble((prev) =>
      prev ? { ...prev, text: 'Crunchy kelp! Oreo is energized! 🌿' } : null
    );
    showToast('Fed Oreo 1 Kelp Snack! +5 Stamina 🌿');
  };

  // Foraging Fish & Kelp
  const handleHarvestFish = () => {
    setInventory((prev) => ({ ...prev, fishTreats: prev.fishTreats + 1 }));
    showToast('+1 Fish Treat harvested! 🐟');
  };

  const handleHarvestKelp = () => {
    setInventory((prev) => ({ ...prev, kelpSnacks: prev.kelpSnacks + 1 }));
    showToast('+1 Kelp Snack foraged! 🌿');
  };

  // Crafting Sea Flutes
  const handleCraftFlute = (type: 'standard' | 'silver' | 'golden') => {
    if (type === 'standard') {
      if (inventory.fishTreats < 3 || inventory.kelpSnacks < 3) {
        showToast('Need 3 Fish + 3 Kelp for Standard Flute!');
        return;
      }
      setInventory((prev) => ({
        ...prev,
        fishTreats: prev.fishTreats - 3,
        kelpSnacks: prev.kelpSnacks - 3,
        standardFlutes: prev.standardFlutes + 1,
      }));
      showToast('🎵 Crafted 1 Standard Sea Flute (40% catch)!');
    } else if (type === 'silver') {
      if (inventory.fishTreats < 5 || inventory.kelpSnacks < 5 || inventory.quartz < 2) {
        showToast('Need 5 Fish + 5 Kelp + 2 Quartz for Silver Flute!');
        return;
      }
      setInventory((prev) => ({
        ...prev,
        fishTreats: prev.fishTreats - 5,
        kelpSnacks: prev.kelpSnacks - 5,
        quartz: prev.quartz - 2,
        silverFlutes: prev.silverFlutes + 1,
      }));
      showToast('🥈 Crafted 1 Silver Sea Flute (50% catch)!');
    } else if (type === 'golden') {
      if (inventory.fishTreats < 8 || inventory.kelpSnacks < 8 || inventory.topaz < 2) {
        showToast('Need 8 Fish + 8 Kelp + 2 Topaz for Golden Flute!');
        return;
      }
      setInventory((prev) => ({
        ...prev,
        fishTreats: prev.fishTreats - 8,
        kelpSnacks: prev.kelpSnacks - 8,
        topaz: prev.topaz - 2,
        goldenFlutes: prev.goldenFlutes + 1,
      }));
      showToast('🌟 Crafted 1 Golden Sea Flute (80% catch)!');
    }
  };

  // Start Wild Encounter
  const handleEncounterWild = (creature: WildCreatureData) => {
    setBattleState({
      active: true,
      enemy: { ...creature },
      playerHp: 100,
      playerMaxHp: 100,
      status: 'player_turn',
      log: [
        `${creature.name} (${creature.rarity}) approached with curious intent!`,
        `Personality: ${creature.personality}. Play a Sea Flute to befriend!`,
      ],
    });
    setOreoBubble(null);
  };

  // Battle Actions with Flute tier selection
  const handleBattleAction = (
    action: 'splash' | 'crash' | 'guard' | 'catch' | 'flee',
    fluteType: 'standard' | 'silver' | 'golden' = 'standard'
  ) => {
    if (!battleState.enemy) return;

    if (action === 'flee') {
      setBattleState((prev) => ({
        ...prev,
        status: 'fled',
        animAction: 'idle',
        log: [...prev.log, 'Oreo dove deep into the reefs and safely escaped!'],
      }));
      return;
    }

    // EXP Leveling Helper
    const grantCompanionExp = (amount: number) => {
      let newExp = companionExp + amount;
      let newLvl = companionLevel;
      let newExpNext = companionExpNext;
      let didLvlUp = false;

      while (newExp >= newExpNext) {
        newExp -= newExpNext;
        newLvl += 1;
        newExpNext = newLvl * 45;
        didLvlUp = true;
      }

      setCompanionExp(newExp);
      setCompanionLevel(newLvl);
      setCompanionExpNext(newExpNext);

      if (didLvlUp) {
        soundManager.playLevelUpFanfare();
        showToast(`🌟 LEVEL UP! Oreo reached Level ${newLvl}! (+HP, +ATK, +DEF)`);
      }
      return { didLvlUp, amount };
    };

    if (action === 'catch') {
      const fluteCount =
        fluteType === 'golden'
          ? inventory.goldenFlutes
          : fluteType === 'silver'
          ? inventory.silverFlutes
          : inventory.standardFlutes;

      if (fluteCount <= 0) {
        showToast(`You have no ${fluteType} flutes!`);
        return;
      }

      setInventory((prev) => ({
        ...prev,
        [fluteType === 'golden'
          ? 'goldenFlutes'
          : fluteType === 'silver'
          ? 'silverFlutes'
          : 'standardFlutes']:
          prev[
            fluteType === 'golden'
              ? 'goldenFlutes'
              : fluteType === 'silver'
              ? 'silverFlutes'
              : 'standardFlutes'
          ] - 1,
      }));

      soundManager.playFluteCatchChime();

      setBattleState((prev) => ({
        ...prev,
        status: 'catching',
        animAction: 'idle',
        log: [...prev.log, `You played a harmonious tune on the ${fluteType} flute! 🎵`],
      }));

      const enemy = battleState.enemy;
      const hpRatio = enemy.hp / enemy.maxHp;
      const baseRate = fluteType === 'golden' ? 0.8 : fluteType === 'silver' ? 0.5 : 0.4;
      const catchRate = Math.min(0.98, baseRate + (1 - hpRatio) * 0.35);
      const roll = Math.random();

      setTimeout(() => {
        if (roll < catchRate) {
          soundManager.playPokemonVictoryFanfare();
          const { didLvlUp, amount } = grantCompanionExp(Math.floor(45 + Math.random() * 25));

          setBattleState((prev) => ({
            ...prev,
            status: 'victory',
            animAction: 'idle',
            expGained: amount,
            leveledUp: didLvlUp,
            log: [
              ...prev.log,
              `✨ Gotcha! Wild ${enemy.name} was successfully befriended!`,
              `Companion earned +${amount} EXP!`,
            ],
          }));

          // Open the Post-Catch inspect & butcher decision screen
          setPostCatchData({
            creature: enemy,
            defaultName: enemy.name,
          });
        } else {
          soundManager.playAttackCrash();
          setBattleState((prev) => ({
            ...prev,
            status: 'player_turn',
            animAction: 'idle',
            log: [
              ...prev.log,
              `Oh no! ${enemy.name} resisted the melody! Reduce its HP to increase catch chance.`,
            ],
          }));
        }
      }, 1400);
      return;
    }

    // Attacks & Player Turn
    let damage = 0;
    let playerGuarded = false;

    if (action === 'splash') {
      damage = Math.floor(15 + Math.random() * 10);
      soundManager.playAttackSplash();
    } else if (action === 'crash') {
      damage = Math.floor(25 + Math.random() * 14);
      soundManager.playAttackCrash();
    } else if (action === 'guard') {
      playerGuarded = true;
      soundManager.playFeed();
    }

    const nextEnemyHp = Math.max(0, battleState.enemy.hp - damage);
    const victory = nextEnemyHp <= 0;

    let battleExpGained = 0;
    let levelUpOccurred = false;

    if (victory) {
      soundManager.playPokemonVictoryFanfare();
      const expRes = grantCompanionExp(Math.floor(35 + Math.random() * 20));
      battleExpGained = expRes.amount;
      levelUpOccurred = expRes.didLvlUp;
    }

    setBattleState((prev) => ({
      ...prev,
      enemy: prev.enemy ? { ...prev.enemy, hp: nextEnemyHp } : null,
      status: victory ? 'victory' : 'enemy_turn',
      animAction: playerGuarded ? 'player_guard' : 'player_attack',
      expGained: battleExpGained,
      leveledUp: levelUpOccurred,
      log: [
        ...prev.log,
        playerGuarded
          ? 'Oreo raised a shimmering Aqua Barrier!'
          : `Oreo lunged forward with a move dealing ${damage} damage to ${battleState.enemy?.name}!`,
        victory
          ? `🏆 Victory! ${battleState.enemy?.name} was defeated! Earned +${battleExpGained} EXP!`
          : `${battleState.enemy?.name} is readying a counter-attack!`,
      ],
    }));

    if (victory) {
      setTimeout(() => {
        setBattleState((prev) => ({ ...prev, animAction: 'idle' }));
      }, 700);
      return;
    }

    // Reset player attack animation after lunge
    setTimeout(() => {
      setBattleState((prev) => ({
        ...prev,
        animAction: playerGuarded ? 'player_guard' : 'idle',
      }));
    }, 450);

    // Enemy Turn after 1 second
    setTimeout(() => {
      const enemy = battleState.enemy;
      if (!enemy) return;

      let rawDamage = Math.floor(enemy.attackPower * (0.8 + Math.random() * 0.4));
      if (playerGuarded) {
        rawDamage = Math.max(1, Math.floor(rawDamage * 0.5));
      }

      soundManager.playAttackCrash();

      setBattleState((prev) => {
        const nextPlayerHp = Math.max(0, prev.playerHp - rawDamage);
        const defeated = nextPlayerHp <= 0;

        return {
          ...prev,
          playerHp: nextPlayerHp,
          status: defeated ? 'defeated' : 'player_turn',
          animAction: 'enemy_attack',
          log: [
            ...prev.log,
            `⚡ ${enemy.name} lunged with a counter-strike! Took ${rawDamage} damage!`,
            defeated ? 'Oreo fainted! Resting safely back in Whale Cove...' : 'Your turn!',
          ],
        };
      });

      setTimeout(() => {
        setBattleState((prev) => ({ ...prev, animAction: 'idle' }));
      }, 500);
    }, 1100);
  };

  // Post-Catch Actions (Keep vs Butcher)
  const handleKeepCaughtCreature = (creature: CaughtCreature) => {
    setRoster((prev) => [...prev, creature]);
    setPostCatchData(null);
    showToast(`🌟 Befriended ${creature.name}! Welcomed to Pod!`);
  };

  const handleButcherCreature = (creature: WildCreatureData) => {
    const isWhale = creature.type === 'orca';
    const meatKey = isWhale ? 'whaleMeat' : 'sharkMeat';
    const gems: ('ruby' | 'sapphire' | 'topaz' | 'amethyst' | 'quartz')[] = [
      'ruby',
      'sapphire',
      'topaz',
      'amethyst',
      'quartz',
    ];
    const g1 = gems[Math.floor(Math.random() * gems.length)];
    const g2 = gems[Math.floor(Math.random() * gems.length)];

    setInventory((prev) => ({
      ...prev,
      [meatKey]: prev[meatKey] + 3,
      playerCoins: prev.playerCoins + 50,
      [g1]: (prev[g1] || 0) + 1,
      [g2]: (prev[g2] || 0) + 1,
    }));

    setPostCatchData(null);
    showToast(`🥩 Butchered ${creature.name}: +3 ${isWhale ? 'Whale Meat' : 'Shark Meat'}, +50 Coins, +2 Gems!`);
  };

  // Housing Actions
  const handleBuildHouse = () => {
    if (inventory.playerCoins < 100) {
      showToast('Need 100 coins to construct a Nautilus Shell Cottage!');
      return;
    }
    const newHouse: ShellHouse = {
      id: 'house-' + Date.now(),
      name: `Shell Villa #${houses.length + 1}`,
      gridX: (houses.length % 5) - 2,
      gridZ: Math.floor(houses.length / 5),
      level: 1,
    };
    setHouses((prev) => [...prev, newHouse]);
    setInventory((prev) => ({ ...prev, playerCoins: prev.playerCoins - 100 }));
    soundManager.playCatchSuccess();
    showToast('Constructed a new Nautilus Shell Cottage! 🐚');
  };

  const handleAssignHouse = (creatureId: string, houseId: string) => {
    setRoster((prev) =>
      prev.map((c) => {
        if (c.id === creatureId) {
          return {
            ...c,
            houseId,
            economy: { ...c.economy, isEvicted: false, isHomeless: false },
          };
        }
        if (c.houseId === houseId) {
          return { ...c, houseId: undefined, economy: { ...c.economy, isHomeless: true } };
        }
        return c;
      })
    );
    showToast('Updated Shell House occupancy!');
  };

  const handlePardonDebt = (creatureId: string) => {
    setRoster((prev) =>
      prev.map((c) =>
        c.id === creatureId
          ? {
              ...c,
              economy: {
                ...c.economy,
                debt: 0,
                daysDelinquent: 0,
                isEvicted: false,
                isHomeless: false,
              },
              status: { ...c.status, mood: 100 },
            }
          : c
      )
    );
    soundManager.playCatchSuccess();
    showToast('Granted Debt Pardon! Whale rehabilitated from The Reef! 📜');
  };

  // Marriage & Therapy Actions
  const handleMarryWhales = (idA: string, idB: string) => {
    setRoster((prev) =>
      prev.map((c) => {
        if (c.id === idA) {
          return { ...c, social: { ...c.social, marriedToId: idB, bondPoints: 7 } };
        }
        if (c.id === idB) {
          return { ...c, social: { ...c.social, marriedToId: idA, bondPoints: 7 } };
        }
        return c;
      })
    );
    soundManager.playCatchSuccess();
    showToast('💍 Officiated whale matrimony! Happy couple is swimming together!');
  };

  const handleDivorceWhales = (idA: string, idB: string) => {
    setRoster((prev) =>
      prev.map((c) => {
        if (c.id === idA || c.id === idB) {
          return {
            ...c,
            social: { ...c.social, marriedToId: undefined, bondPoints: 2 },
          };
        }
        return c;
      })
    );
    showToast('💔 Divorce finalized. Whales have parted ways.');
  };

  const handleMediateCouples = (idA: string, idB: string, outcome: 'reconcile' | 'divorce') => {
    if (outcome === 'reconcile') {
      setRoster((prev) =>
        prev.map((c) => {
          if (c.id === idA || c.id === idB) {
            return {
              ...c,
              social: {
                ...c.social,
                bondPoints: Math.min(10, c.social.bondPoints + 3),
                isCheating: false,
              },
            };
          }
          return c;
        })
      );
      showToast('🌱 Couples Therapy Success! Rebuilt trust & +3 Bond Points!');
    } else {
      handleDivorceWhales(idA, idB);
    }
  };

  // Higher Education & College Actions
  const handleEnrollCollege = (whaleId: string, profession: ProfessionType) => {
    const tuitionMap: Record<ProfessionType, number> = {
      doctor: 40,
      shopkeeper: 35,
      miner: 30,
      banker: 50,
      unemployed: 0,
    };
    const tuition = tuitionMap[profession] || 0;
    if (inventory.playerCoins < tuition) {
      showToast(`Need ${tuition} coins for college tuition!`);
      return;
    }

    setInventory((prev) => ({ ...prev, playerCoins: prev.playerCoins - tuition }));
    setRoster((prev) =>
      prev.map((c) =>
        c.id === whaleId
          ? {
              ...c,
              career: {
                profession,
                level: Math.min(5, (c.career?.level || 0) + 1),
              },
            }
          : c
      )
    );
    soundManager.playCatchSuccess();
    showToast(`🎓 Whale graduated as a certified ${profession.toUpperCase()}!`);
  };

  // Copy Standalone Code
  const handleCopyStandaloneCode = async () => {
    try {
      const res = await fetch('/standalone-index.html');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      soundManager.playCatchSuccess();
      showToast('Copied full index.html to clipboard! Paste into VS Code! 📋');
    } catch {
      showToast('Standalone file ready at standalone-index.html');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Ocean Canvas */}
      <OceanScene
        swimSpeed={swimSpeed}
        cameraMode={cameraMode}
        onSelectOreo={handleSelectOreo}
        onHarvestFish={handleHarvestFish}
        onHarvestKelp={handleHarvestKelp}
        onEncounterWild={handleEncounterWild}
        wildEncounterTrigger={wildEncounterTrigger}
        companionType={activeCompanion}
        customModels={customModels}
        timeOfDay={timeOfDay}
        isRaveParty={isRaveParty}
        houses={houses}
        onMineGem={handleMineGem}
        battleState={battleState}
        controlScheme={controlScheme}
        mobileMoveVector={mobileMoveVector}
      />

      {/* Primary HUD Overlay with Universal Minimize Tab & Settings */}
      <HudOverlay
        inventory={inventory}
        rosterCount={roster.length}
        swimSpeed={swimSpeed}
        onSpeedChange={setSwimSpeed}
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        onCraftFlute={handleCraftFlute}
        onOpenRoster={() => setIsRosterOpen(true)}
        onOpenModelManager={() => setIsModelManagerOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onCopyCode={handleCopyStandaloneCode}
        customModelCount={customModelCount}
        onSummonWild={() => setWildEncounterTrigger((prev) => prev + 1)}
        oreoBubble={oreoBubble}
        onFeedFish={handleFeedFish}
        onFeedKelp={handleFeedKelp}
        onCloseBubble={() => setOreoBubble(null)}
        toastMessage={toastMessage}
        timeOfDay={timeOfDay}
        onCycleTimeOfDay={handleCycleTimeOfDay}
        isRaveParty={isRaveParty}
        onTriggerRave={handleTriggerRave}
        onOpenHousing={() => setIsHousingOpen(true)}
        onOpenCollege={() => setIsCollegeOpen(true)}
        onOpenTherapy={() => setIsTherapyOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        isSharkRaidActive={isSharkRaidActive}
        controlScheme={controlScheme}
        onToggleControlScheme={setControlScheme}
        onMobileMoveVectorChange={setMobileMoveVector}
      />

      {/* Modern Pokémon-style Battle & Capture Modal */}
      <BattleModal
        battleState={battleState}
        companionName="Oreo"
        companionLevel={companionLevel}
        companionExp={companionExp}
        companionExpNext={companionExpNext}
        standardFlutes={inventory.standardFlutes}
        silverFlutes={inventory.silverFlutes}
        goldenFlutes={inventory.goldenFlutes}
        onAction={handleBattleAction}
        onClose={() => setBattleState((prev) => ({ ...prev, active: false }))}
      />

      {/* Post-Catch Pokémon-style Inspect & Butcher Screen */}
      <PostCatchModal
        postCatchData={postCatchData}
        onKeep={handleKeepCaughtCreature}
        onButcher={handleButcherCreature}
        onClose={() => setPostCatchData(null)}
      />

      {/* Roster Modal */}
      <RosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        roster={roster}
        activeCompanion={activeCompanion}
        onSelectCompanion={(type) => {
          setActiveCompanion(type);
          showToast(`Now swimming as ${type}! 🌊`);
        }}
      />

      {/* Custom 3D Model Manager Modal */}
      <ModelManagerModal
        isOpen={isModelManagerOpen}
        onClose={() => setIsModelManagerOpen(false)}
        models={customModels}
        onSaveModel={handleSaveModel}
        onResetModel={handleResetModel}
        onImportConfig={handleImportConfig}
      />

      {/* Oreo AI Chat Modal */}
      <WhaleChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        inventory={inventory}
        onFeedFish={handleFeedFish}
        onFeedKelp={handleFeedKelp}
      />

      {/* GDD System Modals */}
      <HousingModal
        isOpen={isHousingOpen}
        onClose={() => setIsHousingOpen(false)}
        roster={roster}
        houses={houses}
        onBuildHouse={handleBuildHouse}
        onAssignHouse={handleAssignHouse}
        onPardonDebt={handlePardonDebt}
        playerCoins={inventory.playerCoins}
      />

      <TherapyModal
        isOpen={isTherapyOpen}
        onClose={() => setIsTherapyOpen(false)}
        roster={roster}
        onMarryWhales={handleMarryWhales}
        onDivorceWhales={handleDivorceWhales}
        onMediateCouples={handleMediateCouples}
      />

      <CollegeModal
        isOpen={isCollegeOpen}
        onClose={() => setIsCollegeOpen(false)}
        roster={roster}
        onEnrollCollege={handleEnrollCollege}
        playerCoins={inventory.playerCoins}
      />

      <SpeciesCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
}
