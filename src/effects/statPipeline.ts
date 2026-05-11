import type { Character } from '../types/game';

export interface StatModifiers {
  damageMultiplier: number;
  damageReduction: number; 
  healingMultiplier: number;
  energyGainMultiplier: number;
  criticalChance: number; 
  dodgeChance: number; 
}

export interface StatContext {
  baseValue: number;
  character: Character;
  statType: 'damage' | 'healing' | 'energy' | 'critical' | 'dodge' | 'damageReduction';
  source?: Character;
}

export function calculateStat(context: StatContext): number {
  const { baseValue, character, statType } = context;
  
  const modifiers = collectModifiers(character);
  
  let result = baseValue;
  
  switch (statType) {
    case 'damage':
      result *= modifiers.damageMultiplier;
      break;
    case 'healing':
      result *= modifiers.healingMultiplier;
      break;
    case 'energy':
      result *= modifiers.energyGainMultiplier;
      break;
    case 'critical':
      result += modifiers.criticalChance;
      break;
    case 'dodge':
      result += modifiers.dodgeChance;
      break;
    case 'damageReduction':
      result += modifiers.damageReduction;
      break;
  }
  
  if (statType === 'damage' || statType === 'healing' || statType === 'energy') {
    result = Math.round(result * 100) / 100;
  } else if (statType === 'critical' || statType === 'dodge' || statType === 'damageReduction') {
    result = Math.round(result * 1000) / 1000; 
  }
  
  return result;
}

export function collectModifiers(character: Character): StatModifiers {
  const base: StatModifiers = {
    damageMultiplier: 1,
    damageReduction: 0,
    healingMultiplier: 1,
    energyGainMultiplier: 1,
    criticalChance: 0,
    dodgeChance: 0,
  };
  
  character.effects.forEach(effect => {
    const { modifiers, currentStacks } = effect;
    const stacks = currentStacks || 1;
    
    if (modifiers.damageMultiplier) {
      base.damageMultiplier *= Math.pow(modifiers.damageMultiplier, stacks);
    }
    if (modifiers.damageReduction) {
      base.damageReduction += modifiers.damageReduction * stacks;
    }
    if (modifiers.healingMultiplier) {
      base.healingMultiplier *= Math.pow(modifiers.healingMultiplier, stacks);
    }
    if (modifiers.energyGainMultiplier) {
      base.energyGainMultiplier *= Math.pow(modifiers.energyGainMultiplier, stacks);
    }
    if (modifiers.criticalChance) {
      base.criticalChance += modifiers.criticalChance * stacks;
    }
    if (modifiers.dodgeChance) {
      base.dodgeChance += modifiers.dodgeChance * stacks;
    }
  });
  
  base.damageReduction = Math.max(-1, Math.min(1, base.damageReduction));
  base.criticalChance = Math.max(0, Math.min(1, base.criticalChance));
  base.dodgeChance = Math.max(0, Math.min(1, base.dodgeChance));
  
  return base;
}

export function calculateFinalDamageWithPipeline(
  attacker: Character,
  target: Character,
  baseDamage: number
): number {
  
  const attackerDamage = calculateStat({
    baseValue: baseDamage,
    character: attacker,
    statType: 'damage',
  });
  
  const targetDamageReduction = calculateStat({
    baseValue: 0,
    character: target,
    statType: 'damageReduction',
  });
  
  let finalDamage = attackerDamage * (1 - targetDamageReduction);
  
  finalDamage = absorbDamageWithShields(target, finalDamage);
  
  finalDamage = Math.round(finalDamage);
  
  if (finalDamage > 0 && finalDamage < 1) {
    finalDamage = 1;
  }
  
  return Math.max(0, finalDamage);
}

export function calculateFinalHealingWithPipeline(
  healer: Character,
  baseHealing: number
): number {
  const healing = calculateStat({
    baseValue: baseHealing,
    character: healer,
    statType: 'healing',
  });
  
  return Math.round(healing);
}

export function calculateFinalEnergyGainWithPipeline(
  character: Character,
  baseEnergyGain: number
): number {
  const energyGain = calculateStat({
    baseValue: baseEnergyGain,
    character,
    statType: 'energy',
  });
  
  return Math.round(energyGain);
}

function absorbDamageWithShields(target: Character, damage: number): number {
  if (target.shields <= 0) return damage;
  const absorbed = Math.min(target.shields, damage);
  return damage - absorbed;
}

export function getCriticalChance(character: Character): number {
  return calculateStat({
    baseValue: 0,
    character,
    statType: 'critical',
  });
}

export function getDodgeChance(character: Character): number {
  return calculateStat({
    baseValue: 0,
    character,
    statType: 'dodge',
  });
}