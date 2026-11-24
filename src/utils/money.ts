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
