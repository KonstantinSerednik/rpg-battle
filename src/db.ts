import type { Effect } from './types/game';
import { EFFECTS } from './data/effects';

export interface Attack {
  name: string;
  damage: number;    // Положительное - урон, отрицательное - исцеление
  uses: number;
  max_uses: number;
  className: string;
  isUltimate?: boolean;
  isSecret?: boolean; // Секретная атака, доступная только при выполнении условий
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
  { name: "Удар мечом", damage: 19, uses: 5, max_uses: 5, className: "Воин", energyGain: 20, appliedEffects: [EFFECTS.BLEEDING], effectChance: 0.3 },
  { name: "Удар щитом", damage: 14, uses: 4, max_uses: 4, className: "Воин", energyGain: 25, appliedEffects: [EFFECTS.STUN], effectChance: 0.5 },
  { name: "Рассечение", damage: 24, uses: 3, max_uses: 3, className: "Воин", energyGain: 15 },
  { name: "Регенерация", damage: -12, uses: 3, max_uses: 3, className: "Воин", energyGain: 30, appliedEffects: [EFFECTS.REGENERATION], effectChance: 1.0 },
  { name: "Рывок", damage: 17, uses: 6, max_uses: 6, className: "Воин", energyGain: 50 },
  { name: "Боевой клич", damage: -14, uses: 4, max_uses: 4, className: "Воин", energyGain: 20, appliedEffects: [EFFECTS.STRENGTH], effectChance: 1.0 },
  { name: "Размашистый удар", damage: 21, uses: 4, max_uses: 4, className: "Воин", energyGain: 22, appliedEffects: [EFFECTS.VULNERABILITY], effectChance: 0.4 },
  { name: "Пронзающий удар", damage: 26, uses: 3, max_uses: 3, className: "Воин", energyGain: 18 },
  { name: "Защитная стойка", damage: -18, uses: 3, max_uses: 3, className: "Воин", energyGain: 35, appliedEffects: [EFFECTS.PROTECTION], effectChance: 1.0 },
  { name: "Сокрушительный удар", damage: 66, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 85, appliedEffects: [EFFECTS.STUN], effectChance: 1.0 },
  { name: "Вихрь клинков", damage: 50, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 80 },
  { name: "Казнь", damage: 66, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 100, appliedEffects: [EFFECTS.VULNERABILITY], effectChance: 0.5 },
  { name: "Берсерк", damage: -60, uses: 1, max_uses: 1, className: "Воин", isUltimate: true, energyCost: 70, appliedEffects: [EFFECTS.BERSERK], effectChance: 1.0 },

  // === МАГ (Мана) ===
  { name: "Ледяная стрела", damage: 17, uses: 3, max_uses: 3, className: "Маг", energyGain: 25, appliedEffects: [EFFECTS.SLOW], effectChance: 0.45 },
  { name: "Магический взрыв", damage: 26, uses: 3, max_uses: 3, className: "Маг", energyGain: 15, appliedEffects: [EFFECTS.VULNERABILITY], effectChance: 0.5 },
  { name: "Скверна", damage: 21, uses: 4, max_uses: 4, className: "Маг", energyGain: 20, appliedEffects: [EFFECTS.DEVASTATION], effectChance: 0.6 },
  { name: "Прилив маны", damage: -21, uses: 2, max_uses: 2, className: "Маг", energyGain: 50 },
  { name: "Огненный шар", damage: 35, uses: 3, max_uses: 3, className: "Маг", energyGain: 12, appliedEffects: [EFFECTS.BURNING], effectChance: 0.5 },
  { name: "Магический щит", damage: -12, uses: 3, max_uses: 3, className: "Маг", energyGain: 25, appliedEffects: [EFFECTS.SHIELD], effectChance: 1.0 },
  { name: "Электрическая цепь", damage: 24, uses: 4, max_uses: 4, className: "Маг", energyGain: 20 },
  { name: "Ледяная тюрьма", damage: 21, uses: 3, max_uses: 3, className: "Маг", energyGain: 22, appliedEffects: [EFFECTS.SLOW], effectChance: 0.8 },
  { name: "Арканный выстрел", damage: 46, uses: 1, max_uses: 1, className: "Маг", energyGain: 40 },
  { name: "Арканная вспышка", damage: 66, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 80, appliedEffects: [EFFECTS.ARCANE], effectChance: 1.0 },
  { name: "Метеорит", damage: 50, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 100, appliedEffects: [EFFECTS.INFINITE_BURNING], effectChance: 1.0 },
  { name: "Ледяная буря", damage: 50, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 60, appliedEffects: [EFFECTS.SLOW], effectChance: 0.8 },
  { name: "Аннигиляция", damage: 77, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 100 },
  { name: "Волшебный вихрь", damage: 61, uses: 1, max_uses: 1, className: "Маг", isUltimate: true, energyCost: 40, appliedEffects: [EFFECTS.SHIELD], effectChance: 1.0 },

