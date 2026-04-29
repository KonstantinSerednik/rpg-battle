import type { Character } from '../types/game';

export interface StatModifiers {
  damageMultiplier: number;
  damageReduction: number; // 0-1, где 0.25 означает снижение урона на 25%
  healingMultiplier: number;
  energyGainMultiplier: number;
  criticalChance: number; // 0-1
  dodgeChance: number; // 0-1
}

export interface StatContext {
  baseValue: number;
  character: Character;
  statType: 'damage' | 'healing' | 'energy' | 'critical' | 'dodge' | 'damageReduction';
  source?: Character;
}

/**
 * Конвейер характеристик: вычисляет финальное значение характеристики
 * с учётом всех активных эффектов персонажа.
 */
export function calculateStat(context: StatContext): number {
  const { baseValue, character, statType } = context;
  
  // Собираем все модификаторы из эффектов
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
  
  // Нормализация: округление до двух знаков после запятой для множителей,
  // и до целого числа для абсолютных значений
  if (statType === 'damage' || statType === 'healing' || statType === 'energy') {
    result = Math.round(result * 100) / 100;
  } else if (statType === 'critical' || statType === 'dodge' || statType === 'damageReduction') {
    result = Math.round(result * 1000) / 1000; // три знака после запятой для процентов
  }
  
  return result;
}

/**
 * Собрать все модификаторы из активных эффектов персонажа.
 */
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
  
  // Ограничение значений
  base.damageReduction = Math.max(-1, Math.min(1, base.damageReduction));
  base.criticalChance = Math.max(0, Math.min(1, base.criticalChance));
  base.dodgeChance = Math.max(0, Math.min(1, base.dodgeChance));
  
  return base;
}

/**
 * Вычислить финальный урон с использованием конвейера характеристик.
 * Заменяет функцию calculateFinalDamage из effectLogic.
 */
export function calculateFinalDamageWithPipeline(
  attacker: Character,
  target: Character,
  baseDamage: number
): number {
  // Модификаторы урона атакующего
  const attackerDamage = calculateStat({
    baseValue: baseDamage,
    character: attacker,
    statType: 'damage',
  });
  
  // Модификаторы снижения урона цели
  const targetDamageReduction = calculateStat({
    baseValue: 0,
    character: target,
    statType: 'damageReduction',
  });
  
  let finalDamage = attackerDamage * (1 - targetDamageReduction);
  
  // Учёт щитов
  finalDamage = absorbDamageWithShields(target, finalDamage);
  
  // Округление до целого числа
  finalDamage = Math.round(finalDamage);
  
  // Минимальный урон - 1 (если не 0)
  if (finalDamage > 0 && finalDamage < 1) {
    finalDamage = 1;
  }
  
  return Math.max(0, finalDamage);
}

/**
 * Вычислить финальное исцеление с использованием конвейера характеристик.
 */
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

/**
 * Вычислить финальный прирост энергии с использованием конвейера характеристик.
 */
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

/**
 * Поглотить урон щитами (вспомогательная функция).
 */
function absorbDamageWithShields(target: Character, damage: number): number {
  if (target.shields <= 0) return damage;
  const absorbed = Math.min(target.shields, damage);
  return damage - absorbed;
}

/**
 * Получить шанс критического удара для персонажа.
 */
export function getCriticalChance(character: Character): number {
  return calculateStat({
    baseValue: 0,
    character,
    statType: 'critical',
  });
}

/**
 * Получить шанс уклонения для персонажа.
 */
export function getDodgeChance(character: Character): number {
  return calculateStat({
    baseValue: 0,
    character,
    statType: 'dodge',
  });
}