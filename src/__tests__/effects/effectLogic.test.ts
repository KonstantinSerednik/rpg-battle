import { describe, it, expect } from 'vitest';
import { applyEffect, removeEffect, cleanse } from '../../effects/effectLogic';
import type { Character } from '../../types/game';
import { EFFECTS } from '../../data/effects';

describe('effectLogic', () => {
  const createTestCharacter = (): Character => ({
    id: 1,
    name: 'Test Warrior',
    hp: 100,
    max_hp: 100,
    energy: 100,
    max_energy: 100,
    resourceName: 'Ярость',
    resourceRules: undefined,
    attacks: [],
    effects: [],
    shields: 0,
    isStunned: false,
  });

  describe('applyEffect', () => {
    it('should add new effect when target has no such effect', () => {
      const character = createTestCharacter();
      const effect = EFFECTS.BLEEDING;
      const result = applyEffect(character, effect);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].id).toBe(effect.id);
      expect(result.effects[0].currentStacks).toBe(1);
    });

    it('should stack effect if maxStacks not reached', () => {
      const character: Character = {
        ...createTestCharacter(),
        effects: [{ ...EFFECTS.BLEEDING, currentStacks: 1, duration: 2 }],
      };
      const effect = EFFECTS.BLEEDING;
      const result = applyEffect(character, effect);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].currentStacks).toBe(2);
    });

    it('should replace effect if priority higher', () => {
      const lowPriorityEffect = { ...EFFECTS.BLEEDING, priority: 1 };
      const highPriorityEffect = { ...EFFECTS.BURNING, priority: 5 };
      const character: Character = {
        ...createTestCharacter(),
        effects: [lowPriorityEffect],
      };
      const result = applyEffect(character, highPriorityEffect);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].id).toBe(highPriorityEffect.id);
    });

    it('should not exceed MAX_EFFECTS', () => {
      const character: Character = {
        ...createTestCharacter(),
        effects: [
          EFFECTS.BLEEDING,
          EFFECTS.BURNING,
          EFFECTS.POISON,
          EFFECTS.VULNERABILITY,
          EFFECTS.SLOW,
        ],
      };
      const extraEffect = EFFECTS.STRENGTH;
      const result = applyEffect(character, extraEffect);

      // Максимум 5 эффектов, новый не должен добавиться
      expect(result.effects).toHaveLength(5);
    });
  });

  describe('removeEffect', () => {
    it('should remove effect by id', () => {
      const character: Character = {
        ...createTestCharacter(),
        effects: [EFFECTS.BLEEDING, EFFECTS.BURNING],
      };
      const result = removeEffect(character, EFFECTS.BLEEDING.id);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].id).toBe(EFFECTS.BURNING.id);
    });

    it('should do nothing if effect not found', () => {
      const character = createTestCharacter();
      const result = removeEffect(character, 'nonexistent');

      expect(result.effects).toHaveLength(0);
    });
  });

  describe('cleanse', () => {
    it('should remove all debuffs when no type specified', () => {
      const character: Character = {
        ...createTestCharacter(),
        effects: [
          EFFECTS.BLEEDING, // debuff
          EFFECTS.BURNING, // debuff
          EFFECTS.STRENGTH, // buff
          EFFECTS.PROTECTION, // buff
        ],
      };
      const result = cleanse(character);

      // Остаются только баффы
      expect(result.effects).toHaveLength(2);
      expect(result.effects.map(e => e.type)).toEqual(['buff', 'buff']);
    });

    it('should remove only effects of specified type', () => {
      const character: Character = {
        ...createTestCharacter(),
        effects: [
          EFFECTS.BLEEDING, // debuff
          EFFECTS.BURNING, // debuff
          EFFECTS.STUN, // control
        ],
      };
      const result = cleanse(character, 'debuff');

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].type).toBe('control');
    });
  });
});