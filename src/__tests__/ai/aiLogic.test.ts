import { describe, it, expect, vi } from 'vitest';
import { chooseAiAttack } from '../../ai/aiLogic';
import type { Character } from '../../types/game';
import type { Attack } from '../../db';
import { ALL_ATTACKS } from '../../db';

describe('aiLogic', () => {
  const createTestCharacter = (attacks: Attack[] = []): Character => ({
    id: 1,
    name: 'AI Warrior',
    hp: 100,
    max_hp: 100,
    energy: 100,
    max_energy: 100,
    resourceName: 'Ярость',
    resourceRules: undefined,
    attacks,
    effects: [],
    shields: 0,
    isStunned: false,
  });

  it('should return -1 when no attacks available', () => {
    const ai = createTestCharacter([]);
    const human = createTestCharacter();
    const result = chooseAiAttack(ai, human);
    expect(result).toBe(-1);
  });

  it('should return index of attack with highest score', () => {
    // Создадим моковые атаки с разным уроном
    const attacks: Attack[] = [
      { name: 'Weak', damage: 10, uses: 3, max_uses: 3, className: 'Warrior', energyGain: 10 },
      { name: 'Strong', damage: 30, uses: 2, max_uses: 2, className: 'Warrior', energyGain: 5 },
      { name: 'Heal', damage: -15, uses: 1, max_uses: 1, className: 'Warrior', energyGain: 0 },
    ];
    const ai = createTestCharacter(attacks);
    const human = createTestCharacter();
    const result = chooseAiAttack(ai, human);
    // Ожидаем, что выберет атаку с наибольшим уроном (индекс 1)
    expect(result).toBe(1);
  });

  it('should prioritize defense when AI health low', () => {
    const attacks: Attack[] = [
      { name: 'Attack', damage: 20, uses: 3, max_uses: 3, className: 'Warrior', energyGain: 10 },
      { name: 'Heal', damage: -25, uses: 2, max_uses: 2, className: 'Warrior', energyGain: 0 },
    ];
    const ai: Character = {
      ...createTestCharacter(attacks),
      hp: 20,
      max_hp: 100,
    };
    const human = createTestCharacter();
    const result = chooseAiAttack(ai, human);
    // При низком HP должна выбрать лечение (индекс 1)
    expect(result).toBe(1);
  });

  it('should consider ultimate attack energy cost', () => {
    const attacks: Attack[] = [
      { name: 'Ultimate', damage: 50, uses: 1, max_uses: 1, className: 'Warrior', isUltimate: true, energyCost: 90 },
      { name: 'Normal', damage: 20, uses: 3, max_uses: 3, className: 'Warrior', energyGain: 10 },
    ];
    const ai: Character = {
      ...createTestCharacter(attacks),
      energy: 50, // недостаточно для ультимейта
    };
    const human = createTestCharacter();
    const result = chooseAiAttack(ai, human);
    // Должен выбрать обычную атаку, потому что ультимейт недоступен
    expect(result).toBe(1);
  });

  it('should filter out attacks with zero uses', () => {
    const attacks: Attack[] = [
      { name: 'Used', damage: 10, uses: 0, max_uses: 3, className: 'Warrior', energyGain: 10 },
      { name: 'Available', damage: 15, uses: 2, max_uses: 3, className: 'Warrior', energyGain: 10 },
    ];
    const ai = createTestCharacter(attacks);
    const human = createTestCharacter();
    const result = chooseAiAttack(ai, human);
    // Должен выбрать доступную атаку (индекс 1)
    expect(result).toBe(1);
  });
});