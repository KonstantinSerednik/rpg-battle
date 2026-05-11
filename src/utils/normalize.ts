
export function roundToInteger(value: number): number {
  return Math.round(value);
}

export function roundToDecimal(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function normalizeHp(hp: number, maxHp: number): number {
  const rounded = roundToInteger(hp);
  return Math.max(0, Math.min(maxHp, rounded));
}

export function normalizeEnergy(energy: number): number {
  const rounded = roundToInteger(energy);
  return Math.max(0, Math.min(100, rounded));
}

export function normalizeShields(shields: number): number {
  const rounded = roundToInteger(shields);
  return Math.max(0, rounded);
}

export function normalizeMultiplier(multiplier: number): number {
  return roundToDecimal(multiplier, 2);
}

export function normalizePercentage(percentage: number): number {
  return roundToDecimal(percentage, 3);
}

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

import type { GameState } from '../types/game';

export function normalizeGameState(state: GameState): GameState {
  return {
    ...state,
    p1: state.p1 ? normalizeCharacter(state.p1) : null,
    p2: state.p2 ? normalizeCharacter(state.p2) : null,
  };
}