import React, { useCallback, useMemo } from 'react';
import { ALL_ATTACKS, PRESETS, getSecretAttacks } from '../db';
import { useGame } from '../context/GameContext';
import type { Attack } from '../db';
import SelectionGrid, { renderAttackCard, selectRandomAttacks } from './SelectionGrid';

interface AttackSelectionProps {
  forPlayer: 1 | 2;
}

const AttackSelection: React.FC<AttackSelectionProps> = ({ forPlayer }) => {
  const { state, dispatch } = useGame();
  const { gameMode } = state;
  const player = forPlayer === 1 ? state.p1 : state.p2;
  const className = player?.name || '';

  const classAttacks = ALL_ATTACKS.filter(a =>
    a.className === className && !a.isSecret
  );
  const selectedAttacks = useMemo(() => player?.attacks || [], [player?.attacks]);

  const handleToggle = useCallback((attack: Attack) => {
    if (!player) return;

    const isSelected = selectedAttacks.some(a => a.name === attack.name);
    let newAttacks: Attack[];
    
    if (isSelected) {
      newAttacks = selectedAttacks.filter(a => a.name !== attack.name);
    } else {
      if (selectedAttacks.length >= 4) return;
      if (attack.isUltimate && selectedAttacks.some(a => a.isUltimate)) {
        alert('Можно выбрать только один ультимейт!');
        return;
      }
      newAttacks = [...selectedAttacks, { ...attack }];
    }

    const updatedPlayer = { ...player, attacks: newAttacks };
    if (forPlayer === 1) {
      dispatch({ type: 'SET_P1', payload: updatedPlayer });
    } else {
      dispatch({ type: 'SET_P2', payload: updatedPlayer });
    }
  }, [player, selectedAttacks, forPlayer, dispatch]);

  const handleConfirm = useCallback(() => {
    if (selectedAttacks.length !== 4) {
      alert('Нужно выбрать ровно 4 атаки!');
      return;
    }
    const hasUltimate = selectedAttacks.some(a => a.isUltimate);
    if (!hasUltimate) {
      alert('Нужно выбрать хотя бы одну ультимейт-атаку!');
      return;
    }

    if (forPlayer === 1) {
      if (gameMode === 'PvC') {
        // выбор для ИИ
        const availablePresets = PRESETS.filter(p => p.name !== player?.name);
        const randomPreset = availablePresets.length > 0
          ? availablePresets[Math.floor(Math.random() * availablePresets.length)]
          : PRESETS[0];
        const aiAttacks = selectRandomAttacks(randomPreset.name, ALL_ATTACKS);
        const secretAttacks = getSecretAttacks(randomPreset.name);
        const allAiAttacks = [...aiAttacks, ...secretAttacks];
        const aiCharacter = { ...randomPreset, attacks: allAiAttacks, effects: [], shields: 0, isStunned: false };
        dispatch({ type: 'SET_P2', payload: aiCharacter });
        dispatch({ type: 'SET_STAGE', payload: 'battle' });
        dispatch({ type: 'SET_LOG', payload: `ИИ выбрал ${randomPreset.name} и ${aiAttacks.length} атак` });
      } else {
        // Добавляем секретные атаки к персонажу игрока 1
        if (player) {
          const secretAttacks = getSecretAttacks(player.name);
          const allAttacks = [...selectedAttacks, ...secretAttacks];
          const updatedPlayer = { ...player, attacks: allAttacks };
          dispatch({ type: 'SET_P1', payload: updatedPlayer });
        }
        dispatch({ type: 'SET_STAGE', payload: 'p2_char' });
        dispatch({ type: 'SET_LOG', payload: 'Игрок 1 выбрал атаки' });
      }
    } else {
      // Добавляем секретные атаки к персонажу игрока 2
      if (player) {
        const secretAttacks = getSecretAttacks(player.name);
        const allAttacks = [...selectedAttacks, ...secretAttacks];
        const updatedPlayer = { ...player, attacks: allAttacks };
        dispatch({ type: 'SET_P2', payload: updatedPlayer });
      }
      dispatch({ type: 'SET_STAGE', payload: 'battle' });
      dispatch({ type: 'SET_LOG', payload: 'Игрок 2 выбрал атаки' });
    }
  }, [selectedAttacks, forPlayer, gameMode, player, dispatch]);

  const handleBack = useCallback(() => {
    if (forPlayer === 1) {
      dispatch({ type: 'SET_STAGE', payload: 'p1_char' });
    } else {
      dispatch({ type: 'SET_STAGE', payload: 'p2_char' });
    }
  }, [forPlayer, dispatch]);

  const getSelectionStatus = () => {
    if (selectedAttacks.length < 4) {
      return `Осталось выбрать ${4 - selectedAttacks.length} атак`;
    }
    if (!selectedAttacks.some(a => a.isUltimate)) {
      return 'Все атаки выбраны! (Но нет ультимейта!)';
    }
    return 'Все атаки выбраны! (Выбран 1 ультимейт)';
  };

  return (
    <SelectionGrid
      type="attack"
      items={classAttacks}
      selectedItems={selectedAttacks}
      getKey={(attack) => attack.name}
      renderCard={renderAttackCard}
      onSelect={handleToggle}
      title={`Выбор атак (${forPlayer === 1 ? 'Игрок 1' : 'Игрок 2'})`}
      subtitle="Выберите 4 атаки (минимум 1 ультимейт, максимум 1 ультимейт)."
      maxSelection={4}
      requiresConfirmation={true}
      onConfirm={handleConfirm}
      onBack={handleBack}
      selectionStatus={getSelectionStatus()}
    />
  );
};

export default AttackSelection;
