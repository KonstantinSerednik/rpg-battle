import React from 'react';
import { useGame } from '../context/GameContext';

const WinnerScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const { p1, p2, gameMode } = state;

  if (!p1 || !p2) {
    return null;
  }

  const winner = p1.hp > 0 ? p1 : p2;
  const isP1Winner = winner === p1;

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="winner-screen">
      <div className="box">
        <h2>🏆 Победа! 🏆</h2>
        <div className="winner-card">
          <h3>{winner.name}</h3>
          <p className="winner-class">Класс: {winner.name}</p>
          <div className="winner-stats">
            <div className="stat">
              <span>Осталось HP:</span>
              <strong>{winner.hp}/{winner.max_hp}</strong>
            </div>
            <div className="stat">
              <span>Ресурс:</span>
              <strong>{winner.energy}/100</strong>
            </div>
          </div>
          <p className="congrats">
            {isP1Winner ? 'Игрок 1 одержал победу!' : (gameMode === 'PvC' ? 'ИИ одержал победу!' : 'Игрок 2 одержал победу!')}
          </p>
        </div>
        <button
          className="btn btn-confirm"
          onClick={handlePlayAgain}
        >
          Играть снова
        </button>
        <p className="hint">Игра начнётся заново с выбора режима</p>
      </div>
    </div>
  );
};

export default WinnerScreen;