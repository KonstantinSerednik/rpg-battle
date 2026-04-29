import React from 'react';
import { PRESETS, ALL_ATTACKS } from '../db';
import { useGame } from '../context/GameContext';
import type { CharacterPreset } from '../db';
import SelectionGrid, { renderCharacterCard, selectRandomAttacks } from './SelectionGrid';

interface CharacterSelectionProps {
  forPlayer: 1 | 2;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ forPlayer }) => {
  const { state, dispatch } = useGame();
  const { gameMode } = state;

  const handleSelect = (preset: CharacterPreset) => {
    if (forPlayer === 1) {
      const character = { ...preset, attacks: [], effects: [], shields: 0, isStunned: false };
      dispatch({ type: 'SET_P1', payload: character });
      dispatch({ type: 'SET_STAGE', payload: 'p1_attacks' });
      dispatch({ type: 'SET_LOG', payload: `Игрок 1 выбрал ${preset.name}` });
    } else {
      if (gameMode === 'PvC') {
        // Автоматический выбор атак для робота
        const attacks = selectRandomAttacks(preset.name, ALL_ATTACKS);
        const character = { ...preset, attacks, effects: [], shields: 0, isStunned: false };
        dispatch({ type: 'SET_P2', payload: character });
        dispatch({ type: 'SET_STAGE', payload: 'battle' });
        dispatch({ type: 'SET_LOG', payload: `ИИ выбрал ${preset.name} и ${attacks.length} атак` });
      } else {
        const character = { ...preset, attacks: [], effects: [], shields: 0, isStunned: false };
        dispatch({ type: 'SET_P2', payload: character });
        dispatch({ type: 'SET_STAGE', payload: 'p2_attacks' });
        dispatch({ type: 'SET_LOG', payload: `Игрок 2 выбрал ${preset.name}` });
      }
    }
  };

  const playerTitle = forPlayer === 1 ? 'Игрок 1' : (gameMode === 'PvC' ? 'ИИ' : 'Игрок 2');

  const handleBack = () => {
    if (forPlayer === 1) {
      // Возврат к выбору режима
      dispatch({ type: 'SET_STAGE', payload: 'mode_select' });
      dispatch({ type: 'SET_LOG', payload: 'Выберите режим игры' });
    } else {
      // Возврат к выбору персонажа игрока 1
      dispatch({ type: 'SET_STAGE', payload: 'p1_char' });
      dispatch({ type: 'SET_LOG', payload: 'Игрок 1, выберите героя' });
    }
  };

  return (
    <SelectionGrid
      type="character"
      items={PRESETS}
      selectedItems={[]}
      getKey={(preset) => preset.id}
      renderCard={renderCharacterCard}
      onSelect={handleSelect}
      title={`Выбор героя (${playerTitle})`}
      subtitle="Выберите класс персонажа:"
      maxSelection={0}
      requiresConfirmation={false}
      onBack={handleBack}
    />
  );
};

export default CharacterSelection;