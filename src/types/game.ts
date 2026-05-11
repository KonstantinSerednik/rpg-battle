import type { Attack, CharacterPreset } from '../db';

export interface Effect {
  id: string; 
  name: string;
  description: string;
  icon: string; 
  duration: number; 
  maxStacks?: number; 
  currentStacks: number;
  priority: number; 
  type: 'buff' | 'debuff' | 'shield' | 'control' | 'special';
  
  modifiers: {
    damageMultiplier?: number;
    damageReduction?: number;
    healingMultiplier?: number;
    energyGainMultiplier?: number;
    criticalChance?: number;
    dodgeChance?: number;
  };
  
  dotDamage?: number;
  hotHealing?: number;
  shieldAmount?: number; 
  isStun?: boolean; 
  reflectPercent?: number; 
  
  onApply?: string;
  onTurnStart?: string;
  onTurnEnd?: string;
  onRemove?: string;

  originalAttacks?: Attack[];
}

export interface Character extends CharacterPreset {
  attacks: Attack[];
  effects: Effect[]; 
  shields: number; 
  isStunned: boolean; 
}

export type GameMode = 'PvP' | 'PvC';

export type Stage =
  | 'mode_select'
  | 'p1_char'
  | 'p1_attacks'
  | 'p2_char'
  | 'p2_attacks'
  | 'battle'
  | 'winner';

export interface TurnRecord {
  turnNumber: number;
  attacker: 1 | 2;
  attackName: string;
  attackDamage: number;
  p1Hp: number;
  p2Hp: number;
  p1Energy: number;
  p2Energy: number;
  timestamp: number;
}

export interface AttackSummary {
  attackName: string;
  className: string;
  totalDamage: number; 
  count: number;
}

export interface GameState {
  stage: Stage;
  gameMode: GameMode;
  p1: Character | null;
  p2: Character | null;
  turn: 1 | 2;
  log: string;
  
  turnHistory: TurnRecord[];
  attackSummary: AttackSummary[];
  isDraw: boolean;
}

export type GameActionType =
  | 'SET_MODE'
  | 'SET_STAGE'
  | 'SET_P1'
  | 'SET_P2'
  | 'SET_TURN'
  | 'SET_LOG'
  | 'ATTACK'
  | 'RESET'
  | 'EFFECT_APPLY'
  | 'EFFECT_TICK'
  | 'EFFECT_REMOVE'
  | 'CLEANSE';