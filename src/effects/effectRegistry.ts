import type { Character, Effect } from '../types/game';
import { log } from '../utils/logger';

export type EffectCallback = (
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
) => Character | void;

export interface EffectRegistry {
  [key: string]: EffectCallback;
}

export const EffectCallbackKey = {
  RESURRECTION: 'resurrection',
  BERSERK: 'berserk',
  CLEANSE: 'cleanse',
  REFLECT: 'reflect',
} as const;

export type EffectCallbackKey = typeof EffectCallbackKey[keyof typeof EffectCallbackKey];

export const effectRegistry: EffectRegistry = {
  
  [EffectCallbackKey.RESURRECTION]: (target, _effect) => {
    log(`[effectRegistry] resurrection callback for ${target.name}`);
    
    void _effect; 
    return target;
  },
  
  [EffectCallbackKey.BERSERK]: (target, _effect) => {
    log(`[effectRegistry] berserk callback for ${target.name}`);
    
    void _effect; 
    return target;
  },
  
  [EffectCallbackKey.CLEANSE]: (target, _effect) => {
    log(`[effectRegistry] cleanse callback for ${target.name}`);
    
    void _effect; 
    return target;
  },
  
  [EffectCallbackKey.REFLECT]: (target, effect, source, gameState) => {
    log(`[effectRegistry] reflect callback for ${target.name}`);
    if (!source || !gameState) return target;
    
    const reflectPercent = effect.reflectPercent ?? 0;
    if (reflectPercent > 0) {
      log(`Отражение ${reflectPercent * 100}% урона обратно атакующему`);
      
    }
    return target;
  },
};

export function isValidCallbackKey(key: string): key is EffectCallbackKey {
  return Object.values(EffectCallbackKey).includes(key as EffectCallbackKey);
}

export function executeEffectCallback(
  callbackName: string,
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  
  if (!isValidCallbackKey(callbackName)) {
    console.warn(`[effectRegistry] Callback "${callbackName}" is not a registered callback key. Registered keys: ${Object.values(EffectCallbackKey).join(', ')}`);
    return target;
  }

  const callback = effectRegistry[callbackName];
  if (!callback) {
    console.warn(`[effectRegistry] Callback "${callbackName}" not found in registry (should not happen)`);
    return target;
  }
  
  try {
    const result = callback(target, effect, source, gameState);
    if (result && typeof result === 'object') {
      return result as Character;
    }
    return target;
  } catch (error) {
    console.error(`[effectRegistry] Error executing callback "${callbackName}":`, error);
    return target;
  }
}

export function processEffectOnApply(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  if (effect.onApply) {
    newTarget = executeEffectCallback(effect.onApply, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}

export function processEffectOnTurnStart(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  if (effect.onTurnStart) {
    newTarget = executeEffectCallback(effect.onTurnStart, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}

export function processEffectOnTurnEnd(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  if (effect.onTurnEnd) {
    newTarget = executeEffectCallback(effect.onTurnEnd, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}

export function processEffectOnRemove(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  if (effect.onRemove) {
    newTarget = executeEffectCallback(effect.onRemove, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}