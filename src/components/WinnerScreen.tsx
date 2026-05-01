import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import StatsChart from './StatsChart';

const WinnerScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const { p1, p2, gameMode, isDraw } = state;
  const [showStats, setShowStats] = useState(false);

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
        {isDraw ? (
          <>
            <h2>🤝 Ничья! 🤝</h2>
            <div className="winner-card">
              <h3>Оба игрока не могут атаковать</h3>
              <div className="winner-stats">
                <div className="stat">
                  <span>Игрок 1 HP:</span>
                  <strong>{p1.hp}/{p1.max_hp}</strong>
                </div>
                <div className="stat">
                  <span>Игрок 2 HP:</span>
                  <strong>{p2.hp}/{p2.max_hp}</strong>
                </div>
              </div>
              <p className="congrats">
                Все атаки израсходованы или недоступны.
              </p>
            </div>
          </>
        ) : (
          <>
            <h2>🏆 Победа! 🏆</h2>
            <div className="winner-card">
              <h3>{winner.name}</h3>
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
          </>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
          <button
            className="btn btn-confirm"
            onClick={handlePlayAgain}
          >
            Играть снова
          </button>
          <button
            className="btn"
            onClick={() => setShowStats(!showStats)}
            style={{ background: '#6b7280' }}
          >
            {showStats ? 'Скрыть статистику' : 'Показать статистику'}
          </button>
        </div>
        <p className="hint">Игра начнётся заново с выбора режима</p>
        {showStats && <StatsChart />}
      </div>
    </div>
  );
};

export default WinnerScreen;