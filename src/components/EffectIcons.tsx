import React from 'react';
import type { Effect } from '../types/game';

interface EffectIconsProps {
  effects: Effect[];
}

const EffectIcons: React.FC<EffectIconsProps> = ({ effects }) => {
  if (effects.length === 0) {
    return <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#666' }}>Нет эффектов</div>;
  }

  const getColor = (type: Effect['type']) => {
    switch (type) {
      case 'buff': return '#4ade80'; 
      case 'debuff': return '#f87171'; 
      case 'shield': return '#60a5fa'; 
      case 'control': return '#a78bfa'; 
      case 'special': return '#fbbf24'; 
      default: return '#94a3b8';
    }
  };

  const getIcon = (icon: string) => {
    
    const iconMap: Record<string, string> = {
      bleed: '🩸',
      burn: '🔥',
      poison: '☠️',
      stun: '💫',
      slow: '🐌',
      vulnerability: '🎯',
      strength: '💪',
      regeneration: '❤️‍🩹',
      protection: '🛡️',
      energy_boost: '⚡',
      shield: '🛡️',
      divine_shield: '✨',
      invisibility: '👻',
      reflect: '↩️',
      dot: '⏳',
      devastation: '💀',
      berserk: '😠',
      corrosion: '🧪',
      winged_ally: '🦅',
      arcane: '🔮',
      bear_form: '🐻',
      cleanse: '✨',
      resurrection: '❤️',
    };
    return iconMap[icon] || '⭐';
  };

  return (
    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {effects.map((effect) => (
        <div
          key={effect.id}
          title={`${effect.name}: ${effect.description}\nДлительность: ${effect.duration} ход(ов)`}
          style={{
            position: 'relative',
            backgroundColor: getColor(effect.type),
            color: 'white',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'help',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ fontSize: '1rem' }}>{getIcon(effect.icon)}</span>
          <span style={{ fontWeight: 'bold' }}>{effect.name}</span>
          {effect.maxStacks && effect.maxStacks > 1 && (
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {effect.currentStacks}
            </span>
          )}
          <span style={{ marginLeft: '4px', opacity: 0.9 }}>{effect.duration}⏱️</span>
        </div>
      ))}
    </div>
  );
};

export default EffectIcons;