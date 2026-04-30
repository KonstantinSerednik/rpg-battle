import React from 'react';
import { Sword, Sparkles, Target, Eye, Shield, Flame, Heart, Zap, Check, ArrowLeft } from 'lucide-react';
import type { CharacterPreset, Attack } from '../db';

export type SelectionType = 'character' | 'attack';

export interface SelectionGridProps<T> {
  type: SelectionType;
  items: T[];
  selectedItems: T[];
  /** Функция для получения уникального ключа элемента */
  getKey: (item: T) => string | number;
  /** Функция рендеринга карточки элемента */
  renderCard: (item: T, isSelected: boolean, onClick: () => void) => React.ReactNode;
  /** Обработчик выбора элемента */
  onSelect: (item: T) => void;
  /** Заголовок компонента */
  title: string;
  /** Подзаголовок с пояснением */
  subtitle: string;
  /** Максимальное количество выбираемых элементов (0 для неограниченного) */
  maxSelection?: number;
  /** Требуется ли подтверждение выбора */
  requiresConfirmation?: boolean;
  /** Функция подтверждения выбора */
  onConfirm?: () => void;
  /** Сообщение о статусе выбора */
  selectionStatus?: string;
  /** Функция для возврата назад (если передана, отображается кнопка "Назад") */
  onBack?: () => void;
}

/**
 * Универсальный компонент для выбора элементов (персонажей или атак)
 */
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
    // Для выбора персонажа - всегда выбираем новый (заменяем предыдущий)
    if (type === 'character') {
      onSelect(item);
      return;
    }

    // Для выбора атак - переключаем выбор
    const isSelected = selectedItems.some(selected => getKey(selected) === getKey(item));
    
    if (isSelected) {
      // Удаляем из выбранных
      onSelect(item);
    } else {
      // Проверяем лимит выбора
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

// Вспомогательные функции для рендеринга карточек персонажей
// eslint-disable-next-line react-refresh/only-export-components
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

// Вспомогательные функции для рендеринга карточек атак
// eslint-disable-next-line react-refresh/only-export-components
export const renderAttackCard = (
  attack: Attack,
  isSelected: boolean,
  onClick: () => void
) => {
  const getAttackIcon = (attack: Attack) => {
    if (attack.damage < 0) return <Heart size={18} />; // исцеление
    if (attack.isUltimate) return <Zap size={18} />;
    return <Sword size={18} />;
  };

  const getDamageColor = (damage: number) => {
    if (damage < 0) return '#10b981'; // зеленый для исцеления
    if (damage > 50) return '#ef4444'; // красный для высокого урона
    return '#f59e0b'; // оранжевый для среднего урона
  };

  const getDamageLabel = (damage: number) => {
    if (damage < 0) return 'Исцеление';
    if (damage === 0) return 'Без урона';
    return 'Урон';
  };

  // Иконки эффектов
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

  return (
    <button
      className={`attack-card ${attack.isUltimate ? 'ultimate' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={effectTooltip}
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

// Утилитная функция для случайного выбора атак (вынесена из дублирующегося кода)
// eslint-disable-next-line react-refresh/only-export-components
export const selectRandomAttacks = (className: string, allAttacks: Attack[]): Attack[] => {
  const classAttacks = allAttacks.filter(a =>
    a.className === className && !a.isSecret
  );
  const normals = classAttacks.filter(a => !a.isUltimate);
  const ults = classAttacks.filter(a => a.isUltimate);

  // Выбираем 1 случайную ульту
  const selectedUlts = ults.length > 0 ? [ults[Math.floor(Math.random() * ults.length)]] : [];
  // Выбираем 3 случайные обычные атаки
  const selectedNormals = [...normals]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3 - selectedUlts.length);

  const selected = [...selectedNormals, ...selectedUlts];
  // Если всего атак меньше 4, добавим ещё обычных
  while (selected.length < 4 && normals.length > 0) {
    const extra = normals.find(n => !selected.includes(n));
    if (extra) selected.push(extra);
    else break;
  }

  return selected.map(a => ({ ...a }));
};

export default SelectionGrid;