  // === ЛУЧНИК (Фокус) ===
  { name: "Быстрый выстрел", damage: 17, uses: 5, max_uses: 5, className: "Лучник", energyGain: 30, appliedEffects: [EFFECTS.VULNERABILITY], effectChance: 0.35 },
  { name: "Меткий глаз", damage: 24, uses: 2, max_uses: 2, className: "Лучник", energyGain: 20, appliedEffects: [EFFECTS.STRENGTH], effectChance: 1.0 },
  { name: "Ядовитая стрела", damage: 19, uses: 3, max_uses: 3, className: "Лучник", energyGain: 18, appliedEffects: [EFFECTS.POISON], effectChance: 1.0 },
  { name: "Отскок", damage: -23, uses: 3, max_uses: 3, className: "Лучник", energyGain: 30 },
  { name: "Снайперский выстрел", damage: 29, uses: 2, max_uses: 2, className: "Лучник", energyGain: 35 },
  { name: "Ловушка", damage: 18, uses: 4, max_uses: 4, className: "Лучник", energyGain: 25, appliedEffects: [EFFECTS.SLOW], effectChance: 0.6 },
  { name: "Огненная стрела", damage: 35, uses: 3, max_uses: 3, className: "Лучник", energyGain: 20 },
  { name: "Проникающий выстрел", damage: 23, uses: 2, max_uses: 2, className: "Лучник", energyGain: 20, appliedEffects: [EFFECTS.STUN], effectChance: 1.0 },
  { name: "Уклонение", damage: -40, uses: 1, max_uses: 1, className: "Лучник", energyGain: 4 },
  { name: "Шквал стрел", damage: 55, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 60 },
  { name: "Град стрел", damage: 46, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 70 },
  { name: "Золотая пуля", damage: 72, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 90, appliedEffects: [EFFECTS.BLEEDING], effectChance: 0.7 },
  { name: "Дух ястреба", damage: -39, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 40, appliedEffects: [EFFECTS.WINGED_ALLY], effectChance: 1.0 },
  { name: "Стрела судьбы", damage: 72, uses: 1, max_uses: 1, className: "Лучник", isUltimate: true, energyCost: 65, appliedEffects: [EFFECTS.STUN], effectChance: 0.7 },

