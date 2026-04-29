import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Character, GameMode, Stage, GameState, Effect } from '../types/game';
import { EffectManager } from '../effects/EffectManager';

type GameAction =
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'SET_STAGE'; payload: Stage }
  | { type: 'SET_P1'; payload: Character | null }
  | { type: 'SET_P2'; payload: Character | null }
  | { type: 'SET_TURN'; payload: 1 | 2 }
  | { type: 'SET_LOG'; payload: string }
  | { type: 'ATTACK'; payload: { attacker: 1 | 2; attackIndex: number } }
  | { type: 'EFFECT_APPLY'; payload: { target: 1 | 2; effect: Effect } }
  | { type: 'EFFECT_TICK'; payload: { target: 1 | 2 } }
  | { type: 'EFFECT_REMOVE'; payload: { target: 1 | 2; effectId: string } }
  | { type: 'CLEANSE'; payload: { target: 1 | 2; effectType?: string } }
  | { type: 'RESET' };

const initialState: GameState = {
  stage: 'mode_select',
  gameMode: 'PvP',
  p1: null,
  p2: null,
  turn: 1,
  log: 'Выберите режим игры',
  turnHistory: [],
  attackSummary: [],
};

function gameReducer(state: GameState, action: GameAction): GameState {
  const effectManager = new EffectManager();

  const getCharacter = (player: 1 | 2): Character | null =>
    player === 1 ? state.p1 : state.p2;

  const updateCharacter = (player: 1 | 2, updates: Partial<Character>): GameState => {
    const char = getCharacter(player);
    if (!char) return state;
    const updated = { ...char, ...updates };
    return player === 1
      ? { ...state, p1: updated }
      : { ...state, p2: updated };
  };

  switch (action.type) {
    case 'SET_MODE':
      return { ...state, gameMode: action.payload };
    case 'SET_STAGE':
      return { ...state, stage: action.payload };
    case 'SET_P1':
      return { ...state, p1: action.payload };
    case 'SET_P2':
      return { ...state, p2: action.payload };
    case 'SET_TURN':
      return { ...state, turn: action.payload };
    case 'SET_LOG':
      return { ...state, log: action.payload };
    case 'ATTACK': {
      const { attacker, attackIndex } = action.payload;
      const attackerChar = attacker === 1 ? state.p1 : state.p2;
      const targetChar = attacker === 1 ? state.p2 : state.p1;
      if (!attackerChar || !targetChar) return state;

      // Проверка оглушения
      if (attackerChar.isStunned) {
        return {
          ...state,
          log: `${attackerChar.name} оглушён и пропускает ход!`,
          turn: attacker === 1 ? 2 : 1,
        };
      }

      const attack = attackerChar.attacks[attackIndex];
      if (attack.uses <= 0) return state; // Атака недоступна

      // Применить эффекты атаки к цели (с учётом шанса)
      console.log(`[ATTACK] ${attackerChar.name} uses ${attack.name}, appliedEffects:`, attack.appliedEffects);
      if (attack.appliedEffects && attack.appliedEffects.length > 0) {
        attack.appliedEffects.forEach(effect => {
          const chance = attack.effectChance ?? 1.0;
          console.log(`[ATTACK] Effect ${effect.name} chance ${chance}`);
          if (Math.random() < chance) {
            effectManager.applyEffect(targetChar, effect, attackerChar);
          } else {
            console.log(`[ATTACK] Effect ${effect.name} missed due to chance`);
          }
        });
      }

      // Рассчитать модификаторы атакующего и цели
      const attackerModifiers = effectManager.calculateModifiers(attackerChar);
      const targetModifiers = effectManager.calculateModifiers(targetChar);

      // 1. Расчёт изменений HP с учётом модификаторов
      let targetHpChange = 0;
      let attackerHpChange = 0;
      if (attack.damage > 0) {
        // Урон цели
        let damage = attack.damage;
        damage *= attackerModifiers.damageMultiplier;
        damage *= (1 - targetModifiers.damageReduction);
        // Учесть щиты
        damage = effectManager.absorbDamageWithShields(targetChar, damage);
        targetHpChange = -damage;
      } else if (attack.damage < 0) {
        // Исцеление атакующего
        let healing = -attack.damage;
        healing *= attackerModifiers.healingMultiplier;
        attackerHpChange = healing;
      }

      const newTargetHp = Math.max(0, targetChar.hp + targetHpChange);
      const newAttackerHp = Math.min(attackerChar.max_hp, attackerChar.hp + attackerHpChange);

      // 2. Расчёт изменений энергии с учётом модификаторов
      let newEnergy = attackerChar.energy;
      if (attack.isUltimate) {
        const cost = attack.energyCost ?? 0;
        newEnergy = Math.max(0, attackerChar.energy - cost);
      } else {
        const gain = (attack.energyGain ?? 0) * attackerModifiers.energyGainMultiplier;
        newEnergy = Math.min(100, attackerChar.energy + gain);
      }

      // 3. Уменьшение использований атаки
      const newAttacks = attackerChar.attacks.map((a, i) =>
        i === attackIndex ? { ...a, uses: a.uses - 1 } : a
      );

      // 4. Обновить эффекты (тик) для атакующего и цели
      effectManager.tickEffects(attackerChar);
      effectManager.tickEffects(targetChar);

      const updatedAttacker: Character = {
        ...attackerChar,
        hp: newAttackerHp,
        energy: newEnergy,
        attacks: newAttacks,
      };
      const updatedTarget: Character = {
        ...targetChar,
        hp: newTargetHp,
      };

      const newP1 = attacker === 1 ? updatedAttacker : updatedTarget;
      const newP2 = attacker === 2 ? updatedAttacker : updatedTarget;

      // 5. Проверка победы
      const targetDead = newTargetHp <= 0;
      const nextTurn = targetDead ? state.turn : (attacker === 1 ? 2 : 1);
      const nextStage = targetDead ? 'winner' : state.stage;

      // 6. Формирование лога
      let logMessage = `${attackerChar.name} применил ${attack.name}!`;
      if (attack.damage > 0) {
        logMessage += ` Нанесён урон ${-targetHpChange}.`;
      } else if (attack.damage < 0) {
        logMessage += ` Восстановлено ${attackerHpChange} HP.`;
      }
      if (attack.isUltimate) {
        logMessage += ` Потрачено ${attack.energyCost ?? 0} энергии.`;
      } else {
        logMessage += ` Получено ${attack.energyGain ?? 0} энергии.`;
      }
      if (targetDead) {
        logMessage += ` ${targetChar.name} повержен!`;
      }

      return {
        ...state,
        p1: newP1,
        p2: newP2,
        turn: nextTurn,
        stage: nextStage,
        log: logMessage,
      };
    }
    case 'EFFECT_APPLY': {
      const { target, effect } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      effectManager.applyEffect(char, effect);
      return updateCharacter(target, { ...char });
    }
    case 'EFFECT_TICK': {
      const { target } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      effectManager.tickEffects(char);
      return updateCharacter(target, { ...char });
    }
    case 'EFFECT_REMOVE': {
      const { target, effectId } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      effectManager.removeEffect(char, effectId);
      return updateCharacter(target, { ...char });
    }
    case 'CLEANSE': {
      const { target, effectType } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      effectManager.cleanse(char, effectType);
      return updateCharacter(target, { ...char });
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}