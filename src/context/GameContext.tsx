import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Character, GameMode, Stage, GameState, Effect, TurnRecord } from '../types/game';
import { executeTurnPipeline, processTurnStartEffects } from '../effects/turnPipeline';
import { applyEffect, removeEffect, cleanse } from '../effects/effectLogic';
import { processEffectOnApply, processEffectOnRemove } from '../effects/effectRegistry';
import { normalizeGameState } from '../utils/normalize';

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
  | { type: 'RESET' }
  | { type: 'DRAW' };

const initialState: GameState = {
  stage: 'mode_select',
  gameMode: 'PvP',
  p1: null,
  p2: null,
  turn: 1,
  log: 'Выберите режим игры',
  turnHistory: [],
  attackSummary: [],
  isDraw: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  const getCharacter = (player: 1 | 2): Character | null =>
    player === 1 ? state.p1 : state.p2;

  const updateCharacter = (player: 1 | 2, newCharacter: Character): GameState => {
    return player === 1
      ? { ...state, p1: newCharacter }
      : { ...state, p2: newCharacter };
  };

  switch (action.type) {
    case 'SET_MODE':
      return normalizeGameState({ ...state, gameMode: action.payload });
    case 'SET_STAGE':
      return normalizeGameState({ ...state, stage: action.payload });
    case 'SET_P1':
      return normalizeGameState({ ...state, p1: action.payload });
    case 'SET_P2':
      return normalizeGameState({ ...state, p2: action.payload });
    case 'SET_TURN':
      return normalizeGameState({ ...state, turn: action.payload });
    case 'SET_LOG':
      return normalizeGameState({ ...state, log: action.payload });
    case 'ATTACK': {
      const { attacker, attackIndex } = action.payload;
      const attackerChar = attacker === 1 ? state.p1 : state.p2;
      const targetChar = attacker === 1 ? state.p2 : state.p1;
      
      if (!attackerChar || !targetChar) return state;

      const turnResult = executeTurnPipeline({
        attacker: attackerChar,
        target: targetChar,
        attackIndex,
        gameState: { p1: state.p1, p2: state.p2, turn: state.turn },
      });

      const { updatedAttacker, updatedTarget, logMessages, targetDead } = turnResult;

      const nextTurn = targetDead ? state.turn : (attacker === 1 ? 2 : 1);
      const nextStage = targetDead ? 'winner' : state.stage;

      let logMessage = logMessages.join(' ');
      if (logMessages.length === 0) {
        logMessage = `${attackerChar.name} применил атаку!`;
      }

      const newP1 = attacker === 1 ? updatedAttacker : updatedTarget;
      const newP2 = attacker === 2 ? updatedAttacker : updatedTarget;

      const attack = attackerChar.attacks[attackIndex];
      const attackDamage = targetChar.hp - updatedTarget.hp; 
      const turnRecord: TurnRecord = {
        turnNumber: state.turnHistory.length + 1,
        attacker,
        attackName: attack?.name || 'Неизвестно',
        attackDamage,
        p1Hp: newP1.hp,
        p2Hp: newP2.hp,
        p1Energy: newP1.energy,
        p2Energy: newP2.energy,
        timestamp: Date.now(),
      };

      const newState = {
        ...state,
        p1: newP1,
        p2: newP2,
        turn: nextTurn,
        stage: nextStage,
        log: logMessage,
        turnHistory: [...state.turnHistory, turnRecord],
      };

      return normalizeGameState(newState);
    }
    case 'EFFECT_APPLY': {
      const { target, effect } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      let newChar = applyEffect(char, effect);
      newChar = processEffectOnApply(newChar, effect, undefined, { p1: state.p1, p2: state.p2, turn: state.turn });
      return normalizeGameState(updateCharacter(target, newChar));
    }
    case 'EFFECT_TICK': {
      const { target } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      
      const newChar = processTurnStartEffects(char);
      return normalizeGameState(updateCharacter(target, newChar));
    }
    case 'EFFECT_REMOVE': {
      const { target, effectId } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      const effectToRemove = char.effects.find(e => e.id === effectId);
      let newChar = removeEffect(char, effectId);
      if (effectToRemove) {
        newChar = processEffectOnRemove(newChar, effectToRemove, undefined, { p1: state.p1, p2: state.p2, turn: state.turn });
      }
      return normalizeGameState(updateCharacter(target, newChar));
    }
    case 'CLEANSE': {
      const { target, effectType } = action.payload;
      const char = getCharacter(target);
      if (!char) return state;
      const newChar = cleanse(char, effectType);
      return normalizeGameState(updateCharacter(target, newChar));
    }
    case 'DRAW':
      return normalizeGameState({
        ...state,
        stage: 'winner',
        isDraw: true,
        log: 'Ничья! Оба игрока не могут атаковать.',
      });
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