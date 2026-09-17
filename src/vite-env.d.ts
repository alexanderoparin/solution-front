/// <reference types="vite/client" />

interface Window {
  /** Очередь ecommerce / dataLayer для Яндекс.Метрики. */
  dataLayer?: unknown[]
  /** Функция счётчика Яндекс.Метрики. */
  ym?: (counterId: number, method: string, ...args: unknown[]) => void
}

