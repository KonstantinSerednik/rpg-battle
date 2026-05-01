/**
 * Обёртка для console.log, которая ничего не выводит в production-среде.
 * Используется для отладочных сообщений.
 */
export function log(...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}