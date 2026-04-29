import React from 'react';
import { useGame } from '../context/GameContext';
import { Users, Bot } from 'lucide-react';

const ModeSelection: React.FC = () => {
  const { dispatch } = useGame();

  const handleSelect = (mode: 'PvP' | 'PvC') => {
    dispatch({ type: 'SET_MODE', payload: mode });
    dispatch({ type: 'SET_STAGE', payload: 'p1_char' });
    dispatch({ type: 'SET_LOG', payload: `Выбран режим: ${mode === 'PvP' ? 'Игрок против игрока' : 'Игрок против ИИ'}` });
  };

  return (
    <div className="box mode-selection">
      <h2>Выберите режим игры</h2>
      <p className="mode-subtitle">Сразитесь с другом или против искусственного интеллекта</p>
      <div className="mode-buttons">
        <button className="btn mode-btn mode-btn-pvp" onClick={() => handleSelect('PvP')}>
          <Users size={20} />
          <span>PvP (Игрок vs Игрок)</span>
        </button>
        <button className="btn mode-btn mode-btn-pvc" onClick={() => handleSelect('PvC')}>
          <Bot size={20} />
          <span>PvC (Игрок vs ИИ)</span>
        </button>
      </div>
    </div>
  );
};

export default ModeSelection;