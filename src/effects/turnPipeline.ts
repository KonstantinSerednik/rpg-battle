import type { Character } from '../types/game';
import {
  tickEffects,
  applyEffect,
  calculateModifiers,
  calculateFinalDamage,
  updateShieldsAfterDamage,
} from './effectLogic';
import {
  processEffectOnTurnStart,
  processEffectOnApply,
} from './effectRegistry';

export interface TurnContext {
  attacker: Character;
  target: Character;
  attackIndex: number;
  gameState?: {
    p1: Character | null;
    p2: Character | null;
    turn: 1 | 2;
  };
}

export interface TurnResult {
  updatedAttacker: Character;
  updatedTarget: Character;
  logMessages: string[];
  targetDead: boolean;
  resurrected: boolean;
}

/**
 * Линеаризованный жизненный цикл хода.
 * Выполняет все этапы хода в правильном порядке:
 * 1. Начало хода: снижение длительности эффектов и щитов
 * 2. Тик эффектов: вычисление и применение периодического урона или лечения
 * 3. Проверка смерти: если HP ниже нуля, мгновенный переход к состоянию завершения боя
 * 4. Проверка контроля: если персонаж оглушен, автоматический пропуск хода
 * 5. Действие: выполнение выбранной атаки
 * 6. Финальная проверка: повторная проверка состояния здоровья и завершение хода
 */
