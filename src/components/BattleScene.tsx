import React, { useEffect, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import EffectIcons from './EffectIcons';
import { chooseAiAttack } from '../ai/aiLogic';
import { canUseSecretAttack } from '../utilities/secretAttack';
import type { Character } from '../types/game';

interface Popup {
  id: number;
  text: string;
  type: 'damage' | 'heal' | 'energy';
  x: number;
  y: number;
}

const BattleScene: React.FC = () => {
  const { state, dispatch } = useGame();
  const { p1, p2, turn, gameMode, log } = state;
  const [popups, setPopups] = useState<Popup[]>([]);
  const [prevHp, setPrevHp] = useState<[number, number]>([p1?.hp ?? 0, p2?.hp ?? 0]);
  const [prevEnergy, setPrevEnergy] = useState<[number, number]>([p1?.energy ?? 0, p2?.energy ?? 0]);

  // Функция выбора атаки для ИИ с учётом эффектов (использует отдельный модуль)
  const aiChooseAttack = useCallback((aiPlayer: typeof p2, humanPlayer: typeof p1): number => {
    if (!aiPlayer || !humanPlayer) return 0;
    return chooseAiAttack(aiPlayer, humanPlayer);
  }, []);

  // логика хода бота
  useEffect(() => {
    if (turn === 2 && gameMode === 'PvC' && p2) {
      const timer = setTimeout(() => {
        const attackIndex = aiChooseAttack(p2, p1);
        if (attackIndex === -1) {
          dispatch({ type: 'SET_TURN', payload: 1 });
          dispatch({ type: 'SET_LOG', payload: 'ИИ пропускает ход' });
          return;
        }
        dispatch({ type: 'ATTACK', payload: { attacker: 2, attackIndex } });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, p2, dispatch, aiChooseAttack, p1]);

  const addPopup = (text: string, type: 'damage' | 'heal' | 'energy', x: number, y: number) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, text, type, x, y }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  // Всплывающие числа
  useEffect(() => {
    if (!p1 || !p2) return;
    const newHp: [number, number] = [p1.hp, p2.hp];
    const newEnergy: [number, number] = [p1.energy, p2.energy];

    for (let i = 0; i < 2; i++) {
      const diff = newHp[i] - prevHp[i];
      if (diff !== 0) {
        const type = diff < 0 ? 'damage' : 'heal';
        const text = Math.abs(diff).toString();
        const x = i === 0 ? 100 : 400;
        const y = 200;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        addPopup(text, type, x, y);
      }
    }

    for (let i = 0; i < 2; i++) {
      const diff = newEnergy[i] - prevEnergy[i];
      if (diff !== 0) {
        const text = diff > 0 ? `+${diff}⚡` : `${diff}⚡`;
        const x = i === 0 ? 100 : 400;
        const y = 250;
        addPopup(text, 'energy', x, y);
      }
    }

    setPrevHp(newHp);
    setPrevEnergy(newEnergy);
  }, [p1, p2, prevHp, prevEnergy]);

  if (!p1 || !p2) {
    return <div className="box">Ошибка: игроки не выбраны</div>;
  }

  const handleAttack = (index: number) => {
    console.log(`[BattleScene] handleAttack index=${index}, turn=${turn}`);
    if (turn === 2 && gameMode === 'PvC') return; // робот ходит автоматически
    dispatch({ type: 'ATTACK', payload: { attacker: turn, attackIndex: index } });
  };


  const renderPlayerCard = (player: Character, isActive: boolean, playerNumber: 1 | 2) => {
    // Проверяем, есть ли у вражеского игрока эффект 'devastation'
    const hasDevastation = player.effects.some(e => e.id === 'devastation');
    const showHiddenHp = playerNumber === 2 && hasDevastation;
    
    return (
      <div className={`box player-card ${isActive ? 'active-turn' : ''}`} style={{ position: 'relative' }}>
        <h4>
          {player.name} {playerNumber === 2 && gameMode === 'PvC' && '🤖'}
        </h4>

        {/* Полоска HP */}
        <div className="bar-bg">
          <div
            className="hp-bar"
            style={{ width: `${(player.hp / player.max_hp) * 100}%` }}
          />
        </div>
        <p style={{ fontSize: '0.8rem', margin: '5px 0' }}>
          HP: {showHiddenHp ? '???/???' : `${player.hp}/${player.max_hp}`}
        </p>

        {/* Полоска ресурса */}
        <div className="bar-bg">
          <div
            className="energy-bar"
            style={{ width: `${(player.energy / 100) * 100}%` }}
          />
        </div>
        <p style={{ fontSize: '0.8rem', margin: '5px 0', color: '#3b82f6' }}>
          {player.resourceName}: {player.energy}/100
        </p>

      {/* Щиты и оглушение */}
      {(player.shields > 0 || player.isStunned) && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px', fontSize: '0.8rem' }}>
          {player.shields > 0 && (
            <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🛡️ {player.shields}
            </span>
          )}
          {player.isStunned && (
            <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
              💫 Оглушён
            </span>
          )}
        </div>
      )}

      {/* Эффекты */}
      <EffectIcons effects={player.effects} />

      {/* Атаки */}
      {isActive && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <p style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'left' }}>
              Навыки (дают энергию):
            </p>
            {player.attacks
              .filter(a => !a.isUltimate && (canUseSecretAttack(player, a) || !a.isSecret))
              .map((a, ai) => {
                const realIndex = player.attacks.findIndex(at => at.name === a.name);
                return (
                  <button
                    key={ai}
                    disabled={a.uses <= 0 || (turn === 2 && gameMode === 'PvC')}
                    className="btn"
                    onClick={() => handleAttack(realIndex)}
                  >
                    {a.name} ({a.uses}) <small>+🔋{a.energyGain}</small>
                  </button>
                );
              })}
          </div>

          <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.75rem', color: '#aaa', textAlign: 'left' }}>
              Ультимейт (тратит энергию):
            </p>
            {player.attacks
              .filter(a => a.isUltimate && (canUseSecretAttack(player, a) || !a.isSecret))
              .map((a, ai) => {
                const realIndex = player.attacks.findIndex(at => at.name === a.name);
                const canAfford = player.energy >= (a.energyCost || 0);
                return (
                  <button
                    key={ai}
                    disabled={a.uses <= 0 || !canAfford || (turn === 2 && gameMode === 'PvC')}
                    className="btn btn-ult"
                    style={{ width: '100%', opacity: canAfford ? 1 : 0.5 }}
                    onClick={() => handleAttack(realIndex)}
                  >
                    {a.name} <small>⚡{a.energyCost}</small>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

  return (
    <div className="arena-container">
      <div className="box">
        <h2>Бой!</h2>
        <p className="log-text">{log}</p>
        <p>Ход: {turn === 1 ? 'Игрок 1' : gameMode === 'PvC' ? 'ИИ' : 'Игрок 2'}</p>
      </div>

      <div className="stats-grid" style={{ position: 'relative' }}>
        {popups.map(pop => (
          <div
            key={pop.id}
            className={pop.type === 'damage' ? 'damage-popup' : pop.type === 'heal' ? 'heal-popup' : 'damage-popup'}
            style={{
              left: `${pop.x}px`,
              top: `${pop.y}px`,
              position: 'absolute',
              zIndex: 1000,
            }}
          >
            {pop.text}
          </div>
        ))}
        {renderPlayerCard(p1!, turn === 1, 1)}
        {renderPlayerCard(p2!, turn === 2, 2)}
      </div>

      {state.stage === 'winner' && (
        <div className="box">
          <h2>Победил {p1!.hp > 0 ? p1!.name : p2!.name}! 🏆</h2>
          <button
            className="btn btn-confirm"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            Играть снова
          </button>
        </div>
      )}
    </div>
  );
};

export default BattleScene;