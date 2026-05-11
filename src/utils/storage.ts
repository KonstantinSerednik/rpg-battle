/**
 * Безопасные методы работы с localStorage, которые обрабатывают возможные ошибки.
 * В случае недоступности localStorage используется fallback-значение и вывод предупреждения в консоль.
 */

type StorageKey = 'theme';

export function getSafe(key: StorageKey, defaultValue: string | null = null): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`localStorage недоступен при чтении ключа "${key}":`, error);
    return defaultValue;
  }
}

export function setSafe(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`localStorage недоступен при записи ключа "${key}":`, error);
  }
}

export function removeSafe(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`localStorage недоступен при удалении ключа "${key}":`, error);
  }
}

export function clearSafe(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.warn('localStorage недоступен при очистке:', error);
  }
}