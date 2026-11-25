/** Символы/коды для подписи денежных сумм в UI. */
const CURRENCY_SUFFIX: Record<string, string> = {
  RUB: '₽',
  BYN: 'Br',
  KGS: 'сом',
  CNY: '¥',
  UZS: 'сум',
  KZT: '₸',
  USD: '$',
  EUR: '€',
}

/**
 * Нормализует ISO 4217; пустое → RUB.
 */
export function normalizeCurrencyCode(currency?: string | null): string {
  if (currency == null || currency.trim() === '') {
    return 'RUB'
  }
  return currency.trim().toUpperCase()
}

/**
 * Суффикс валюты для подписей колонок («руб», «Br» и т.п.).
 */
export function currencyLabel(currency?: string | null): string {
  const code = normalizeCurrencyCode(currency)
  if (code === 'RUB') {
    return 'руб'
  }
  return CURRENCY_SUFFIX[code] ?? code
}

/**
 * Символ валюты для подписей полей («₽», «¥» и т.п.).
 */
export function currencySymbol(currency?: string | null): string {
  const code = normalizeCurrencyCode(currency)
  return CURRENCY_SUFFIX[code] ?? code
}

/**
 * Минимальная сумма пополнения бюджета РК на Wildberries в валюте кабинета.
 */
export function minTopUpAmount(currency?: string | null): number {
  return normalizeCurrencyCode(currency) === 'CNY' ? 10 : 1000
}

/**
 * Шаг суммы пополнения в форме биддера.
 */
export function topUpAmountStep(currency?: string | null): number {
  return normalizeCurrencyCode(currency) === 'CNY' ? 1 : 100
}

/**
 * Форматирует денежную сумму с символом валюты кабинета.
 */
export function formatMoney(
  value: number | null | undefined,
  currency?: string | null,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  if (value == null || Number.isNaN(value)) {
    return '—'
  }
  const code = normalizeCurrencyCode(currency)
  const formatted = value.toLocaleString('ru-RU', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  })
  const suffix = CURRENCY_SUFFIX[code] ?? code
  return `${formatted} ${suffix}`
}
