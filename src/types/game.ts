export type CreatureType = 'orca' | 'shark' | 'dolphin' | 'hammerhead' | 'manta';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
export type PersonalityType = 'frugal' | 'moderate' | 'lavish';
export type ProfessionType = 'unemployed' | 'doctor' | 'shopkeeper' | 'miner' | 'banker';
export type HungerState = 'well_fed' | 'little_hungry' | 'starving' | 'famished';
export type CleanlinessState = 'clean' | 'normal' | 'dirty' | 'neglected';
export type SicknessState = 'healthy' | 'little_cold' | 'sick' | 'very_sick' | 'terminal';
export type TimeOfDay = 'morning' | 'midday' | 'sunset' | 'night';

export interface WhaleStatus {
  hp: number;
  maxHp: number;
  mood: number; // 0 - 100
  hunger: HungerState;
  cleanliness: CleanlinessState;
  sickness: SicknessState;
  sicknessDaysLeft?: number;
  isAddicted?: boolean;
  inRehab?: boolean;
  inJail?: boolean;
  jailDaysLeft?: number;
  honor: number; // 0 - 100
}

export interface WhaleEconomy {
  wallet: number;
  debt: number;
  rentBill: number;
  electricBill: number;
  utilityBill: number;
  daysDelinquent: number;
  isEvicted: boolean; // sent to The Reef
  isHomeless: boolean;
}

export interface WhaleSocial {
  marriedToId?: string;
  bondPoints: number; // 0 - 10
  feudingWithId?: string;
  isCheating?: boolean;
  childSupportOwed?: number;
}

export interface WhaleCareer {
  profession: ProfessionType;
  level: number; // 1 - 5
  collegeEnrolled?: boolean;
  collegeTimeLeft?: number;
}

export interface CaughtCreature {
  id: string;
  name: string;
  type: CreatureType;
  caughtAt: string;
  level: number;
  nickname: string;
  rarity: RarityTier;
  personality: PersonalityType;
  speciesName: string;
  stats: {
    hp: number;
    speed: number;
    power: number;
    defense: number;
  };
  status: WhaleStatus;
  economy: WhaleEconomy;
  social: WhaleSocial;
  career: WhaleCareer;
  houseId?: string;
  exp?: number;
  expToNextLevel?: number;
  isDeceased?: boolean; // In Memorial
}

export interface ShellHouse {
  id: string;
  ownerId?: string;
  gridX: number;
  gridZ: number;
  level: number;
  name: string;
}

export interface Inventory {
  fishTreats: number;
  kelpSnacks: number;
  driftwood: number;
  coral: number;
  stone: number;
  iron: number;
  sand: number;
  topaz: number;
  quartz: number;
  ruby: number;
  sapphire: number;
  amethyst: number;
  bloom: number;
  seaAnemone: number;
  standardFlutes: number;
  silverFlutes: number;
  goldenFlutes: number;
  raveCandies: number;
  whaleMeat: number;
  sharkMeat: number;
  playerCoins: number;
}

export interface WildCreatureData {
  id: string;
  name: string;
  speciesName: string;
  type: CreatureType;
  rarity: RarityTier;
  personality: PersonalityType;
  maxHp: number;
  hp: number;
  attackPower: number;
  defense: number;
  speed: number;
  catchDifficulty: number;
  color: number;
  accentColor: number;
  description: string;
  isSparkling?: boolean;
}

export type BattleStatus = 'intro' | 'player_turn' | 'enemy_turn' | 'catching' | 'victory' | 'fled' | 'defeated';

export interface BattleState {
  active: boolean;
  enemy: WildCreatureData | null;
  playerHp: number;
  playerMaxHp: number;
  status: BattleStatus;
  log: string[];
  lastDamagePlayer?: number;
  lastDamageEnemy?: number;
  animAction?: 'player_attack' | 'enemy_attack' | 'player_guard' | 'hit' | 'idle';
  expGained?: number;
  leveledUp?: boolean;
}

export type CameraViewMode = 'free' | 'follow' | 'panoramic';
export type ControlScheme = 'minecraft' | 'orbit';

export interface PostCatchData {
  creature: WildCreatureData;
  defaultName: string;
}
