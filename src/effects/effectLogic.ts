import type { Character, Effect } from '../types/game';
import { ALL_ATTACKS } from '../db';
import { log } from '../utils/logger';

export const MAX_EFFECTS = 5;

export interface Modifiers {
  damageMultiplier: number;
  damageReduction: number;
  healingMultiplier: number;
  energyGainMultiplier: number;
  criticalChance: number;
  dodgeChance: number;
}

export function applyEffect(
  target: Character,
  effect: Effect
): Character {
  log(`[effectLogic] Applying effect ${effect.name} to ${target.name}`);
  
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  const existingIndex = newTarget.effects.findIndex(e => e.id === effect.id);
  if (existingIndex >= 0) {
    const existing = newTarget.effects[existingIndex];
    
    if (existing.maxStacks && existing.currentStacks < existing.maxStacks) {
      
      const newDuration = (effect.id === 'assassin_bleed' || effect.id === 'assassin_poison')
        ? effect.duration
        : Math.max(existing.duration, effect.duration);
      newTarget.effects[existingIndex] = {
        ...existing,
        currentStacks: existing.currentStacks + 1,
        duration: newDuration,
      };
    } else {
      
      if (effect.priority > existing.priority) {
        newTarget.effects[existingIndex] = { ...effect, currentStacks: 1 };
      }
      
    }
  } else {
    
    const uniqueEffectIds = new Set(newTarget.effects.map(e => e.id));
    if (uniqueEffectIds.size >= MAX_EFFECTS) {
      
      let lowestPriority = Infinity;
      let lowestPriorityIndex = -1;
      newTarget.effects.forEach((e, idx) => {
        if (e.priority < lowestPriority) {
          lowestPriority = e.priority;
          lowestPriorityIndex = idx;
        }
      });
      
      if (lowestPriorityIndex >= 0) {
        log(`[effectLogic] Достигнут лимит ${MAX_EFFECTS} эффектов, удаляем эффект ${newTarget.effects[lowestPriorityIndex].name} с приоритетом ${lowestPriority}`);
        newTarget.effects = newTarget.effects.filter((_, idx) => idx !== lowestPriorityIndex);
      }
    }
    
    newTarget.effects.push({ ...effect, currentStacks: 1 });
  }

  if (effect.shieldAmount) {
    newTarget.shields += effect.shieldAmount;
  }

  if (effect.isStun) {
    newTarget.isStunned = true;
  }

  if (effect.id === 'berserk') {
    
    const berserkEffectIndex = newTarget.effects.findIndex(e => e.id === 'berserk');
    if (berserkEffectIndex >= 0 && !newTarget.effects[berserkEffectIndex].originalAttacks) {
      
      const originalAttacks = newTarget.attacks.map(a => ({ ...a }));
      newTarget.effects[berserkEffectIndex] = {
        ...newTarget.effects[berserkEffectIndex],
        originalAttacks,
      };
    }

    newTarget.max_hp = 100;
    if (newTarget.hp > newTarget.max_hp) {
      newTarget.hp = newTarget.max_hp;
    }
    
    const berserkAttack = ALL_ATTACKS.find(a => a.name === 'Удар топором Берсерка');
    if (berserkAttack) {
      
      const attackCopy = { ...berserkAttack };
      newTarget.attacks = [attackCopy];
    }
    log(`[effectLogic] ${newTarget.name} впал в берсерк! HP установлено 100, атаки заменены.`);
  }

  if (effect.id === 'bear_form') {
    
    const bearEffectIndex = newTarget.effects.findIndex(e => e.id === 'bear_form');
    if (bearEffectIndex >= 0) {
      const bearEffect = newTarget.effects[bearEffectIndex];
      if (!bearEffect.originalAttacks) {
        
        const originalAttacks = newTarget.attacks.map(a => ({ ...a }));
        newTarget.effects[bearEffectIndex] = {
          ...bearEffect,
          originalAttacks,
        };
        log(`[effectLogic] Сохранены оригинальные атаки для ${newTarget.name}: ${originalAttacks.map(a => a.name).join(', ')}`);
      } else {
        log(`[effectLogic] Оригинальные атаки уже сохранены для ${newTarget.name}`);
      }
    }

    const bearAttack1 = ALL_ATTACKS.find(a => a.name === 'Удар медвежьей лапы');
    const bearAttack2 = ALL_ATTACKS.find(a => a.name === 'Укуси меня пчела');
    if (bearAttack1 && bearAttack2) {
      const attackCopy1 = { ...bearAttack1 };
      const attackCopy2 = { ...bearAttack2 };
      newTarget.attacks = [attackCopy1, attackCopy2];
    }
    log(`[effectLogic] ${newTarget.name} превратился в медведя! Атаки заменены.`);
  }

  if (effect.id === 'arcane') {
    
    const arcaneShot = newTarget.attacks.find(a => a.name === 'Арканный выстрел');
    if (arcaneShot && arcaneShot.uses < arcaneShot.max_uses) {
      arcaneShot.uses = arcaneShot.max_uses;
      log(`[effectLogic] ${newTarget.name} восстановил использование "Арканного выстрела".`);
    }
  }

  if (effect.id === 'cleanse') {
    
    const chance = 0.65;
    if (Math.random() < chance) {
      
      newTarget.effects = [];
      newTarget.isStunned = false;
      log(`[effectLogic] ${newTarget.name} очищен от всех эффектов (шанс сработал).`);
    } else {
      log(`[effectLogic] Очищение не сработало (шанс ${chance} не прошёл).`);
    }
  }

  if (effect.onApply) {
    log(`Effect ${effect.name} applied to ${newTarget.name}`);
  }

  return newTarget;
}