  // === ЦЕЛИТЕЛЬ (Свет) ===
  { name: "Священная кара", damage: 20, uses: 4, max_uses: 4, className: "Целитель", energyGain: 20 },
  { name: "Быстрое исцеление", damage: -18, uses: 3, max_uses: 3, className: "Целитель", energyGain: 15 },
  { name: "Исповедь", damage: 26, uses: 3, max_uses: 3, className: "Целитель", energyGain: 20, appliedEffects: [EFFECTS.REGENERATION], effectChance: 1.0 },
  { name: "Молитва", damage: -23, uses: 5, max_uses: 5, className: "Целитель", energyGain: 30, appliedEffects: [EFFECTS.PROTECTION], effectChance: 1.0 },
  // Благословение удалено
  { name: "Священный огонь", damage: 23, uses: 4, max_uses: 4, className: "Целитель", energyGain: 30, appliedEffects: [EFFECTS.BURNING], effectChance: 0.5 },
  { name: "Очищение", damage: -40, uses: 2, max_uses: 2, className: "Целитель", energyGain: 35, appliedEffects: [EFFECTS.CLEANSE], effectChance: 0.65 },
  { name: "Божественный луч", damage: 0, uses: 2, max_uses: 2, className: "Целитель", energyGain: 25 }, // урон равен энергии - требует специальной логики
  { name: "Небесный щит", damage: -35, uses: 2, max_uses: 2, className: "Целитель", energyGain: 40 },
  { name: "Божественный щит", damage: -40, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 0, appliedEffects: [EFFECTS.DIVINE_SHIELD], effectChance: 1.0 },
  { name: "Воскрешение", damage: -39, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 40, appliedEffects: [EFFECTS.RESURRECTION], effectChance: 1.0 },
  { name: "Божественный гимн", damage: -77, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 65 },
  // Слияние и Светлый луч удалены
  { name: "Астральный луч", damage: 77, uses: 1, max_uses: 1, className: "Целитель", isUltimate: true, energyCost: 75, appliedEffects: [EFFECTS.STUN], effectChance: 0.6 },

  // === АССАСИН (Энергия) ===
  { name: "Удар кинжалом", damage: 12, uses: 4, max_uses: 4, className: "Ассасин", energyGain: 25, appliedEffects: [EFFECTS.ASSASSIN_BLEEDING], effectChance: 0.9 },
  { name: "Отравленный нож", damage: 12, uses: 4, max_uses: 4, className: "Ассасин", energyGain: 25, appliedEffects: [EFFECTS.ASSASSIN_POISON], effectChance: 0.9 },
  { name: "Скрытность", damage: -23, uses: 2, max_uses: 2, className: "Ассасин", energyGain: 40, appliedEffects: [EFFECTS.ASSASSIN_POISON, EFFECTS.ASSASSIN_BLEEDING], effectChance: 1.0 },
  { name: "Кровавая атака", damage: 16, uses: 2, max_uses: 2, className: "Ассасин", energyGain: 20, appliedEffects: [EFFECTS.ASSASSIN_BLEEDING], effectChance: 1.0 },
  { name: "Теневой удар", damage: 28, uses: 7, max_uses: 7, className: "Ассасин", energyGain: 35, appliedEffects: [EFFECTS.INVISIBILITY], effectChance: 0.7 },
  { name: "Ядовитый туман", damage: 12, uses: 5, max_uses: 5, className: "Ассасин", energyGain: 25, appliedEffects: [EFFECTS.ASSASSIN_POISON], effectChance: 0.9 },
  // Смертельный удар, Убийственный импульс, Бросок сюрикена удалены
  { name: "Отравленный клинок", damage: 18, uses: 2, max_uses: 2, className: "Ассасин", energyGain: 22, appliedEffects: [EFFECTS.ASSASSIN_POISON], effectChance: 1.0 },
  { name: "Смертельный танец", damage: 55, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 60 },
  { name: "Веер клинков", damage: 66, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 80 },
  { name: "Казнь теней", damage: 88, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 100, appliedEffects: [EFFECTS.INVISIBILITY], effectChance: 1.0 },
  { name: "Теневой клинок", damage: 55, uses: 1, max_uses: 1, className: "Ассасин", isUltimate: true, energyCost: 70, appliedEffects: [EFFECTS.INVISIBILITY], effectChance: 1.0 },

