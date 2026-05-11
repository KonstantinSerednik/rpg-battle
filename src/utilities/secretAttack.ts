import type { Character } from '../types/game';
import type { Attack } from '../db';

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