export function executeTurnPipeline(context: TurnContext): TurnResult {
  const { attacker: originalAttacker, target: originalTarget, attackIndex, gameState } = context;
  const logMessages: string[] = [];
  
  // 1. Создаём иммутабельные копии
  let attacker = {
    ...originalAttacker,
    effects: originalAttacker.effects.map(e => ({ ...e })),
    attacks: originalAttacker.attacks.map(a => ({ ...a })),
  };
  let target = {
    ...originalTarget,
    effects: originalTarget.effects.map(e => ({ ...e })),
    attacks: originalTarget.attacks.map(a => ({ ...a })),
  };

  // 2. Начало хода: обработка onTurnStart для всех эффектов атакующего
  attacker.effects.forEach(effect => {
    attacker = processEffectOnTurnStart(attacker, effect, undefined, gameState);
  });

  // 3. Тик эффектов атакующего (уменьшение длительности, периодический урон/лечение)
  attacker = tickEffects(attacker);
  
  // 4. Проверка смерти атакующего после тика эффектов
  if (attacker.hp <= 0) {
    logMessages.push(`${attacker.name} погиб от эффектов перед своим ходом!`);
    return {
      updatedAttacker: attacker,
      updatedTarget: target,
      logMessages,
      targetDead: false,
      resurrected: false,
    };
  }

  // 5. Проверка контроля: если персонаж оглушен, пропускаем ход
  if (attacker.isStunned) {
    logMessages.push(`${attacker.name} оглушён и пропускает ход!`);
    // Тик эффектов цели (даже если ход пропущен)
    target = tickEffects(target);
    return {
      updatedAttacker: attacker,
      updatedTarget: target,
      logMessages,
      targetDead: false,
      resurrected: false,
    };
  }

  // 6. Получение атаки
  const attack = attacker.attacks[attackIndex];
  if (!attack || attack.uses <= 0) {
    logMessages.push(`${attacker.name} пытается использовать недоступную атаку!`);
    return {
      updatedAttacker: attacker,
      updatedTarget: target,
      logMessages,
      targetDead: false,
      resurrected: false,
    };
  }

  // 7. Применение эффектов атаки (с учётом шанса)
  if (attack.appliedEffects && attack.appliedEffects.length > 0) {
    attack.appliedEffects.forEach(effect => {
      const chance = attack.effectChance ?? 1.0;
      if (Math.random() < chance) {
        const isDebuffOrControl = effect.type === 'debuff' || effect.type === 'control';
        const effectTarget = isDebuffOrControl ? target : attacker;
        const source = isDebuffOrControl ? attacker : undefined;
        
        if (isDebuffOrControl) {
          target = applyEffect(target, effect);
          target = processEffectOnApply(target, effect, source, gameState);
        } else {
          attacker = applyEffect(attacker, effect);
          attacker = processEffectOnApply(attacker, effect, source, gameState);
        }
        logMessages.push(`Эффект "${effect.name}" применён к ${effectTarget.name}`);
      }
    });
  }

  // 8. Расчёт урона/исцеления
  let targetHpChange = 0;
  let attackerHpChange = 0;
  
  if (attack.damage > 0) {
    // Урон цели
    const damage = calculateFinalDamage(attacker, target, attack.damage);
    targetHpChange = -damage;
    target = updateShieldsAfterDamage(target, damage);
    logMessages.push(`${attacker.name} наносит ${damage} урона ${target.name}`);
  } else if (attack.damage < 0) {
    // Исцеление атакующего
    const attackerModifiers = calculateModifiers(attacker);
    let healing = -attack.damage;
    healing *= attackerModifiers.healingMultiplier;
    healing = Math.round(healing);
    attackerHpChange = healing;
    logMessages.push(`${attacker.name} восстанавливает ${healing} HP`);
  }

  // 9. Применение изменений HP
  const newTargetHp = Math.max(0, target.hp + targetHpChange);
  let newAttackerHp = Math.min(attacker.max_hp, attacker.hp + attackerHpChange);

  // 10. Самоповреждение от эффекта Берсерк
  const hasBerserk = attacker.effects.some(e => e.id === 'berserk');
  if (hasBerserk) {
    const selfDamage = 35;
    newAttackerHp = Math.max(0, newAttackerHp - selfDamage);
    logMessages.push(`${attacker.name} наносит ${selfDamage} урона самому себе от берсерка`);
  }

  // 11. Обновление энергии
  let newEnergy = attacker.energy;
  if (attack.isUltimate) {
    const cost = attack.energyCost ?? 0;
    newEnergy = Math.max(0, attacker.energy - cost);
    logMessages.push(`Потрачено ${cost} энергии`);
  } else {
    const attackerModifiers = calculateModifiers(attacker);
    const gain = (attack.energyGain ?? 0) * attackerModifiers.energyGainMultiplier;
    newEnergy = Math.min(100, attacker.energy + Math.round(gain));
    logMessages.push(`Получено ${Math.round(gain)} энергии`);
  }

  // 12. Уменьшение использований атаки
  attacker.attacks[attackIndex] = { ...attack, uses: attack.uses - 1 };

  // 13. Тик эффектов цели после получения урона
  target = tickEffects(target);

  // 14. Проверка воскрешения
  let finalTargetHp = newTargetHp;
  let finalTargetEffects = target.effects;
  const resurrected = newTargetHp <= 0 && target.effects.some(e => e.id === 'resurrection');
  if (resurrected) {
    finalTargetHp = 55;
    finalTargetEffects = target.effects.filter(e => e.id !== 'resurrection');
    logMessages.push(`${target.name} воскрес с 55 HP!`);
  }

  // 15. Обновление персонажей с нормализацией числовых данных
  const updatedAttacker: Character = {
    ...attacker,
    hp: Math.round(newAttackerHp),
    energy: Math.round(newEnergy),
  };
  
  const updatedTarget: Character = {
    ...target,
    hp: Math.round(finalTargetHp),
    effects: finalTargetEffects,
  };

  // 16. Финальная проверка смерти цели
  const targetDead = finalTargetHp <= 0 && !resurrected;
  if (targetDead) {
    logMessages.push(`${target.name} повержен!`);
  }

  // 17. Обработка onTurnEnd для всех эффектов атакующего
  updatedAttacker.effects.forEach(_effect => {
    // processEffectOnTurnEnd будет вызываться в вызывающем коде при необходимости
    void _effect; // игнорируем неиспользуемый параметр
  });

  return {
    updatedAttacker,
    updatedTarget,
    logMessages,
    targetDead,
    resurrected,
  };
}

/**
 * Упрощённая функция для обработки только тика эффектов (для пропущенных ходов).
 */
export function processTurnStartEffects(character: Character): Character {
  let updated = {
    ...character,
    effects: character.effects.map(e => ({ ...e })),
    attacks: character.attacks.map(a => ({ ...a })),
  };
  
  // Обработка onTurnStart
  updated.effects.forEach(effect => {
    updated = processEffectOnTurnStart(updated, effect, undefined, undefined);
  });
  
  // Тик эффектов
  updated = tickEffects(updated);
  
  return updated;
}