import type { Character } from '../types/game';
import type { Attack } from '../db';
import { calculateFinalDamage } from '../effects/effectLogic';
import { canUseSecretAttack } from '../utilities/secretAttack';

export interface ScoredAttack {
  index: number;
  score: number;
  attack: Attack & { index: number };
}

/**
 * Выбрать лучшую атаку для ИИ на основе текущего состояния.
 * Возвращает индекс выбранной атаки или -1, если нет доступных атак.
 */
export function chooseAiAttack(
  aiPlayer: Character,
  humanPlayer: Character
): number {
  if (!aiPlayer || !humanPlayer) return 0;

  const availableAttacks = aiPlayer.attacks
    .map((attack, index) => ({ ...attack, index }))
    .filter(a => a.uses > 0 && (!a.isUltimate || aiPlayer.energy >= (a.energyCost || 0)) && canUseSecretAttack(aiPlayer, a));

  if (availableAttacks.length === 0) return -1; // нет доступных атак

  const prioritizeDefense = shouldPrioritizeDefense(aiPlayer, humanPlayer);

  // Оценка каждой атаки
  const scoredAttacks = availableAttacks.map(attack => {
    let score = 0;

    // 1. Урон (чем больше, тем лучше)
    if (attack.damage > 0) {
      // Учёт модификаторов урона атакующего и защиты цели, включая щиты
      const damage = calculateFinalDamage(aiPlayer, humanPlayer, attack.damage);
      // Используем финальный урон и добавляем базовый урон как бонус 1 к 1
      score += damage + attack.damage;
    }

    // 2. Исцеление (ценно, если у ИИ мало HP)
    if (attack.damage < 0) {
      const healing = -attack.damage;
      // Чем меньше HP у ИИ, тем ценнее исцеление
      const hpRatio = aiPlayer.hp / aiPlayer.max_hp;
      const healingNeed = 1 - hpRatio; // от 0 до 1
      score += healing * healingNeed * 3;
    }

    // 3. Эффекты атаки
    if (attack.appliedEffects && attack.appliedEffects.length > 0) {
      attack.appliedEffects.forEach(effect => {
        // Приоритет эффектов
        if (effect.type === 'debuff' || effect.type === 'control') {
          // Дебаффы на противника ценны
          score += 15;
          if (effect.isStun) score += 30; // оглушение очень ценно
        }
        if (effect.type === 'buff') {
          // Баффы на себя ценны, если у ИИ низкие показатели
          score += 10;
        }
        if (effect.shieldAmount) {
          score += effect.shieldAmount * 0.5;
        }
        // Периодический урон/лечение
        if (effect.dotDamage) score += effect.dotDamage * effect.duration * 0.8;
        if (effect.hotHealing) score += effect.hotHealing * effect.duration * 0.5;
      });
    }

    // 4. Энергетическая эффективность
    if (attack.isUltimate) {
      // Ультимейты ценны, если у ИИ много энергии
      const energyRatio = aiPlayer.energy / 100;
      score += 20 * energyRatio;
    } else {
      // Обычные атаки дают энергию
      score += (attack.energyGain || 0) * 0.2;
    }

    // 5. Шанс применения эффекта
    const chance = attack.effectChance ?? 1.0;
    score *= chance;

    // 6. Штраф за малое количество использований (чтобы не тратить последний заряд без необходимости)
    if (attack.uses <= 1) score *= 0.7;

    // 7. Приоритет защиты/исцеления при опасности
    if (prioritizeDefense) {
      const isDefensiveOrHealing = attack.damage < 0 ||
        (attack.appliedEffects && attack.appliedEffects.some(e =>
          e.type === 'buff' || e.shieldAmount || e.hotHealing
        ));
      if (isDefensiveOrHealing) {
        score *= 1.5;
      } else {
        score *= 0.7;
      }
    }

    return { index: attack.index, score, attack };
  });

  // Выбрать атаку с максимальным счётом
  const bestAttack = scoredAttacks.reduce((best, current) =>
    current.score > best.score ? current : best
  );
  return bestAttack.index;
}

/**
 * Оценить угрозу со стороны противника.
 * Возвращает число от 0 до 1, где 1 - максимальная угроза.
 */
export function evaluateThreat(aiPlayer: Character, humanPlayer: Character): number {
  if (humanPlayer.hp <= 0) return 0; // противник мёртв
  
  const aiHpRatio = aiPlayer.hp / aiPlayer.max_hp;
  const humanDamagePotential = humanPlayer.attacks
    .filter(a => a.uses > 0)
    .reduce((max, a) => Math.max(max, a.damage), 0);
  
  const threatFromDamage = humanDamagePotential / aiPlayer.max_hp;
  const threatFromLowHp = 1 - aiHpRatio;
  
  return Math.min(1, (threatFromDamage * 0.7 + threatFromLowHp * 0.3));
}

/**
 * Определить, следует ли ИИ использовать защитные способности.
 * Возвращает true, если ИИ в опасности и должен сосредоточиться на защите/исцелении.
 */
export function shouldPrioritizeDefense(aiPlayer: Character, humanPlayer: Character): boolean {
  const threat = evaluateThreat(aiPlayer, humanPlayer);
  return threat > 0.7 || aiPlayer.hp / aiPlayer.max_hp < 0.3;
}

/**
 * Получить отладочную информацию о выборе атаки ИИ.
 */
export function getAiDebugInfo(
  aiPlayer: Character,
  humanPlayer: Character
): { availableAttacks: number; chosenIndex: number; scores: ScoredAttack[] } {
  const availableAttacks = aiPlayer.attacks
    .map((attack, index) => ({ ...attack, index }))
    .filter(a => a.uses > 0 && (!a.isUltimate || aiPlayer.energy >= (a.energyCost || 0)) && canUseSecretAttack(aiPlayer, a));

  const scores: ScoredAttack[] = availableAttacks.map(attack => {
    let score = 0;
    if (attack.damage > 0) {
      const damage = calculateFinalDamage(aiPlayer, humanPlayer, attack.damage);
      // Используем финальный урон и добавляем базовый урон как бонус 1 к 1
      score += damage + attack.damage;
    }
    if (attack.damage < 0) {
      const healing = -attack.damage;
      const hpRatio = aiPlayer.hp / aiPlayer.max_hp;
      const healingNeed = 1 - hpRatio;
      score += healing * healingNeed * 3;
    }
    // Упрощённая оценка эффектов
    if (attack.appliedEffects) {
      attack.appliedEffects.forEach(effect => {
        if (effect.type === 'debuff' || effect.type === 'control') score += 15;
        if (effect.isStun) score += 30;
      });
    }
    return { index: attack.index, score, attack };
  });

  const chosenIndex = scores.length > 0 
    ? scores.reduce((best, current) => current.score > best.score ? current : best).index
    : -1;

  return { availableAttacks: availableAttacks.length, chosenIndex, scores };
}