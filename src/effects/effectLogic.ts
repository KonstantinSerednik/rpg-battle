import type { Character, Effect } from '../types/game';
import { ALL_ATTACKS } from '../db';

export interface Modifiers {
  damageMultiplier: number;
  damageReduction: number;
  healingMultiplier: number;
  energyGainMultiplier: number;
  criticalChance: number;
  dodgeChance: number;
}

/**
 * Применить эффект к персонажу с учётом приоритетов и стаков.
 * Возвращает нового персонажа с обновлёнными эффектами и характеристиками.
 */
export function applyEffect(
  target: Character,
  effect: Effect
): Character {
  console.log(`[effectLogic] Applying effect ${effect.name} to ${target.name}`);
  
  // Создаём глубокую копию персонажа
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  // Если эффект с таким id уже есть
  const existingIndex = newTarget.effects.findIndex(e => e.id === effect.id);
  if (existingIndex >= 0) {
    const existing = newTarget.effects[existingIndex];
    // Если есть стаки и не достигнут максимум
    if (existing.maxStacks && existing.currentStacks < existing.maxStacks) {
      newTarget.effects[existingIndex] = {
        ...existing,
        currentStacks: existing.currentStacks + 1,
        duration: Math.max(existing.duration, effect.duration),
      };
    } else {
      // Заменить эффект, если новый имеет более высокий приоритет
      if (effect.priority > existing.priority) {
        newTarget.effects[existingIndex] = { ...effect, currentStacks: 1 };
      }
      // Иначе оставить старый (ничего не меняем)
    }
  } else {
    // Проверить ограничение на количество эффектов (максимум 3 разных эффекта)
    const uniqueEffectIds = new Set(newTarget.effects.map(e => e.id));
    if (uniqueEffectIds.size >= 3) {
      // Найти эффект с наименьшим приоритетом для удаления
      let lowestPriority = Infinity;
      let lowestPriorityIndex = -1;
      newTarget.effects.forEach((e, idx) => {
        if (e.priority < lowestPriority) {
          lowestPriority = e.priority;
          lowestPriorityIndex = idx;
        }
      });
      // Если нашли, удаляем его
      if (lowestPriorityIndex >= 0) {
        console.log(`[effectLogic] Достигнут лимит 3 эффектов, удаляем эффект ${newTarget.effects[lowestPriorityIndex].name} с приоритетом ${lowestPriority}`);
        newTarget.effects = newTarget.effects.filter((_, idx) => idx !== lowestPriorityIndex);
      }
    }
    // Добавить новый эффект
    newTarget.effects.push({ ...effect, currentStacks: 1 });
  }

  // Обработка щитов
  if (effect.shieldAmount) {
    newTarget.shields += effect.shieldAmount;
  }

  // Обработка оглушения
  if (effect.isStun) {
    newTarget.isStunned = true;
  }

  // Обработка специальных эффектов
  if (effect.id === 'berserk') {
    // Установить максимальное HP = 100 и восстановить HP
    newTarget.max_hp = 100;
    if (newTarget.hp > newTarget.max_hp) {
      newTarget.hp = newTarget.max_hp;
    }
    // Заменить все атаки на "Удар топором Берсерка"
    const berserkAttack = ALL_ATTACKS.find(a => a.name === 'Удар топором Берсерка');
    if (berserkAttack) {
      // Создаём копию атаки с обновлёнными uses (чтобы не мутировать оригинал)
      const attackCopy = { ...berserkAttack };
      newTarget.attacks = [attackCopy];
    }
    console.log(`[effectLogic] ${newTarget.name} впал в берсерк! HP установлено 100, атаки заменены.`);
  }

  if (effect.id === 'bear_form') {
    // Заменить атаки на медвежьи атаки
    const bearAttack1 = ALL_ATTACKS.find(a => a.name === 'Удар медвежьей лапы');
    const bearAttack2 = ALL_ATTACKS.find(a => a.name === 'Укуси меня пчела');
    if (bearAttack1 && bearAttack2) {
      const attackCopy1 = { ...bearAttack1 };
      const attackCopy2 = { ...bearAttack2 };
      newTarget.attacks = [attackCopy1, attackCopy2];
    }
    console.log(`[effectLogic] ${newTarget.name} превратился в медведя! Атаки заменены.`);
  }

  if (effect.id === 'arcane') {
    // Восстановить использование атаки "Арканный выстрел"
    const arcaneShot = newTarget.attacks.find(a => a.name === 'Арканный выстрел');
    if (arcaneShot && arcaneShot.uses < arcaneShot.max_uses) {
      arcaneShot.uses = arcaneShot.max_uses;
      console.log(`[effectLogic] ${newTarget.name} восстановил использование "Арканного выстрела".`);
    }
  }

  if (effect.id === 'cleanse') {
    // Очистка всех эффектов с шансом 65%
    const chance = 0.65;
    if (Math.random() < chance) {
      // Удалить все эффекты (кроме, возможно, баффов? но очищение снимает всё)
      newTarget.effects = [];
      newTarget.isStunned = false;
      console.log(`[effectLogic] ${newTarget.name} очищен от всех эффектов (шанс сработал).`);
    } else {
      console.log(`[effectLogic] Очищение не сработало (шанс ${chance} не прошёл).`);
    }
  }

  // Вызов колбэка onApply (если есть) - будет обработан через реестр функций
  if (effect.onApply) {
    console.log(`Effect ${effect.name} applied to ${newTarget.name}`);
  }

  return newTarget;
}

