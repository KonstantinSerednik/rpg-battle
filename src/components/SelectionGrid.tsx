import React from 'react';
import { Sword, Sparkles, Target, Eye, Shield, Flame, Heart, Zap, Check, ArrowLeft } from 'lucide-react';
import type { CharacterPreset, Attack } from '../db';

export type SelectionType = 'character' | 'attack';

export interface SelectionGridProps<T> {
  type: SelectionType;
  items: T[];
  selectedItems: T[];
  
  getKey: (item: T) => string | number;
  
  renderCard: (item: T, isSelected: boolean, onClick: () => void) => React.ReactNode;
  
  onSelect: (item: T) => void;
  
  title: string;
  
  subtitle: string;
  
  maxSelection?: number;
  
  requiresConfirmation?: boolean;
  
  onConfirm?: () => void;
  
  selectionStatus?: string;
  
  onBack?: () => void;
}

const SelectionGrid = <T,>({
  type,
  items,
  selectedItems,
  getKey,
  renderCard,
  onSelect,
  title,
  subtitle,
  maxSelection = 0,
  requiresConfirmation = false,
  onConfirm,
  selectionStatus,
  onBack,
}: SelectionGridProps<T>) => {
  const handleItemClick = (item: T) => {
    
    if (type === 'character') {
      onSelect(item);
      return;
    }

    const isSelected = selectedItems.some(selected => getKey(selected) === getKey(item));
    
    if (isSelected) {
      
      onSelect(item);
    } else {
      
      if (maxSelection > 0 && selectedItems.length >= maxSelection) {
        return;
      }
      onSelect(item);
    }
  };

  return (
    <div className={`box ${type}-selection`}>
      <h3>{title}</h3>
      <p className="selection-subtitle">{subtitle}</p>
      
      <div className={`${type}-grid`}>
        {items.map((item) => {
          const isSelected = selectedItems.some(selected => getKey(selected) === getKey(item));
          return (
            <React.Fragment key={getKey(item)}>
              {renderCard(item, isSelected, () => handleItemClick(item))}
            </React.Fragment>
          );
        })}
      </div>

      <div className="navigation-section">
        {onBack && (
          <button className="btn btn-back" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
        )}
        {requiresConfirmation && onConfirm && (
          <button className="btn btn-confirm" onClick={onConfirm}>
            <Check size={20} />
            <span>Готово</span>
          </button>
        )}
      </div>
      {requiresConfirmation && onConfirm && selectionStatus && (
        <p className="selection-hint">{selectionStatus}</p>
      )}
    </div>
  );
};

