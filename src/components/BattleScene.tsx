import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  isCritical?: boolean;
}

const BattleScene: React.FC = () => {
  const { state, dispatch } = useGame();
  const { p1, p2, turn, gameMode, log } = state;
  const [popups, setPopups] = useState<Popup[]>([]);
  const [prevHp, setPrevHp] = useState<[number, number]>([p1?.hp ?? 0, p2?.hp ?? 0]);
  const [prevEnergy, setPrevEnergy] = useState<[number, number]>([p1?.energy ?? 0, p2?.energy ?? 0]);

  const player1Ref = useRef<HTMLDivElement>(null);
  const player2Ref = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);

  const hasAvailableAttacks = useCallback((player: Character | null): boolean => {
    if (!player) return false;
    const hasAny = player.attacks.some(a => {
      if (a.uses <= 0) return false;
      if (a.isUltimate && player.energy < (a.energyCost || 0)) return false;
      if (!canUseSecretAttack(player, a) && a.isSecret) return false;
      return true;
    });
    console.log(`[BattleScene] hasAvailableAttacks for ${player.name}:`, hasAny);
    return hasAny;
  }, []);

  const aiChooseAttack = useCallback((aiPlayer: typeof p2, humanPlayer: typeof p1): number => {
    if (!aiPlayer || !humanPlayer) return 0;
    return chooseAiAttack(aiPlayer, humanPlayer);
  }, []);

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

  useEffect(() => {
    if (state.stage === 'winner') return; 
    
    const currentPlayer = turn === 1 ? p1 : p2;
    if (!currentPlayer) return;
    
    const hasAttacks = hasAvailableAttacks(currentPlayer);
    console.log(`[BattleScene] turn=${turn}, hasAttacks=${hasAttacks}`);
    
    if (!hasAttacks) {
      console.log(`[BattleScene] Игрок ${currentPlayer.name} не имеет доступных атак, пропускаем ход`);
      const nextTurn = turn === 1 ? 2 : 1;
      const nextPlayer = nextTurn === 1 ? p1 : p2;
      const nextPlayerHasAttacks = nextPlayer ? hasAvailableAttacks(nextPlayer) : false;
      
      if (!nextPlayerHasAttacks) {
        console.log(`[BattleScene] Оба игрока не имеют атак - ничья`);
        dispatch({ type: 'DRAW' });
      } else {
        dispatch({ type: 'SET_TURN', payload: nextTurn });
        dispatch({ type: 'SET_LOG', payload: `${currentPlayer.name} пропускает ход` });
      }
    }
  }, [turn, p1, p2, state.stage, hasAvailableAttacks, dispatch]);

  const addPopup = (text: string, type: 'damage' | 'heal' | 'energy', x: number, y: number, isCritical = false) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, text, type, x, y, isCritical }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  useEffect(() => {
    if (!p1 || !p2) return;
    const newHp: [number, number] = [p1.hp, p2.hp];
    const newEnergy: [number, number] = [p1.energy, p2.energy];

    const containerRect = statsGridRef.current?.getBoundingClientRect();
    const cardRects = [
      player1Ref.current?.getBoundingClientRect(),
      player2Ref.current?.getBoundingClientRect(),
    ];

    for (let i = 0; i < 2; i++) {
      const diff = newHp[i] - prevHp[i];
      if (diff !== 0) {
        const type = diff < 0 ? 'damage' : 'heal';
        const isCritical = type === 'damage' && Math.random() < 0.1; 
        let text = Math.abs(diff).toString();
        if (isCritical) {
          text = 'КРИТ! ' + text;
        }
        
        let x = i === 0 ? 100 : 400;
        let y = 200;
        
        if (containerRect && cardRects[i]) {
          const rect = cardRects[i]!;
          x = rect.left - containerRect.left + rect.width / 2;
          y = rect.top - containerRect.top;
        }
        
        addPopup(text, type, x, y, isCritical);
      }
    }

    for (let i = 0; i < 2; i++) {
      const diff = newEnergy[i] - prevEnergy[i];
      if (diff !== 0) {
        const text = diff > 0 ? `+${diff}⚡` : `${diff}⚡`;
        
        let x = i === 0 ? 100 : 400;
        let y = 250;
        
        if (containerRect && cardRects[i]) {
          const rect = cardRects[i]!;
          x = rect.left - containerRect.left + rect.width / 2;
          y = rect.top - containerRect.top + 50; 
        }
        
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
    if (turn === 2 && gameMode === 'PvC') return; 
    dispatch({ type: 'ATTACK', payload: { attacker: turn, attackIndex: index } });
  };

  const renderPlayerCard = (player: Character, isActive: boolean, playerNumber: 1 | 2) => {
    
    const hasDevastation = player.effects.some(e => e.id === 'devastation');
    const showHiddenHp = hasDevastation;
    
    const cardRef = playerNumber === 1 ? player1Ref : player2Ref;
    return (
      <div
        ref={cardRef}
        className={`box player-card ${isActive ? 'active-turn' : ''}`}
        style={{ position: 'relative' }}
      >
        <h4>
          {player.name} {playerNumber === 2 && gameMode === 'PvC' && '🤖'}
        </h4>

        {}
        <div className="bar-bg">
          <div
            className="hp-bar"
            style={{ width: `${(player.hp / player.max_hp) * 100}%` }}
          />
        </div>
        <p style={{ fontSize: '0.8rem', margin: '5px 0' }}>
          HP: {showHiddenHp ? '???/???' : `${player.hp}/${player.max_hp}`}
        </p>

        {}
        <div className="bar-bg">
          <div
            className="energy-bar"
            style={{ width: `${(player.energy / 100) * 100}%` }}
          />
        </div>
        <p style={{ fontSize: '0.8rem', margin: '5px 0', color: '#3b82f6' }}>
          {player.resourceName}: {player.energy}/100
        </p>

      {}
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

      {}
      <EffectIcons effects={player.effects} />

      {}
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

      <div ref={statsGridRef} className="stats-grid" style={{ position: 'relative' }}>
        {popups.map(pop => (
          <div
            key={pop.id}
            className={pop.isCritical ? 'critical-popup' : (pop.type === 'damage' ? 'damage-popup' : pop.type === 'heal' ? 'heal-popup' : 'damage-popup')}
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