/**
 * Обновить длительность эффектов и вызвать колбэки.
 * Возвращает нового персонажа с обновлёнными эффектами и HP.
 */
export function tickEffects(target: Character): Character {
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  const effectsToRemove: string[] = [];

  newTarget.effects.forEach(effect => {
    // Уменьшить длительность
    effect.duration -= 1;

    // Вызвать onTurnStart (если есть) - будет обработан через реестр функций
    if (effect.onTurnStart) {
      console.log(`Effect ${effect.name} onTurnStart for ${newTarget.name}`);
    }

    // Применить периодический урон/лечение
    if (effect.dotDamage) {
      newTarget.hp -= effect.dotDamage * effect.currentStacks;
      if (newTarget.hp < 0) newTarget.hp = 0;
    }
    if (effect.hotHealing) {
      newTarget.hp += effect.hotHealing * effect.currentStacks;
      if (newTarget.hp > newTarget.max_hp) newTarget.hp = newTarget.max_hp;
    }

    // Если длительность истекла, пометить на удаление
    if (effect.duration <= 0) {
      effectsToRemove.push(effect.id);
    }
  });

  // Удалить истёкшие эффекты
  newTarget.effects = newTarget.effects.filter(e => !effectsToRemove.includes(e.id));

  // Сбросить оглушение, если нет эффектов с isStun
  const hasStun = newTarget.effects.some(e => e.isStun);
  if (!hasStun) {
    newTarget.isStunned = false;
  }

  return newTarget;
}

/**
 * Рассчитать суммарные модификаторы от всех активных эффектов.
 */
export function calculateModifiers(target: Character): Modifiers {
  const base: Modifiers = {
    damageMultiplier: 1,
    damageReduction: 0,
    healingMultiplier: 1,
    energyGainMultiplier: 1,
    criticalChance: 0,
    dodgeChance: 0,
  };

  console.log(`[effectLogic] calculateModifiers for ${target.name}, effects:`, target.effects.map(e => e.name));

  target.effects.forEach(effect => {
    const { modifiers, currentStacks } = effect;
    const stacks = currentStacks || 1;
    if (modifiers.damageMultiplier) {
      const old = base.damageMultiplier;
      base.damageMultiplier *= Math.pow(modifiers.damageMultiplier, stacks);
      console.log(`  effect ${effect.name}: damageMultiplier ${modifiers.damageMultiplier}^${stacks} => ${base.damageMultiplier} (was ${old})`);
    }
    if (modifiers.damageReduction) {
      const old = base.damageReduction;
      base.damageReduction += modifiers.damageReduction * stacks;
      console.log(`  effect ${effect.name}: damageReduction ${modifiers.damageReduction}*${stacks} => ${base.damageReduction} (was ${old})`);
    }
    if (modifiers.healingMultiplier) {
      const old = base.healingMultiplier;
      base.healingMultiplier *= Math.pow(modifiers.healingMultiplier, stacks);
      console.log(`  effect ${effect.name}: healingMultiplier ${modifiers.healingMultiplier}^${stacks} => ${base.healingMultiplier} (was ${old})`);
    }
    if (modifiers.energyGainMultiplier) {
      const old = base.energyGainMultiplier;
      base.energyGainMultiplier *= Math.pow(modifiers.energyGainMultiplier, stacks);
      console.log(`  effect ${effect.name}: energyGainMultiplier ${modifiers.energyGainMultiplier}^${stacks} => ${base.energyGainMultiplier} (was ${old})`);
    }
    if (modifiers.criticalChance) {
      const old = base.criticalChance;
      base.criticalChance += modifiers.criticalChance * stacks;
      console.log(`  effect ${effect.name}: criticalChance ${modifiers.criticalChance}*${stacks} => ${base.criticalChance} (was ${old})`);
    }
    if (modifiers.dodgeChance) {
      const old = base.dodgeChance;
      base.dodgeChance += modifiers.dodgeChance * stacks;
      console.log(`  effect ${effect.name}: dodgeChance ${modifiers.dodgeChance}*${stacks} => ${base.dodgeChance} (was ${old})`);
    }
  });

  console.log(`[effectLogic] final modifiers for ${target.name}:`, base);
  return base;
}

