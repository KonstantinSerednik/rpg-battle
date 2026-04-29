import type { Effect } from './types/game';
import { EFFECTS } from './data/effects';

export interface Attack {
  name: string;
  damage: number;    // Положительное - урон, отрицательное - исцеление
  uses: number;
  max_uses: number;
  className: string;
  isUltimate?: boolean;
  energyGain?: number; // Сколько ресурса дает обычная атака
  energyCost?: number; // Сколько ресурса тратит ульта
  appliedEffects?: Effect[]; // эффекты, накладываемые атакой
  effectChance?: number; // шанс применения (0-1)
}

export interface CharacterPreset {
  name: string;
  id: number;
  hp: number;
  max_hp: number;
  energy: number;
  max_energy: number;
  resourceName: string; // Название ресурса для интерфейса
  resourceRules?: {
    generation: 'passive' | 'onDamage' | 'onHeal' | 'onAttack';
    value: number;
    perTurn?: number;
  };
}

export const ALL_ATTACKS: Attack[] = [
  // === ВОИН (Ярость) ===
  { name: "Удар мечом", damage: 16, uses: 5, max_uses: 5, className: "Воин", energyGain: 20 },
  { name: "Удар щитом", damage: 12, uses: 4, max_uses: 4, className: "Воин", energyGain: 25, appliedEffects: [EFFECTS.STUN], effectChance: 0.3 },
  { name: "Рассечение", damage: 20, uses: 3, max_uses: 3, className: "Воин", energyGain: 15 },
  { name: "Регенерация", damage: -10, uses: 3, max_uses: 3, className: "Воин", energyGain: 30 },
  { name: "Рывок", damage: 14, uses: 6, max_uses: 6, className: "Воин", energyGain: 20 },
  { name: "Боевой клич", damage: -12, uses: 4, max_uses: 4, className: "Воин", energyGain: 30 },
  { name: "Сокрушительный удар", damage: 50, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 85 },
  { name: "Вихрь клинков", damage: 45, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 80 },
  { name: "Казнь", damage: 60, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 100 },
  { name: "Берсерк (+HP)", damage: -40, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 70 },

  // === МАГ (Мана) ===
  { name: "Ледяная стрела", damage: 14, uses: 5, max_uses: 5, className: "Маг", energyGain: 25 },
  { name: "Магический взрыв", damage: 22, uses: 3, max_uses: 3, className: "Маг", energyGain: 15 },
  { name: "Скверна", damage: 18, uses: 4, max_uses: 4, className: "Маг", energyGain: 20 },
  { name: "Прилив маны", damage: -8, uses: 3, max_uses: 3, className: "Маг", energyGain: 40 },
  { name: "Огненный шар", damage: 20, uses: 5, max_uses: 5, className: "Маг", energyGain: 15, appliedEffects: [EFFECTS.BURNING], effectChance: 0.5 },
  { name: "Магический щит", damage: -10, uses: 4, max_uses: 4, className: "Маг", energyGain: 25 },
  { name: "Арканная вспышка", damage: 60, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 90 },
  { name: "Метеорит", damage: 55, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 100 },
  { name: "Ледяная буря", damage: 40, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 80 },
  { name: "Аннигиляция", damage: 70, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 100 },

  // === ЛУЧНИК (Фокус) ===
  { name: "Быстрый выстрел", damage: 12, uses: 6, max_uses: 6, className: "Лучник", energyGain: 30 },
  { name: "Меткий глаз", damage: 19, uses: 4, max_uses: 4, className: "Лучник", energyGain: 20 },
  { name: "Ядовитая стрела", damage: 16, uses: 5, max_uses: 5, className: "Лучник", energyGain: 25, appliedEffects: [EFFECTS.BLEEDING], effectChance: 1.0 },
  { name: "Отскок (+HP)", damage: -6, uses: 3, max_uses: 3, className: "Лучник", energyGain: 35 },
  { name: "Снайперский выстрел", damage: 22, uses: 4, max_uses: 4, className: "Лучник", energyGain: 20 },
  { name: "Ловушка", damage: 10, uses: 6, max_uses: 6, className: "Лучник", energyGain: 25 },
  { name: "Шквал стрел", damage: 48, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 75 },
  { name: "Град стрел", damage: 42, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 80 },
  { name: "Золотая пуля", damage: 65, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 90 },
  { name: "Дух ястреба", damage: -35, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 70 },

  // === ЦЕЛИТЕЛЬ (Свет) ===
  { name: "Священная кара", damage: 15, uses: 5, max_uses: 5, className: "Целитель", energyGain: 25 },
  { name: "Быстрое исцеление", damage: -18, uses: 3, max_uses: 3, className: "Целитель", energyGain: 15, appliedEffects: [EFFECTS.REGENERATION], effectChance: 1.0 },
  { name: "Исповедь", damage: 21, uses: 4, max_uses: 4, className: "Целитель", energyGain: 20 },
  { name: "Молитва", damage: -14, uses: 4, max_uses: 4, className: "Целитель", energyGain: 30 },
  { name: "Благословение", damage: -20, uses: 5, max_uses: 5, className: "Целитель", energyGain: 20 },
  { name: "Священный огонь", damage: 18, uses: 6, max_uses: 6, className: "Целитель", energyGain: 25 },
  { name: "Воскрешение", damage: -80, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 100 },
  { name: "Божественный гимн", damage: -65, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 100 },
  { name: "Светлый луч", damage: 50, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 80 },
  { name: "Слияние (Бессмертие)", damage: -40, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 70 },

  // === АССАСИН (Энергия) ===
  { name: "Удар кинжалом", damage: 14, uses: 6, max_uses: 6, className: "Ассасин", energyGain: 30 },
  { name: "Отравленный нож", damage: 18, uses: 4, max_uses: 4, className: "Ассасин", energyGain: 25, appliedEffects: [EFFECTS.POISON], effectChance: 0.6 },
  { name: "Скрытность (+HP)", damage: -7, uses: 3, max_uses: 3, className: "Ассасин", energyGain: 35 },
  { name: "Кровавая атака", damage: 24, uses: 3, max_uses: 3, className: "Ассасин", energyGain: 15 },
  { name: "Теневой удар", damage: 16, uses: 7, max_uses: 7, className: "Ассасин", energyGain: 30 },
  { name: "Ядовитый туман", damage: 12, uses: 8, max_uses: 8, className: "Ассасин", energyGain: 20 },
  { name: "Убийственный импульс", damage: 70, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 95 },
  { name: "Смертельный танец", damage: 58, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 90 },
  { name: "Веер клинков", damage: 44, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 80 },
  { name: "Казнь теней", damage: 75, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 100 },

  // === ПАЛАДИН (Праведность) ===
  { name: "Молот праведника", damage: 17, uses: 5, max_uses: 5, className: "Паладин", energyGain: 20, appliedEffects: [EFFECTS.VULNERABILITY], effectChance: 0.4 },
  { name: "Вспышка света", damage: -16, uses: 4, max_uses: 4, className: "Паладин", energyGain: 25 },
  { name: "Удар воина Света", damage: 21, uses: 3, max_uses: 3, className: "Паладин", energyGain: 15 },
  { name: "Освящение (+HP)", damage: -12, uses: 3, max_uses: 3, className: "Паладин", energyGain: 30 },
  { name: "Священный молот", damage: 19, uses: 6, max_uses: 6, className: "Паладин", energyGain: 20 },
  { name: "Искупление", damage: -15, uses: 5, max_uses: 5, className: "Паладин", energyGain: 25 },
  { name: "Небесная кара", damage: 55, uses: 1, max_uses: 1, className: "Паладин", isUltimate: true, energyCost: 95 },
  { name: "Гнев карателя", damage: 52, uses: 1, max_uses: 1, className: "Паладин", isUltimate: true, energyCost: 100 },
  { name: "Щит праведности", damage: -55, uses: 1, max_uses: 1, className: "Паладин", isUltimate: true, energyCost: 80 },
  { name: "Божественная буря", damage: 45, uses: 1, max_uses: 1, className: "Паладин", isUltimate: true, energyCost: 90 },

  // === ДРУИД (Природа) ===
  { name: "Удар лозой", damage: 15, uses: 6, max_uses: 6, className: "Друид", energyGain: 25, appliedEffects: [EFFECTS.SLOW], effectChance: 0.5 },
  { name: "Омоложение (+HP)", damage: -14, uses: 4, max_uses: 4, className: "Друид", energyGain: 30 },
  { name: "Шторм", damage: 20, uses: 3, max_uses: 3, className: "Друид", energyGain: 15 },
  { name: "Гнев корней", damage: 17, uses: 5, max_uses: 5, className: "Друид", energyGain: 20 },
  { name: "Корни природы", damage: 13, uses: 8, max_uses: 8, className: "Друид", energyGain: 25 },
  { name: "Целительный дождь", damage: -16, uses: 5, max_uses: 5, className: "Друид", energyGain: 30 },
  { name: "Гнев природы", damage: 58, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 85 },
  { name: "Облик Медведя", damage: 48, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 90 },
  { name: "Спокойствие", damage: -60, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 80 },
  { name: "Зов джунглей", damage: 62, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 100 },

  // === АЛХИМИК (Энергия) ===
  { name: "Кислотная бомба", damage: 19, uses: 4, max_uses: 4, className: "Алхимик", energyGain: 15, appliedEffects: [EFFECTS.VULNERABILITY], effectChance: 0.5 },
  { name: "Ртутный взрыв", damage: 25, uses: 3, max_uses: 3, className: "Алхимик", energyGain: 10 },
  { name: "Эликсир жизни", damage: -18, uses: 3, max_uses: 3, className: "Алхимик", energyGain: 25 },
  { name: "Токсичный газ", damage: 15, uses: 5, max_uses: 5, className: "Алхимик", energyGain: 20 },
  { name: "Взрывная смесь", damage: 22, uses: 5, max_uses: 5, className: "Алхимик", energyGain: 15 },
  { name: "Эликсир силы", damage: -12, uses: 6, max_uses: 6, className: "Алхимик", energyGain: 25 },
  { name: "Трансмутация", damage: 65, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 95 },
  { name: "Философский камень", damage: -100, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 100 },
  { name: "Бомба хаоса", damage: 55, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 90 },
  { name: "Склянка скверны", damage: 40, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 80 },
];

export const PRESETS: CharacterPreset[] = [
  { name: "Воин", id: 1, hp: 130, max_hp: 130, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Маг", id: 2, hp: 90, max_hp: 90, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Лучник", id: 3, hp: 100, max_hp: 100, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Целитель", id: 4, hp: 110, max_hp: 110, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Ассасин", id: 5, hp: 80, max_hp: 80, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Паладин", id: 6, hp: 150, max_hp: 150, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Друид", id: 7, hp: 115, max_hp: 115, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Алхимик", id: 8, hp: 105, max_hp: 105, energy: 0, max_energy: 100, resourceName: "Энергия" },
];