  // === ПАЛАДИН (Праведность) ===
  { name: "Молот праведника", damage: 16, uses: 3, max_uses: 3, className: "Паладин", energyGain: 22, appliedEffects: [{ ...EFFECTS.SHIELD, shieldAmount: 15 }], effectChance: 1.0 },
  { name: "Вспышка света", damage: -29, uses: 3, max_uses: 3, className: "Паладин", energyGain: 25, appliedEffects: [{ ...EFFECTS.SHIELD, shieldAmount: 20 }], effectChance: 1.0 },
  { name: "Удар воина Света", damage: 18, uses: 3, max_uses: 3, className: "Паладин", energyGain: 15, appliedEffects: [EFFECTS.STRENGTH], effectChance: 0.4 },
  { name: "Освящение", damage: -21, uses: 3, max_uses: 3, className: "Паладин", energyGain: 25, appliedEffects: [{ ...EFFECTS.SHIELD, shieldAmount: 30 }], effectChance: 1.0 },
  { name: "Священный молот", damage: 22, uses: 2, max_uses: 2, className: "Паладин", energyGain: 25 },
  { name: "Искупление", damage: -29, uses: 3, max_uses: 3, className: "Паладин", energyGain: 25, appliedEffects: [{ ...EFFECTS.REFLECT, reflectPercent: 0.4, duration: 1 }], effectChance: 1.0 },
  { name: "Божественный удар", damage: 32, uses: 1, max_uses: 1, className: "Паладин", energyGain: 15 },
  { name: "Щит веры", damage: -18, uses: 2, max_uses: 2, className: "Паладин", energyGain: 35, appliedEffects: [{ ...EFFECTS.SHIELD, shieldAmount: 20 }], effectChance: 1.0 },
  // Кара небес удалена
  { name: "Небесная кара", damage: 55, uses: 1, max_uses: 1, className: "Паладин", isUltimate: true, energyCost: 50, appliedEffects: [EFFECTS.STUN], effectChance: 0.85 },
  // Гнев Карателя удален
  { name: "Щит праведности", damage: -55, uses: 1, max_uses: 1, className: "Паладин", isUltimate: true, energyCost: 40, appliedEffects: [EFFECTS.DIVINE_SHIELD], effectChance: 1.0 },
  { name: "Божественная буря", damage: 99, uses: 1, max_uses: 1, className: "Паладин", isUltimate: true, energyCost: 80 },
  // Светопреставление удалено

  // === ДРУИД (Природа) ===
  { name: "Удар лозой", damage: 17, uses: 6, max_uses: 6, className: "Друид", energyGain: 25, appliedEffects: [EFFECTS.SLOW], effectChance: 0.5 },
  { name: "Омоложение", damage: -23, uses: 3, max_uses: 3, className: "Друид", energyGain: 30 },
  { name: "Шторм", damage: 40, uses: 2, max_uses: 2, className: "Друид", energyGain: 23, appliedEffects: [EFFECTS.STUN], effectChance: 0.6 },
  { name: "Гнев корней", damage: 35, uses: 3, max_uses: 3, className: "Друид", energyGain: 20 },
  { name: "Корни природы", damage: 23, uses: 4, max_uses: 4, className: "Друид", energyGain: 25 },
  { name: "Целительный дождь", damage: -23, uses: 3, max_uses: 3, className: "Друид", energyGain: 30, appliedEffects: [EFFECTS.REGENERATION], effectChance: 1.0 },
  { name: "Призыв зверя", damage: 0, uses: 2, max_uses: 2, className: "Друид", energyGain: 35 }, // случайный урон - требует специальной логики
  { name: "Каменная кожа", damage: -23, uses: 3, max_uses: 3, className: "Друид", energyGain: 28 },
  { name: "Ветряной порыв", damage: 40, uses: 2, max_uses: 2, className: "Друид", energyGain: 24 },
  { name: "Гнев природы", damage: 72, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 60 },
  { name: "Зов джунглей", damage: 88, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 70 },
  { name: "Извержение", damage: 50, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 60, appliedEffects: [EFFECTS.BURNING], effectChance: 1.0 },
  { name: "Облик Медведя", damage: 0, uses: 1, max_uses: 1, className: "Друид", isUltimate: true, energyCost: 90, appliedEffects: [EFFECTS.BEAR_FORM], effectChance: 1.0 },