export const renderCharacterCard = (
  preset: CharacterPreset,
  _isSelected: boolean,
  onClick: () => void
) => {
  const getIcon = (className: string) => {
    switch (className) {
      case 'Воин': return <Sword size={24} />;
      case 'Маг': return <Sparkles size={24} />;
      case 'Лучник': return <Target size={24} />;
      case 'Разбойник': return <Eye size={24} />;
      case 'Паладин': return <Shield size={24} />;
      case 'Берсерк': return <Flame size={24} />;
      default: return <Heart size={24} />;
    }
  };

  const getResourceIcon = (resourceName: string) => {
    if (resourceName.includes('ярость')) return <Flame size={16} />;
    if (resourceName.includes('мана')) return <Sparkles size={16} />;
    if (resourceName.includes('фокус')) return <Target size={16} />;
    if (resourceName.includes('энергия')) return <Zap size={16} />;
    return <Zap size={16} />;
  };

  return (
    <button
      className="character-card"
      onClick={onClick}
    >
      <div className="character-icon">
        {getIcon(preset.name)}
      </div>
      <div className="character-info">
        <h4>{preset.name}</h4>
        <div className="character-stats">
          <div className="stat">
            <Heart size={14} />
            <span>HP: {preset.hp}/{preset.max_hp}</span>
          </div>
          <div className="stat">
            {getResourceIcon(preset.resourceName)}
            <span>{preset.resourceName}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export const renderAttackCard = (
  attack: Attack,
  isSelected: boolean,
  onClick: () => void
) => {
  const getAttackIcon = (attack: Attack) => {
    if (attack.damage < 0) return <Heart size={18} />; 
    if (attack.isUltimate) return <Zap size={18} />;
    return <Sword size={18} />;
  };

  const getDamageColor = (damage: number) => {
    if (damage < 0) return '#10b981'; 
    if (damage > 50) return '#ef4444'; 
    return '#f59e0b'; 
  };

  const getDamageLabel = (damage: number) => {
    if (damage < 0) return 'Исцеление';
    if (damage === 0) return 'Без урона';
    return 'Урон';
  };

  const getEffectIcon = (icon: string) => {
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
    };
    return iconMap[icon] || '⭐';
  };

  const hasEffects = attack.appliedEffects && attack.appliedEffects.length > 0;
  const effectChancePercent = Math.round((attack.effectChance ?? 1) * 100);
  const effectTooltip = hasEffects
    ? `Эффекты: ${attack.appliedEffects!.map(e => e.name).join(', ')} (шанс ${effectChancePercent}%)`
    : '';

  const getSpecialMechanicDescription = (attack: Attack): string => {
    switch (attack.name) {
      case 'Божественный луч':
        return 'Наносит урон, равный текущей энергии целителя. Урон поглощается щитами.';
      case 'Призыв зверя':
        return 'Случайно призывает: Кошка (10% шанс) – мгновенная победа; Волк (35% шанс) – 20 урона + кровотечение; Медведь (55% шанс) – 30 урона.';
      case 'Снайперский выстрел':
        return '10% шанс нанести 300 урона, иначе 25 урона.';
      default:
        return '';
    }
  };

  const specialMechanic = getSpecialMechanicDescription(attack);
  const fullTooltip = [specialMechanic, effectTooltip].filter(Boolean).join('\n\n');

  return (
    <button
      className={`attack-card ${attack.isUltimate ? 'ultimate' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={fullTooltip}
    >
      <div className="attack-header">
        <div className="attack-icon">{getAttackIcon(attack)}</div>
        <div className="attack-title">
          <strong>{attack.name}</strong>
          <span className="attack-type">
            {attack.isUltimate ? 'Ультимейт' : 'Обычная'}
          </span>
        </div>
        {isSelected && <Check size={20} className="check-icon" />}
      </div>
      <div className="attack-stats">
        <div className="stat">
          <span className="stat-label">{getDamageLabel(attack.damage)}:</span>
          <span className="stat-value" style={{ color: getDamageColor(attack.damage) }}>
            {Math.abs(attack.damage)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Использований:</span>
          <span className="stat-value">{attack.uses}/{attack.max_uses}</span>
        </div>
        {attack.energyGain && (
          <div className="stat">
            <span className="stat-label">Даёт энергии:</span>
            <span className="stat-value energy-gain">+{attack.energyGain}</span>
          </div>
        )}
        {attack.energyCost && (
          <div className="stat">
            <span className="stat-label">Стоимость энергии:</span>
            <span className="stat-value energy-cost">{attack.energyCost}</span>
          </div>
        )}
        {hasEffects && (
          <div className="effects-container">
            <span className="stat-label">Эффекты:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {attack.appliedEffects!.map((effect, idx) => (
                <div
                  key={idx}
                  className={`effect-badge ${effect.type}`}
                  title={`${effect.name}: ${effect.description}\nШанс срабатывания: ${effectChancePercent}%`}
                >
                  <span className="effect-icon">{getEffectIcon(effect.icon)}</span>
                  <span className="effect-name">{effect.name}</span>
                  {effect.duration && effect.duration < 999 && (
                    <span className="effect-duration">{effect.duration}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

export const selectRandomAttacks = (className: string, allAttacks: Attack[]): Attack[] => {
  const classAttacks = allAttacks.filter(a =>
    a.className === className && !a.isSecret
  );
  const normals = classAttacks.filter(a => !a.isUltimate);
  const ults = classAttacks.filter(a => a.isUltimate);

  const selectedUlts = ults.length > 0 ? [ults[Math.floor(Math.random() * ults.length)]] : [];
  
  const selectedNormals = [...normals]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3 - selectedUlts.length);

  const selected = [...selectedNormals, ...selectedUlts];
  
  while (selected.length < 4 && normals.length > 0) {
    const extra = normals.find(n => !selected.includes(n));
    if (extra) selected.push(extra);
    else break;
  }

  return selected.map(a => ({ ...a }));
};

export default SelectionGrid;