export function tickEffects(target: Character): Character {
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  const effectsToRemove: string[] = [];

  newTarget.effects.forEach(effect => {
    
    effect.duration -= 1;

    if (effect.onTurnStart) {
      log(`Effect ${effect.name} onTurnStart for ${newTarget.name}`);
    }

    if (effect.dotDamage) {
      newTarget.hp -= effect.dotDamage * effect.currentStacks;
      if (newTarget.hp < 0) newTarget.hp = 0;
    }
    if (effect.hotHealing) {
      newTarget.hp += effect.hotHealing * effect.currentStacks;
      if (newTarget.hp > newTarget.max_hp) newTarget.hp = newTarget.max_hp;
    }

    if (effect.duration <= 0) {
      effectsToRemove.push(effect.id);
    }
  });

  let attacksRestored = false;
  effectsToRemove.forEach(effectId => {
    const effect = newTarget.effects.find(e => e.id === effectId);
    if (effect?.originalAttacks) {
      if (!attacksRestored) {
        
        newTarget.attacks = effect.originalAttacks.map(a => ({ ...a }));
        log(`[effectLogic] Восстановлены оригинальные атаки для эффекта ${effect.name} у ${newTarget.name}`);
        attacksRestored = true;
      } else {
        console.warn(`[effectLogic] Пропускаем восстановление атак для эффекта ${effect.name}, так как атаки уже восстановлены другим эффектом.`);
      }
    } else if (effect && (effect.id === 'bear_form' || effect.id === 'berserk')) {
      console.warn(`[effectLogic] Эффект ${effect.name} истекает, но originalAttacks отсутствуют! Атаки могут не восстановиться.`);
    }
  });

  newTarget.effects = newTarget.effects.filter(e => !effectsToRemove.includes(e.id));

  const hasStun = newTarget.effects.some(e => e.isStun);
  if (!hasStun) {
    newTarget.isStunned = false;
  }

  return newTarget;
}

export function calculateModifiers(target: Character): Modifiers {
  const base: Modifiers = {
    damageMultiplier: 1,
    damageReduction: 0,
    healingMultiplier: 1,
    energyGainMultiplier: 1,
    criticalChance: 0,
    dodgeChance: 0,
  };

  log(`[effectLogic] calculateModifiers for ${target.name}, effects:`, target.effects.map(e => e.name));

  target.effects.forEach(effect => {
    const { modifiers, currentStacks } = effect;
    const stacks = currentStacks || 1;
    if (modifiers.damageMultiplier) {
      const old = base.damageMultiplier;
      base.damageMultiplier *= Math.pow(modifiers.damageMultiplier, stacks);
      log(`  effect ${effect.name}: damageMultiplier ${modifiers.damageMultiplier}^${stacks} => ${base.damageMultiplier} (was ${old})`);
    }
    if (modifiers.damageReduction) {
      const old = base.damageReduction;
      base.damageReduction += modifiers.damageReduction * stacks;
      log(`  effect ${effect.name}: damageReduction ${modifiers.damageReduction}*${stacks} => ${base.damageReduction} (was ${old})`);
    }
    if (modifiers.healingMultiplier) {
      const old = base.healingMultiplier;
      base.healingMultiplier *= Math.pow(modifiers.healingMultiplier, stacks);
      log(`  effect ${effect.name}: healingMultiplier ${modifiers.healingMultiplier}^${stacks} => ${base.healingMultiplier} (was ${old})`);
    }
    if (modifiers.energyGainMultiplier) {
      const old = base.energyGainMultiplier;
      base.energyGainMultiplier *= Math.pow(modifiers.energyGainMultiplier, stacks);
      log(`  effect ${effect.name}: energyGainMultiplier ${modifiers.energyGainMultiplier}^${stacks} => ${base.energyGainMultiplier} (was ${old})`);
    }
    if (modifiers.criticalChance) {
      const old = base.criticalChance;
      base.criticalChance += modifiers.criticalChance * stacks;
      log(`  effect ${effect.name}: criticalChance ${modifiers.criticalChance}*${stacks} => ${base.criticalChance} (was ${old})`);
    }
    if (modifiers.dodgeChance) {
      const old = base.dodgeChance;
      base.dodgeChance += modifiers.dodgeChance * stacks;
      log(`  effect ${effect.name}: dodgeChance ${modifiers.dodgeChance}*${stacks} => ${base.dodgeChance} (was ${old})`);
    }
  });

  log(`[effectLogic] final modifiers for ${target.name}:`, base);
  return base;
}

