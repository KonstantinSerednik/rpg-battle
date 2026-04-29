/**
 * Утилиты для нормализации числовых данных.
 * Обеспечивают округление числовых значений до целых чисел
 * для избежания ошибок округления IEEE 754 и поддержания чистоты данных.
 */

/**
 * Округлить число до целого с использованием математического округления.
 * Гарантирует, что результат будет целым числом.
 */
export function roundToInteger(value: number): number {
  return Math.round(value);
}

/**
 * Округлить число до указанного количества знаков после запятой.
 * Используется для множителей и процентов.
 */
export function roundToDecimal(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Нормализовать значение HP: убедиться, что оно в пределах [0, maxHP] и целое.
 */
export function normalizeHp(hp: number, maxHp: number): number {
  const rounded = roundToInteger(hp);
  return Math.max(0, Math.min(maxHp, rounded));
}

/**
 * Нормализовать значение энергии: убедиться, что оно в пределах [0, 100] и целое.
 */
export function normalizeEnergy(energy: number): number {
  const rounded = roundToInteger(energy);
  return Math.max(0, Math.min(100, rounded));
}

/**
 * Нормализовать значение щитов: убедиться, что оно неотрицательное и целое.
 */
export function normalizeShields(shields: number): number {
  const rounded = roundToInteger(shields);
  return Math.max(0, rounded);
}

/**
 * Нормализовать множитель урона/лечения: округлить до 2 знаков после запятой.
 */
export function normalizeMultiplier(multiplier: number): number {
  return roundToDecimal(multiplier, 2);
}

/**
 * Нормализовать процентное значение (0-1): округлить до 3 знаков после запятой.
 */
export function normalizePercentage(percentage: number): number {
  return roundToDecimal(percentage, 3);
}

/**
 * Нормализовать все числовые поля персонажа.
 * Возвращает нового персонажа с нормализованными значениями.
 */
import type { Character } from '../types/game';

export function normalizeCharacter(character: Character): Character {
  return {
    ...character,
    hp: normalizeHp(character.hp, character.max_hp),
    energy: normalizeEnergy(character.energy),
    shields: normalizeShields(character.shields),
    effects: character.effects.map(effect => ({
      ...effect,
      duration: roundToInteger(effect.duration),
      currentStacks: roundToInteger(effect.currentStacks),
      modifiers: effect.modifiers ? {
        damageMultiplier: effect.modifiers.damageMultiplier 
          ? normalizeMultiplier(effect.modifiers.damageMultiplier) 
          : undefined,
        damageReduction: effect.modifiers.damageReduction 
          ? normalizePercentage(effect.modifiers.damageReduction) 
          : undefined,
        healingMultiplier: effect.modifiers.healingMultiplier 
          ? normalizeMultiplier(effect.modifiers.healingMultiplier) 
          : undefined,
        energyGainMultiplier: effect.modifiers.energyGainMultiplier 
          ? normalizeMultiplier(effect.modifiers.energyGainMultiplier) 
          : undefined,
        criticalChance: effect.modifiers.criticalChance 
          ? normalizePercentage(effect.modifiers.criticalChance) 
          : undefined,
        dodgeChance: effect.modifiers.dodgeChance 
          ? normalizePercentage(effect.modifiers.dodgeChance) 
          : undefined,
      } : {},
      dotDamage: effect.dotDamage ? roundToInteger(effect.dotDamage) : undefined,
      hotHealing: effect.hotHealing ? roundToInteger(effect.hotHealing) : undefined,
      shieldAmount: effect.shieldAmount ? roundToInteger(effect.shieldAmount) : undefined,
      reflectPercent: effect.reflectPercent ? normalizePercentage(effect.reflectPercent) : undefined,
    })),
    attacks: character.attacks.map(attack => ({
      ...attack,
      damage: roundToInteger(attack.damage),
      uses: roundToInteger(attack.uses),
      max_uses: roundToInteger(attack.max_uses),
      energyGain: attack.energyGain ? roundToInteger(attack.energyGain) : undefined,
      energyCost: attack.energyCost ? roundToInteger(attack.energyCost) : undefined,
      effectChance: attack.effectChance ? normalizePercentage(attack.effectChance) : undefined,
    })),
  };
}

/**
 * Нормализовать числовые значения в состоянии игры.
 * Используется в редьюсере после каждого изменения состояния.
 */
import type { GameState } from '../types/game';

export function normalizeGameState(state: GameState): GameState {
  return {
    ...state,
    p1: state.p1 ? normalizeCharacter(state.p1) : null,
    p2: state.p2 ? normalizeCharacter(state.p2) : null,
  };
}