  // === АЛХИМИК (Энергия) ===
  { name: "Кислотная бомба", damage: 23, uses: 3, max_uses: 3, className: "Алхимик", energyGain: 18, appliedEffects: [EFFECTS.CORROSION], effectChance: 1.0 },
  { name: "Ртутный взрыв", damage: 29, uses: 3, max_uses: 3, className: "Алхимик", energyGain: 16, appliedEffects: [EFFECTS.CORROSION], effectChance: 1.0 },
  { name: "Эликсир жизни", damage: -18, uses: 3, max_uses: 3, className: "Алхимик", energyGain: 25 },
  { name: "Токсичный газ", damage: 17, uses: 5, max_uses: 5, className: "Алхимик", energyGain: 20, appliedEffects: [EFFECTS.CORROSION], effectChance: 0.7 },
  { name: "Взрывная смесь", damage: 26, uses: 4, max_uses: 4, className: "Алхимик", energyGain: 20, appliedEffects: [EFFECTS.CORROSION], effectChance: 0.5 },
  { name: "Эликсир силы", damage: -14, uses: 4, max_uses: 4, className: "Алхимик", energyGain: 25, appliedEffects: [EFFECTS.STRENGTH], effectChance: 0.8 },
  { name: "Замедляющий газ", damage: 20, uses: 4, max_uses: 4, className: "Алхимик", energyGain: 25, appliedEffects: [EFFECTS.CORROSION], effectChance: 1.0 },
  { name: "Кислотный дождь", damage: 23, uses: 4, max_uses: 4, className: "Алхимик", energyGain: 22, appliedEffects: [EFFECTS.CORROSION], effectChance: 1.0 },
  // Взрывчатая смесь удалена
  { name: "Рубедо", damage: 88, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 90 },
  { name: "Альбедо", damage: -110, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 70, appliedEffects: [EFFECTS.PROTECTION], effectChance: 1.0 },
  { name: "Цитринитас", damage: 55, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 50, appliedEffects: [EFFECTS.REGENERATION], effectChance: 1.0 },
  { name: "Склянка скверны", damage: 55, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 40, appliedEffects: [EFFECTS.DEVASTATION], effectChance: 1.0 },
  { name: "Алхимический взрыв", damage: 39, uses: 1, max_uses: 1, className: "Алхимик", isUltimate: true, energyCost: 40, appliedEffects: [EFFECTS.POISON], effectChance: 1.0 },
  { name: "Удар топором Берсерка", damage: 45, uses: 99, max_uses: 99, className: "Воин", energyGain: 20, isSecret: true },
  { name: "Удар медвежьей лапы", damage: 45, uses: 99, max_uses: 99, className: "Друид", energyGain: 20, isSecret: true },
  { name: "Укуси меня пчела", damage: -45, uses: 99, max_uses: 99, className: "Друид", energyGain: 20, isSecret: true },
];

/**
 * Возвращает все секретные атаки для указанного класса
 */
export function getSecretAttacks(className: string): Attack[] {
  return ALL_ATTACKS.filter(a => a.className === className && a.isSecret);
}

export const PRESETS: CharacterPreset[] = [
  { name: "Воин", id: 1, hp: 200, max_hp: 200, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Маг", id: 2, hp: 140, max_hp: 140, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Лучник", id: 3, hp: 155, max_hp: 155, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Целитель", id: 4, hp: 170, max_hp: 170, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Ассасин", id: 5, hp: 125, max_hp: 125, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Паладин", id: 6, hp: 200, max_hp: 200, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Друид", id: 7, hp: 175, max_hp: 175, energy: 0, max_energy: 100, resourceName: "Энергия" },
  { name: "Алхимик", id: 8, hp: 160, max_hp: 160, energy: 0, max_energy: 100, resourceName: "Энергия" },
];