import type { Character } from '../types/game';
import type { Attack } from '../db';
import { calculateFinalDamageWithPipeline } from '../effects/statPipeline';
import { canUseSecretAttack } from '../utilities/secretAttack';

export interface ScoredAttack {
  index: number;
  score: number;
  attack: Attack & { index: number };
}

export function chooseAiAttack(
  aiPlayer: Character,
  humanPlayer: Character
): number {
  if (!aiPlayer || !humanPlayer) return 0;

  const availableAttacks = aiPlayer.attacks
    .map((attack, index) => ({ ...attack, index }))
    .filter(a => a.uses > 0 && (!a.isUltimate || aiPlayer.energy >= (a.energyCost || 0)) && canUseSecretAttack(aiPlayer, a));

  if (availableAttacks.length === 0) return -1; 

  const prioritizeDefense = shouldPrioritizeDefense(aiPlayer, humanPlayer);

  const scoredAttacks = availableAttacks.map(attack => {
    let score = 0;

    if (attack.damage > 0) {
      
      const damage = calculateFinalDamageWithPipeline(aiPlayer, humanPlayer, attack.damage);
      
      score += damage + attack.damage;
    }

    if (attack.damage < 0) {
      const healing = -attack.damage;
      
      const hpRatio = aiPlayer.hp / aiPlayer.max_hp;
      const healingNeed = 1 - hpRatio; 
      score += healing * healingNeed * 3;
    }

    if (attack.appliedEffects && attack.appliedEffects.length > 0) {
      attack.appliedEffects.forEach(effect => {
        
        if (effect.type === 'debuff' || effect.type === 'control') {
          
          score += 15;
          if (effect.isStun) score += 30; 
        }
        if (effect.type === 'buff') {
          
          score += 10;
        }
        if (effect.shieldAmount) {
          score += effect.shieldAmount * 0.5;
        }
        
        if (effect.dotDamage) score += effect.dotDamage * effect.duration * 0.8;
        if (effect.hotHealing) score += effect.hotHealing * effect.duration * 0.5;
      });
    }

    if (attack.isUltimate) {
      
      const energyRatio = aiPlayer.energy / 100;
      score += 20 * energyRatio;
    } else {
      
      score += (attack.energyGain || 0) * 0.2;
    }

    const chance = attack.effectChance ?? 1.0;
    score *= chance;

    if (attack.uses <= 1) score *= 0.7;

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

  const bestAttack = scoredAttacks.reduce((best, current) =>
    current.score > best.score ? current : best
  );
  return bestAttack.index;
}

export function evaluateThreat(aiPlayer: Character, humanPlayer: Character): number {
  if (humanPlayer.hp <= 0) return 0; 
  
  const aiHpRatio = aiPlayer.hp / aiPlayer.max_hp;
  const humanDamagePotential = humanPlayer.attacks
    .filter(a => a.uses > 0)
    .reduce((max, a) => Math.max(max, a.damage), 0);
  
  const threatFromDamage = humanDamagePotential / aiPlayer.max_hp;
  const threatFromLowHp = 1 - aiHpRatio;
  
  return Math.min(1, (threatFromDamage * 0.7 + threatFromLowHp * 0.3));
}

export function shouldPrioritizeDefense(aiPlayer: Character, humanPlayer: Character): boolean {
  const threat = evaluateThreat(aiPlayer, humanPlayer);
  return threat > 0.7 || aiPlayer.hp / aiPlayer.max_hp < 0.3;
}

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
      const damage = calculateFinalDamageWithPipeline(aiPlayer, humanPlayer, attack.damage);
      
      score += damage + attack.damage;
    }
    if (attack.damage < 0) {
      const healing = -attack.damage;
      const hpRatio = aiPlayer.hp / aiPlayer.max_hp;
      const healingNeed = 1 - hpRatio;
      score += healing * healingNeed * 3;
    }
    
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