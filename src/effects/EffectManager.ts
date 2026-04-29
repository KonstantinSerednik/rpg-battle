import type { Character, Effect } from '../types/game';

export interface Modifiers {
  damageMultiplier: number;
  damageReduction: number;
  healingMultiplier: number;
  energyGainMultiplier: number;
  criticalChance: number;
  dodgeChance: number;
}

export class EffectManager {
  /**
   * Применить эффект к персонажу с учётом приоритетов и стаков
   */
  applyEffect(target: Character, effect: Effect, _source?: Character): void {
    console.log(`[EffectManager] Applying effect ${effect.name} to ${target.name}`);
    // Если эффект с таким id уже есть
    const existingIndex = target.effects.findIndex(e => e.id === effect.id);
    if (existingIndex >= 0) {
      const existing = target.effects[existingIndex];
      // Если есть стаки и не достигнут максимум
      if (existing.maxStacks && existing.currentStacks < existing.maxStacks) {
        existing.currentStacks += 1;
        existing.duration = Math.max(existing.duration, effect.duration); // продлить длительность
      } else {
        // Заменить эффект, если новый имеет более высокий приоритет
        if (effect.priority > existing.priority) {
          target.effects[existingIndex] = { ...effect, currentStacks: 1 };
        }
        // Иначе оставить старый
      }
    } else {
      // Добавить новый эффект
      target.effects.push({ ...effect, currentStacks: 1 });
    }

    // Обработка щитов
    if (effect.shieldAmount) {
      target.shields += effect.shieldAmount;
    }

    // Обработка оглушения
    if (effect.isStun) {
      target.isStunned = true;
    }

    // Вызов колбэка onApply (если есть)
    if (effect.onApply) {
      // В реальной реализации можно вызвать функцию, но пока просто логируем
      console.log(`Effect ${effect.name} applied to ${target.name}`);
    }
  }

  /**
   * Обновить длительность эффектов и вызвать колбэки
   */
  tickEffects(target: Character): void {
    const effectsToRemove: string[] = [];

    target.effects.forEach(effect => {
      // Уменьшить длительность
      effect.duration -= 1;

      // Вызвать onTurnStart (если есть)
      if (effect.onTurnStart) {
        console.log(`Effect ${effect.name} onTurnStart for ${target.name}`);
      }

      // Применить периодический урон/лечение
      if (effect.dotDamage) {
        target.hp -= effect.dotDamage * effect.currentStacks;
        if (target.hp < 0) target.hp = 0;
      }
      if (effect.hotHealing) {
        target.hp += effect.hotHealing * effect.currentStacks;
        if (target.hp > target.max_hp) target.hp = target.max_hp;
      }

      // Если длительность истекла, пометить на удаление
      if (effect.duration <= 0) {
        effectsToRemove.push(effect.id);
      }
    });

    // Удалить истёкшие эффекты
    effectsToRemove.forEach(id => this.removeEffect(target, id));

    // Сбросить оглушение, если нет эффектов с isStun
    const hasStun = target.effects.some(e => e.isStun);
    if (!hasStun) {
      target.isStunned = false;
    }
  }

  /**
   * Рассчитать суммарные модификаторы от всех активных эффектов
   */
  calculateModifiers(target: Character): Modifiers {
    const base: Modifiers = {
      damageMultiplier: 1,
      damageReduction: 0,
      healingMultiplier: 1,
      energyGainMultiplier: 1,
      criticalChance: 0,
      dodgeChance: 0,
    };

    target.effects.forEach(effect => {
      const { modifiers } = effect;
      if (modifiers.damageMultiplier) base.damageMultiplier *= modifiers.damageMultiplier;
      if (modifiers.damageReduction) base.damageReduction += modifiers.damageReduction;
      if (modifiers.healingMultiplier) base.healingMultiplier *= modifiers.healingMultiplier;
      if (modifiers.energyGainMultiplier) base.energyGainMultiplier *= modifiers.energyGainMultiplier;
      if (modifiers.criticalChance) base.criticalChance += modifiers.criticalChance;
      if (modifiers.dodgeChance) base.dodgeChance += modifiers.dodgeChance;
    });

    return base;
  }

  /**
   * Проверить наличие эффекта по id
   */
  hasEffect(target: Character, effectId: string): boolean {
    return target.effects.some(e => e.id === effectId);
  }

  /**
   * Удалить эффект по id
   */
  removeEffect(target: Character, effectId: string): void {
    const index = target.effects.findIndex(e => e.id === effectId);
    if (index >= 0) {
      const effect = target.effects[index];
      // Вызов колбэка onRemove
      if (effect.onRemove) {
        console.log(`Effect ${effect.name} removed from ${target.name}`);
      }
      // Убрать щит, если эффект был щитом
      if (effect.shieldAmount) {
        target.shields = Math.max(0, target.shields - effect.shieldAmount);
      }
      target.effects.splice(index, 1);
    }
  }

  /**
   * Снять эффекты определённого типа (или все дебаффы)
   */
  cleanse(target: Character, effectType?: string): void {
    if (effectType) {
      target.effects = target.effects.filter(e => e.type !== effectType);
    } else {
      // По умолчанию снимаем все дебаффы
      target.effects = target.effects.filter(e => e.type !== 'debuff');
    }
    // После очистки проверить оглушение
    const hasStun = target.effects.some(e => e.isStun);
    if (!hasStun) {
      target.isStunned = false;
    }
  }

  /**
   * Получить текущее значение щитов
   */
  getShieldAmount(target: Character): number {
    return target.shields;
  }

  /**
   * Поглотить урон щитами
   * Возвращает оставшийся урон после поглощения
   */
  absorbDamageWithShields(target: Character, damage: number): number {
    if (target.shields <= 0) return damage;
    const absorbed = Math.min(target.shields, damage);
    target.shields -= absorbed;
    return damage - absorbed;
  }
}