/**
 * Рассчитать финальный урон с учётом модификаторов атакующего и защиты цели,
 * а также щитов.
 */
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

  // Учесть щиты
  finalDamage = absorbDamageWithShields(target, finalDamage);

  console.log(`[effectLogic] calculateFinalDamage: base=${baseDamage}, attackerMult=${attackerMods.damageMultiplier}, targetReduction=${targetMods.damageReduction}, afterShields=${finalDamage}`);
  return finalDamage;
}

/**
 * Проверить наличие эффекта по id.
 */
export function hasEffect(target: Character, effectId: string): boolean {
  return target.effects.some(e => e.id === effectId);
}

/**
 * Удалить эффект по id.
 * Возвращает нового персонажа без эффекта.
 */
export function removeEffect(target: Character, effectId: string): Character {
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  const index = newTarget.effects.findIndex(e => e.id === effectId);
  if (index >= 0) {
    const effect = newTarget.effects[index];
    // Вызов колбэка onRemove
    if (effect.onRemove) {
      console.log(`Effect ${effect.name} removed from ${newTarget.name}`);
    }
    // Убрать щит, если эффект был щитом
    if (effect.shieldAmount) {
      newTarget.shields = Math.max(0, newTarget.shields - effect.shieldAmount);
    }
    newTarget.effects.splice(index, 1);
  }

  return newTarget;
}

/**
 * Снять эффекты определённого типа (или все дебаффы).
 * Возвращает нового персонажа с отфильтрованными эффектами.
 */
export function cleanse(target: Character, effectType?: string): Character {
  const newTarget: Character = {
    ...target,
    effects: target.effects.map(e => ({ ...e })),
    attacks: target.attacks.map(a => ({ ...a })),
  };

  if (effectType) {
    newTarget.effects = newTarget.effects.filter(e => e.type !== effectType);
  } else {
    // По умолчанию снимаем все дебаффы
    newTarget.effects = newTarget.effects.filter(e => e.type !== 'debuff');
  }
  // После очистки проверить оглушение
  const hasStun = newTarget.effects.some(e => e.isStun);
  if (!hasStun) {
    newTarget.isStunned = false;
  }

  return newTarget;
}

/**
 * Получить текущее значение щитов.
 */
export function getShieldAmount(target: Character): number {
  return target.shields;
}

/**
 * Поглотить урон щитами.
 * Возвращает оставшийся урон после поглощения.
 * Не изменяет оригинального персонажа.
 */
export function absorbDamageWithShields(target: Character, damage: number): number {
  if (target.shields <= 0) return damage;
  const absorbed = Math.min(target.shields, damage);
  // Не изменяем target.shields, так как это чистая функция
  // Изменение щитов должно происходить в вызывающем коде через обновление персонажа
  return damage - absorbed;
}

/**
 * Обновить щиты персонажа после поглощения урона.
 * Возвращает нового персонажа с обновлёнными щитами.
 */
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