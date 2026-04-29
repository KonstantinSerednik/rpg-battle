import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import EffectIcons from './EffectIcons';
import { EffectManager } from '../effects/EffectManager';

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

  // Функция выбора атаки для ИИ с учётом эффектов
  const aiChooseAttack = (aiPlayer: typeof p2, humanPlayer: typeof p1): number => {
    if (!aiPlayer || !humanPlayer) return 0;
    const effectManager = new EffectManager();
    const availableAttacks = aiPlayer.attacks
      .map((attack, index) => ({ ...attack, index }))
      .filter(a => a.uses > 0 && (!a.isUltimate || aiPlayer.energy >= (a.energyCost || 0)));

    if (availableAttacks.length === 0) return -1; // нет доступных атак

    // Оценка каждой атаки
    const scoredAttacks = availableAttacks.map(attack => {
      let score = 0;

      // 1. Урон (чем больше, тем лучше)
      if (attack.damage > 0) {
        // Базовый урон
        score += attack.damage * 2;
        // Учёт модификаторов урона атакующего и защиты цели
        const attackerModifiers = effectManager.calculateModifiers(aiPlayer);
        const targetModifiers = effectManager.calculateModifiers(humanPlayer);
        let damage = attack.damage * attackerModifiers.damageMultiplier * (1 - targetModifiers.damageReduction);
        // Если у цели есть уязвимость, увеличиваем ценность
        const hasVulnerability = humanPlayer.effects.some(e => e.id === 'vulnerability');
        if (hasVulnerability) damage *= 1.3;
        score += damage;
      }

      // 2. Исцеление (ценно, если у ИИ мало HP)
      if (attack.damage < 0) {
        const healing = -attack.damage;
        // Чем меньше HP у ИИ, тем ценнее исцеление
        const hpRatio = aiPlayer.hp / aiPlayer.max_hp;
        const healingNeed = 1 - hpRatio; // от 0 до 1
        score += healing * healingNeed * 3;
      }

      // 3. Эффекты атаки
      if (attack.appliedEffects && attack.appliedEffects.length > 0) {
        attack.appliedEffects.forEach(effect => {
          // Приоритет эффектов
          if (effect.type === 'debuff' || effect.type === 'control') {
            // Дебаффы на противника ценны
            score += 15;
            if (effect.isStun) score += 30; // оглушение очень ценно
          }
          if (effect.type === 'buff') {
            // Баффы на себя ценны, если у ИИ низкие показатели
            score += 10;
          }
          if (effect.shieldAmount) {
            score += effect.shieldAmount * 0.5;
          }
          // Периодический урон/лечение
          if (effect.dotDamage) score += effect.dotDamage * effect.duration * 0.8;
          if (effect.hotHealing) score += effect.hotHealing * effect.duration * 0.5;
        });
      }

      // 4. Энергетическая эффективность
      if (attack.isUltimate) {
        // Ультимейты ценны, если у ИИ много энергии
        const energyRatio = aiPlayer.energy / 100;
        score += 20 * energyRatio;
      } else {
        // Обычные атаки дают энергию
        score += (attack.energyGain || 0) * 0.2;
      }

      // 5. Шанс применения эффекта
      const chance = attack.effectChance ?? 1.0;
      score *= chance;

      // 6. Штраф за малое количество использований (чтобы не тратить последний заряд без необходимости)
      if (attack.uses <= 1) score *= 0.7;

      return { ...attack, score };
    });

    // Выбрать атаку с максимальным счётом
    const bestAttack = scoredAttacks.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    return bestAttack.index;
  };

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
  }, [turn, gameMode, p2, dispatch]);

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
        const text = type === 'damage' ? `${-diff}` : `+${diff}`;
        const x = i === 0 ? 100 : 400;
        const y = 200;
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

  const renderPlayerCard = (player: typeof p1, isActive: boolean, playerNumber: 1 | 2) => (
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
        HP: {player.hp}/{player.max_hp}
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
              .filter(a => !a.isUltimate)
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
              .filter(a => a.isUltimate)
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
        {renderPlayerCard(p1, turn === 1, 1)}
        {renderPlayerCard(p2, turn === 2, 2)}
      </div>

      {state.stage === 'winner' && (
        <div className="box">
          <h2>Победил {p1.hp > 0 ? p1.name : p2.name}! 🏆</h2>
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