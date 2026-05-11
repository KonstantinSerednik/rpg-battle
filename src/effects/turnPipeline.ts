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

export function executeTurnPipeline(context: TurnContext): TurnResult {
  const { attacker: originalAttacker, target: originalTarget, attackIndex, gameState } = context;
  const logMessages: string[] = [];
  
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

  attacker.effects.forEach(effect => {
    attacker = processEffectOnTurnStart(attacker, effect, undefined, gameState);
  });

  const wasStunned = attacker.isStunned;

  attacker = tickEffects(attacker);
  
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

  if (wasStunned) {
    logMessages.push(`${attacker.name} оглушён и пропускает ход!`);
    
    return {
      updatedAttacker: attacker,
      updatedTarget: target,
      logMessages,
      targetDead: false,
      resurrected: false,
    };
  }

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

  attacker = {
    ...attacker,
    attacks: attacker.attacks.map((a, idx) =>
      idx === attackIndex ? { ...a, uses: a.uses - 1 } : a
    ),
  };
  attack = attacker.attacks[attackIndex];

  if (attack.appliedEffects && attack.appliedEffects.length > 0) {
    attack.appliedEffects.forEach(effect => {
      const chance = attack.effectChance ?? 1.0;
      if (Math.random() < chance) {
        
        if (effect.id === 'cleanse') {
          
          if (Math.random() < 0.65) {
            
            target.effects = [];
            target.isStunned = false;
            logMessages.push(`Очищение сработало! ${target.name} очищен от всех эффектов.`);
          } else {
            logMessages.push(`Очищение не сработало (шанс 65% не прошёл).`);
          }
          
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

  let targetHpChange = 0;
  let attackerHpChange = 0;
  
  const hasWingedAlly = hasEffect(attacker, 'winged_ally');
  
  let baseDamage = attack.damage;
  let instantWin = false;
  let effectiveDamage = attack.damage;
  
  if (attack.name === 'Божественный луч') {
    effectiveDamage = attacker.energy;
    baseDamage = attacker.energy;
    logMessages.push(`Целитель направляет божественную энергию, нанося ${baseDamage} урона`);
  }
  
  if (attack.name === 'Призыв зверя') {
    const roll = Math.random();
    if (roll < 0.1) {
      
      logMessages.push('Призвана Кошка! Друид одерживает мгновенную победу!');
      targetHpChange = -target.hp; 
      instantWin = true;
      
      baseDamage = 0;
      effectiveDamage = 0;
    } else if (roll < 0.45) {
      
      baseDamage = 20;
      effectiveDamage = 20;
      logMessages.push('Призван Волк! Наносит 20 урона и вызывает кровотечение.');
      target = applyEffect(target, EFFECTS.BLEEDING);
    } else {
      
      baseDamage = 30;
      effectiveDamage = 30;
      logMessages.push('Призван Медведь! Наносит 30 урона.');
    }
  }
  
  if (attack.name === 'Снайперский выстрел') {
    const roll = Math.random();
    if (roll < 0.1) {
      
      baseDamage = 300;
      effectiveDamage = 300;
      logMessages.push('Снайперский выстрел попадает точно в цель! Наносит 300 урона!');
    } else {
      
      baseDamage = 25;
      effectiveDamage = 25;
      logMessages.push('Снайперский выстрел наносит 25 урона.');
    }
  }
  
  if (effectiveDamage > 0 || attack.name === 'Призыв зверя') {
    
    if (hasWingedAlly && !instantWin) {
      baseDamage += 20;
      effectiveDamage += 20;
      logMessages.push(`Крылатый союзник добавляет 20 к урону!`);
    }
    
    if (!instantWin) {
      
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
      
      const finalDamage = calculateFinalDamageWithPipeline(attacker, target, baseDamage);
      
      const absorbed = Math.max(0, rawDamage - finalDamage);
      
      targetHpChange = -finalDamage;
      target = updateShieldsAfterDamage(target, rawDamage);
      
      if (target.shields === 0) {
        target.effects = target.effects.filter(e => e.type !== 'shield');
      }
      logMessages.push(`${attacker.name} наносит ${finalDamage} урона ${target.name}`);
      if (absorbed > 0) {
        logMessages.push(`Щиты поглотили ${absorbed} урона`);
      }
    }
  } else if (attack.damage < 0) {
    
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

  const newTargetHp = Math.max(0, target.hp + targetHpChange);
  let newAttackerHp = Math.min(attacker.max_hp, attacker.hp + attackerHpChange);

  const hasBerserk = attacker.effects.some(e => e.id === 'berserk');
  if (hasBerserk) {
    const selfDamage = 35;
    newAttackerHp = Math.max(0, newAttackerHp - selfDamage);
    logMessages.push(`${attacker.name} наносит ${selfDamage} урона самому себе от берсерка`);
  }

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

  const resurrected = newTargetHp <= 0 && target.effects.some(e => e.id === 'resurrection');
  let finalTargetHp = newTargetHp;
  let finalTargetEffects = target.effects;

  if (resurrected) {
    finalTargetHp = 55;
    finalTargetEffects = target.effects.filter(e => e.id !== 'resurrection');
    logMessages.push(`${target.name} воскрес с 55 HP!`);
  }

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

  const targetDead = finalTargetHp <= 0 && !resurrected;
  if (targetDead) {
    logMessages.push(`${target.name} повержен!`);
  }

  updatedAttacker.effects.forEach(_effect => {
    
    void _effect; 
  });

  return {
    updatedAttacker,
    updatedTarget,
    logMessages,
    targetDead,
    resurrected,
  };
}

export function processTurnStartEffects(character: Character): Character {
  let updated = {
    ...character,
    effects: character.effects.map(e => ({ ...e })),
    attacks: character.attacks.map(a => ({ ...a })),
  };
  
  updated.effects.forEach(effect => {
    updated = processEffectOnTurnStart(updated, effect, undefined, undefined);
  });
  
  updated = tickEffects(updated);
  
  return updated;
}