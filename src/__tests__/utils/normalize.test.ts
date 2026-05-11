import { describe, it, expect } from 'vitest';
import {
  roundToInteger,
  roundToDecimal,
  normalizeHp,
  normalizeEnergy,
  normalizeShields,
  normalizeMultiplier,
  normalizePercentage,
  normalizeCharacter,
} from '../../utils/normalize';
import type { Character } from '../../types/game';
import { EFFECTS } from '../../data/effects';

describe('normalize utilities', () => {
  describe('roundToInteger', () => {
    it('should round positive numbers', () => {
      expect(roundToInteger(3.4)).toBe(3);
      expect(roundToInteger(3.5)).toBe(4);
      expect(roundToInteger(0)).toBe(0);
    });

    it('should round negative numbers', () => {
      expect(roundToInteger(-2.7)).toBe(-3);
      expect(roundToInteger(-2.2)).toBe(-2);
    });
  });

  describe('roundToDecimal', () => {
    it('should round to specified decimal places', () => {
      expect(roundToDecimal(3.14159, 2)).toBe(3.14);
      expect(roundToDecimal(3.145, 2)).toBe(3.15);
      expect(roundToDecimal(1.005, 2)).toBe(1.01);
    });

    it('should default to 2 decimal places', () => {
      expect(roundToDecimal(2.3456)).toBe(2.35);
    });
  });

  describe('normalizeHp', () => {
    it('should clamp hp between 0 and maxHp', () => {
      expect(normalizeHp(50, 100)).toBe(50);
      expect(normalizeHp(-10, 100)).toBe(0);
      expect(normalizeHp(150, 100)).toBe(100);
    });

    it('should round hp to integer', () => {
      expect(normalizeHp(50.7, 100)).toBe(51);
      expect(normalizeHp(50.2, 100)).toBe(50);
    });
  });

  describe('normalizeEnergy', () => {
    it('should clamp energy between 0 and 100', () => {
      expect(normalizeEnergy(50)).toBe(50);
      expect(normalizeEnergy(-5)).toBe(0);
      expect(normalizeEnergy(150)).toBe(100);
    });

    it('should round energy to integer', () => {
      expect(normalizeEnergy(75.8)).toBe(76);
      expect(normalizeEnergy(75.2)).toBe(75);
    });
  });

  describe('normalizeShields', () => {
    it('should ensure shields are non-negative', () => {
      expect(normalizeShields(30)).toBe(30);
      expect(normalizeShields(-5)).toBe(0);
    });

    it('should round shields to integer', () => {
      expect(normalizeShields(25.9)).toBe(26);
      expect(normalizeShields(25.1)).toBe(25);
    });
  });

  describe('normalizeMultiplier', () => {
    it('should round multiplier to 2 decimal places', () => {
      expect(normalizeMultiplier(1.234)).toBe(1.23);
      expect(normalizeMultiplier(2.567)).toBe(2.57);
    });
  });

  describe('normalizePercentage', () => {
    it('should round percentage to 3 decimal places', () => {
      expect(normalizePercentage(0.12345)).toBe(0.123);
      expect(normalizePercentage(99.9999)).toBe(100.0);
    });
  });

  describe('normalizeCharacter', () => {
    it('should normalize all character fields', () => {
      const character: Character = {
        id: 1,
        name: 'Warrior',
        hp: 75.3,
        max_hp: 100,
        energy: 80.7,
        max_energy: 100,
        resourceName: 'Ярость',
        resourceRules: undefined,
        attacks: [],
        effects: [
          {
            ...EFFECTS.BLEEDING,
            duration: 2.4,
            currentStacks: 1.8,
            modifiers: {
              damageMultiplier: 1.15,
              damageReduction: 0.2,
            },
          },
        ],
        shields: 25.9,
        isStunned: false,
      };

      const normalized = normalizeCharacter(character);

      expect(normalized.hp).toBe(75); // rounded
      expect(normalized.energy).toBe(81); // rounded and clamped
      expect(normalized.shields).toBe(26); // rounded
      expect(normalized.effects[0].duration).toBe(2);
      expect(normalized.effects[0].currentStacks).toBe(2);
      expect(normalized.effects[0].modifiers?.damageMultiplier).toBe(1.15);
    });
  });
});