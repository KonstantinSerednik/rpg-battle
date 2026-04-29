import type { Character, Effect } from '../types/game';

export type EffectCallback = (
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
) => Character | void;

export interface EffectRegistry {
  [key: string]: EffectCallback;
}

/**
 * Константы допустимых ключей колбэков эффектов.
 * Используется для строгой типизации вместо магических строк.
 */
export const EffectCallbackKey = {
  RESURRECTION: 'resurrection',
  BERSERK: 'berserk',
  CLEANSE: 'cleanse',
  REFLECT: 'reflect',
} as const;

export type EffectCallbackKey = typeof EffectCallbackKey[keyof typeof EffectCallbackKey];

/**
 * Реестр функций для обработки колбэков эффектов.
 * Ключи - значения из EffectCallbackKey.
 */
export const effectRegistry: EffectRegistry = {
  // Пример: эффект воскрешения
  [EffectCallbackKey.RESURRECTION]: (target, _effect) => {
    console.log(`[effectRegistry] resurrection callback for ${target.name}`);
    // Воскрешение уже обрабатывается в основном потоке, но можно добавить дополнительную логику
    void _effect; // игнорируем неиспользуемый параметр
    return target;
  },
  
  // Пример: эффект берсерка
  [EffectCallbackKey.BERSERK]: (target, _effect) => {
    console.log(`[effectRegistry] berserk callback for ${target.name}`);
    // Логика берсерка уже реализована в applyEffect
    void _effect; // игнорируем неиспользуемый параметр
    return target;
  },
  
  // Пример: эффект очищения
  [EffectCallbackKey.CLEANSE]: (target, _effect) => {
    console.log(`[effectRegistry] cleanse callback for ${target.name}`);
    // Логика очищения уже реализована в applyEffect
    void _effect; // игнорируем неиспользуемый параметр
    return target;
  },
  
  // Пример: эффект отражения урона
  [EffectCallbackKey.REFLECT]: (target, effect, source, gameState) => {
    console.log(`[effectRegistry] reflect callback for ${target.name}`);
    if (!source || !gameState) return target;
    
    // Логика отражения урона может быть реализована здесь
    // Например, если есть эффект с reflectPercent, можно применить отражение
    const reflectPercent = effect.reflectPercent ?? 0;
    if (reflectPercent > 0) {
      console.log(`Отражение ${reflectPercent * 100}% урона обратно атакующему`);
      // Здесь можно добавить логику отражения урона
    }
    return target;
  },
};

/**
 * Проверить, является ли строка допустимым ключом колбэка.
 */
export function isValidCallbackKey(key: string): key is EffectCallbackKey {
  return Object.values(EffectCallbackKey).includes(key as EffectCallbackKey);
}

/**
 * Выполнить колбэк эффекта, если он зарегистрирован.
 * Возвращает обновлённого персонажа или исходного, если колбэк не найден.
 */
export function executeEffectCallback(
  callbackName: string,
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  // Проверка на допустимый ключ
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

/**
 * Обработать все колбэки эффекта при применении.
 */
export function processEffectOnApply(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  // Выполнить onApply колбэк, если он есть
  if (effect.onApply) {
    newTarget = executeEffectCallback(effect.onApply, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}

/**
 * Обработать все колбэки эффекта в начале хода.
 */
export function processEffectOnTurnStart(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  // Выполнить onTurnStart колбэк, если он есть
  if (effect.onTurnStart) {
    newTarget = executeEffectCallback(effect.onTurnStart, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}

/**
 * Обработать все колбэки эффекта в конце хода.
 */
export function processEffectOnTurnEnd(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  // Выполнить onTurnEnd колбэк, если он есть
  if (effect.onTurnEnd) {
    newTarget = executeEffectCallback(effect.onTurnEnd, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}

/**
 * Обработать все колбэки эффекта при удалении.
 */
export function processEffectOnRemove(
  target: Character,
  effect: Effect,
  source?: Character,
  gameState?: { p1: Character | null; p2: Character | null; turn: 1 | 2 }
): Character {
  let newTarget = { ...target };
  
  // Выполнить onRemove колбэк, если он есть
  if (effect.onRemove) {
    newTarget = executeEffectCallback(effect.onRemove, newTarget, effect, source, gameState);
  }
  
  return newTarget;
}