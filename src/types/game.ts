import type { Attack, CharacterPreset } from '../db';

export interface Effect {
  id: string; // уникальный идентификатор
  name: string;
  description: string;
  icon: string; // название иконки для UI
  duration: number; // ходы
  maxStacks?: number; // максимальное количество стаков
  currentStacks: number;
  priority: number; // приоритет применения (0-10)
  type: 'buff' | 'debuff' | 'shield' | 'control' | 'special';
  
  // Модификаторы
  modifiers: {
    damageMultiplier?: number;
    damageReduction?: number;
    healingMultiplier?: number;
    energyGainMultiplier?: number;
    criticalChance?: number;
    dodgeChance?: number;
  };
  
  // Специальные свойства
  dotDamage?: number;
  hotHealing?: number;
  shieldAmount?: number; // величина щита
  isStun?: boolean; // оглушение
  reflectPercent?: number; // процент отражения урона
  
  // Колбэки (будут реализованы как строки имен функций или игнорироваться)
  onApply?: string;
  onTurnStart?: string;
  onTurnEnd?: string;
  onRemove?: string;

  // Сохранённые оригинальные атаки для эффектов, которые их заменяют (например, bear_form)
  originalAttacks?: Attack[];
}

export interface Character extends CharacterPreset {
  attacks: Attack[];
  effects: Effect[]; // активные эффекты
  shields: number; // текущее значение щитов
  isStunned: boolean; // оглушён ли персонаж
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

// Запись одного хода для статистики
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

// Сводка по атакам для столбчатой диаграммы
export interface AttackSummary {
  attackName: string;
  className: string;
  totalDamage: number; // положительное - урон, отрицательное - исцеление
  count: number;
}

export interface GameState {
  stage: Stage;
  gameMode: GameMode;
  p1: Character | null;
  p2: Character | null;
  turn: 1 | 2;
  log: string;
  // История боя для статистики
  turnHistory: TurnRecord[];
  attackSummary: AttackSummary[];
  isDraw: boolean;
}

// Типы действий для редуктора (добавлены для системы эффектов)
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