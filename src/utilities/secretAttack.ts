import type { Character } from '../types/game';
import type { Attack } from '../db';

/**
 * Проверяет, можно ли использовать секретную атаку.
 * Секретная атака доступна, если:
 * - HP ниже 30% ИЛИ
 * - есть соответствующий эффект (BERSERK для воина, BEAR_FORM для друида)
 */
export function canUseSecretAttack(player: Character, attack: Attack): boolean {
  if (!attack.isSecret) return true;
  const hpRatio = player.hp / player.max_hp;
  if (hpRatio < 0.3) return true;
  const hasBerserk = player.effects.some(e => e.id === 'berserk');
  const hasBearForm = player.effects.some(e => e.id === 'bear_form');
  if (player.name === 'Воин' && hasBerserk) return true;
  if (player.name === 'Друид' && hasBearForm) return true;
  return false;
}