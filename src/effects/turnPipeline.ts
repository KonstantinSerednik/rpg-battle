import type { Character } from '../types/game';
import { EFFECTS } from '../data/effects';
import {
  tickEffects,
  applyEffect,
  calculateModifiers,
  updateShieldsAfterDamage,
  hasEffect,
} from './effectLogic';
import { calculateFinalDamageWithPipeline, calculateStat } from './statPipeline';
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

  // Сохраняем состояние оглушения до тика эффектов
  const wasStunned = attacker.isStunned;

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

  // 5. Проверка контроля: если персонаж был оглушен до тика, пропускаем ход
  if (wasStunned) {
    logMessages.push(`${attacker.name} оглушён и пропускает ход!`);
    // Цель НЕ тикаем (DoT/HoT сработают только в начале её хода)
    return {
      updatedAttacker: attacker,
      updatedTarget: target,
      logMessages,
      targetDead: false,
      resurrected: false,
    };
  }

  // 6. Получение атаки
  let attack = attacker.attacks[attackIndex];
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

  // Уменьшение uses атаки на исходном массиве
  attacker = {
    ...attacker,
    attacks: attacker.attacks.map((a, idx) =>
      idx === attackIndex ? { ...a, uses: a.uses - 1 } : a
    ),
  };
  attack = attacker.attacks[attackIndex];

  // 7. Применение эффектов атаки (с учётом шанса)
  if (attack.appliedEffects && attack.appliedEffects.length > 0) {
    attack.appliedEffects.forEach(effect => {
      const chance = attack.effectChance ?? 1.0;
      if (Math.random() < chance) {
        // Специальная обработка для эффекта очищения
        if (effect.id === 'cleanse') {
          // Очищение с шансом 65% (дополнительный шанс поверх общего шанса атаки)
          if (Math.random() < 0.65) {
            // Очищаем цель атаки
            target.effects = [];
            target.isStunned = false;
            logMessages.push(`Очищение сработало! ${target.name} очищен от всех эффектов.`);
          } else {
            logMessages.push(`Очищение не сработало (шанс 65% не прошёл).`);
          }
          // Не добавляем эффект очищения в массив эффектов цели
          return;
        }
        
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
  
  const hasWingedAlly = hasEffect(attacker, 'winged_ally');
  
  // Объявляем переменные для расчёта урона
  let baseDamage = attack.damage;
  let instantWin = false;
  let effectiveDamage = attack.damage;
  
  // Специальная атака "Божественный луч"
  if (attack.name === 'Божественный луч') {
    effectiveDamage = attacker.energy;
    baseDamage = attacker.energy;
    logMessages.push(`Целитель направляет божественную энергию, нанося ${baseDamage} урона`);
  }
  
  // Специальная атака "Призыв зверя"
  if (attack.name === 'Призыв зверя') {
    const roll = Math.random();
    if (roll < 0.1) {
      // Кошка – мгновенная победа
      logMessages.push('Призвана Кошка! Друид одерживает мгновенную победу!');
      targetHpChange = -target.hp; // Устанавливаем HP цели в 0
      instantWin = true;
      // Пропускаем стандартный расчёт урона
      baseDamage = 0;
      effectiveDamage = 0;
    } else if (roll < 0.45) {
      // Волк – 20 урона + кровотечение
      baseDamage = 20;
      effectiveDamage = 20;
      logMessages.push('Призван Волк! Наносит 20 урона и вызывает кровотечение.');
      target = applyEffect(target, EFFECTS.BLEEDING);
    } else {
      // Медведь – 30 урона
      baseDamage = 30;
      effectiveDamage = 30;
      logMessages.push('Призван Медведь! Наносит 30 урона.');
    }
  }
  
  // Специальная атака "Снайперский выстрел"
  if (attack.name === 'Снайперский выстрел') {
    const roll = Math.random();
    if (roll < 0.1) {
      // Критический выстрел - 300 урона
      baseDamage = 300;
      effectiveDamage = 300;
      logMessages.push('Снайперский выстрел попадает точно в цель! Наносит 300 урона!');
    } else {
      // Обычный выстрел - 25 урона (уже установлено в базовом damage)
      baseDamage = 25;
      effectiveDamage = 25;
      logMessages.push('Снайперский выстрел наносит 25 урона.');
    }
  }
  
  if (effectiveDamage > 0 || attack.name === 'Призыв зверя') {
    // Урон цели: сначала вычисляем rawDamage (без щитов)
    
    if (hasWingedAlly && !instantWin) {
      baseDamage += 20;
      effectiveDamage += 20;
      logMessages.push(`Крылатый союзник добавляет 20 к урону!`);
    }
    
    if (!instantWin) {
      // Вычисляем rawDamage (урон до щитов) с использованием конвейера характеристик
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
      let rawDamage = attackerDamage * (1 - targetDamageReduction);
      rawDamage = Math.round(rawDamage);
      
      // Финальный урон с учётом щитов (уже включает поглощение щитов)
      const finalDamage = calculateFinalDamageWithPipeline(attacker, target, baseDamage);
      
      // Поглощённый урон (разница между rawDamage и finalDamage, но не отрицательный)
      const absorbed = Math.max(0, rawDamage - finalDamage);
      
      targetHpChange = -finalDamage;
      target = updateShieldsAfterDamage(target, rawDamage);
      // Если щиты цели стали равны 0, удалить все эффекты с типом 'shield'
      if (target.shields === 0) {
        target.effects = target.effects.filter(e => e.type !== 'shield');
      }
      logMessages.push(`${attacker.name} наносит ${finalDamage} урона ${target.name}`);
      if (absorbed > 0) {
        logMessages.push(`Щиты поглотили ${absorbed} урона`);
      }
    }
  } else if (attack.damage < 0) {
    // Исцеление атакующего
    const attackerModifiers = calculateModifiers(attacker);
    let healing = -attack.damage;
    if (hasWingedAlly) {
      healing += 25;
      logMessages.push(`Крылатый союзник добавляет 25 к исцелению!`);
    }
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

  // 13. Проверка воскрешения (мгновенное, без тика цели)
  const resurrected = newTargetHp <= 0 && target.effects.some(e => e.id === 'resurrection');
  let finalTargetHp = newTargetHp;
  let finalTargetEffects = target.effects;

  if (resurrected) {
    finalTargetHp = 55;
    finalTargetEffects = target.effects.filter(e => e.id !== 'resurrection');
    logMessages.push(`${target.name} воскрес с 55 HP!`);
  }

  // 14. Обновление персонажей с нормализацией числовых данных
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

  // 15. Финальная проверка смерти цели (после воскрешения)
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