export function calculateFinalDamage(
  attacker: Character,
  target: Character,
  baseDamage: number
): number {
  const attackerMods = calculateModifiers(attacker);
  const targetMods = calculateModifiers(target);

  let finalDamage = baseDamage * attackerMods.damageMultiplier;
  finalDamage = finalDamage * (1 - targetMods.damageReduction);
  finalDamage = Math.round(finalDamage);

  finalDamage = absorbDamageWithShields(target, finalDamage);

  log(`[effectLogic] calculateFinalDamage: base=${baseDamage}, attackerMult=${attackerMods.damageMultiplier}, targetReduction=${targetMods.damageReduction}, afterShields=${finalDamage}`);
  return finalDamage;
}

export function calculateRawDamage(
  attacker: Character,
  target: Character,
  baseDamage: number
): number {
  const attackerMods = calculateModifiers(attacker);
  const targetMods = calculateModifiers(target);

  let rawDamage = baseDamage * attackerMods.damageMultiplier;
  rawDamage = rawDamage * (1 - targetMods.damageReduction);
  rawDamage = Math.round(rawDamage);

  log(`[effectLogic] calculateRawDamage: base=${baseDamage}, attackerMult=${attackerMods.damageMultiplier}, targetReduction=${targetMods.damageReduction}, raw=${rawDamage}`);
  return rawDamage;
}

export function hasEffect(target: Character, effectId: string): boolean {
  return target.effects.some(e => e.id === effectId);
}

export function removeEffect(target: Character, effectId: string): Character {
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  const index = newTarget.effects.findIndex(e => e.id === effectId);
  if (index >= 0) {
    const effect = newTarget.effects[index];
    
    if (effect.onRemove) {
      log(`Effect ${effect.name} removed from ${newTarget.name}`);
    }
    
    if (effect.originalAttacks) {
      newTarget.attacks = effect.originalAttacks.map(a => ({ ...a }));
      log(`[effectLogic] Восстановлены оригинальные атаки для эффекта ${effect.name} у ${newTarget.name}`);
    } else if (effect.id === 'bear_form' || effect.id === 'berserk') {
      console.warn(`[effectLogic] Эффект ${effect.name} удаляется, но originalAttacks отсутствуют! Атаки могут остаться изменёнными.`);
    }
    
    if (effect.shieldAmount) {
      newTarget.shields = Math.max(0, newTarget.shields - effect.shieldAmount);
    }
    newTarget.effects.splice(index, 1);
  }

  return newTarget;
}

export function cleanse(target: Character, effectType?: string): Character {
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  const effectsToRemove = newTarget.effects.filter(e =>
    effectType ? e.type === effectType : e.type === 'debuff'
  );
  
  const effectWithOriginalAttacks = effectsToRemove.find(e => e.originalAttacks);
  if (effectWithOriginalAttacks) {
    newTarget.attacks = effectWithOriginalAttacks.originalAttacks!.map(a => ({ ...a }));
    log(`[effectLogic] Восстановлены оригинальные атаки для эффекта ${effectWithOriginalAttacks.name} у ${newTarget.name} (очищение)`);
  }

  if (effectType) {
    newTarget.effects = newTarget.effects.filter(e => e.type !== effectType);
  } else {
    
    newTarget.effects = newTarget.effects.filter(e => e.type !== 'debuff');
  }
  
  const hasStun = newTarget.effects.some(e => e.isStun);
  if (!hasStun) {
    newTarget.isStunned = false;
  }

  return newTarget;
}

export function getShieldAmount(target: Character): number {
  return target.shields;
}

export function absorbDamageWithShields(target: Character, damage: number): number {
  if (target.shields <= 0) return damage;
  const absorbed = Math.min(target.shields, damage);
  
  return damage - absorbed;
}

export function updateShieldsAfterDamage(target: Character, damage: number): Character {
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };
  
  if (newTarget.shields <= 0) return newTarget;
  const absorbed = Math.min(newTarget.shields, damage);
  newTarget.shields -= absorbed;
  return newTarget;
}