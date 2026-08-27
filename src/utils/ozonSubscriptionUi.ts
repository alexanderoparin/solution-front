import type { CabinetDto } from '../types/api'
import { formatCabinetAdminDate } from './cabinetAdminUtils'

/** Цвет Tag для эффективного уровня Analytics Seller API. */
export type OzonAnalyticsTagColor = 'purple' | 'gold' | 'default' | 'orange'

/**
 * Название подписки Ozon из seller/info (как в ЛК продавца).
 */
export function getOzonSellerSubscriptionLabel(cab: CabinetDto): string | null {
  if (cab.ozonSubscriptionIsPremium === false || cab.ozonSubscriptionType === 'UNSPECIFIED') {
    return 'Без Premium'
  }
  return cab.ozonSubscriptionTypeDisplayName ?? cab.ozonSubscriptionType ?? null
}

/**
 * Эффективный уровень Analytics Seller API для Clicki (по probe analytics/data).
 * Premium в ЛК Ozon не даёт Seller API analytics — только Premium Plus и выше.
 */
export function getOzonAnalyticsApiTierLabel(cab: CabinetDto): string {
  if (cab.ozonAnalyticsFunnelAvailable === true) {
    if (cab.ozonSubscriptionType === 'PREMIUM_PRO') {
      return 'Premium Pro'
    }
    return 'Premium Plus'
  }
  if (cab.ozonSubscriptionIsPremium === false || cab.ozonSubscriptionType === 'UNSPECIFIED') {
    return 'Без Premium'
  }
  if (cab.ozonAnalyticsFunnelAvailable === false) {
    return 'Базовый'
  }
  return 'Не проверен'
}

export function getOzonAnalyticsApiTierColor(cab: CabinetDto): OzonAnalyticsTagColor {
  if (cab.ozonAnalyticsFunnelAvailable === true) {
    return cab.ozonSubscriptionType === 'PREMIUM_PRO' ? 'purple' : 'purple'
  }
  if (cab.ozonSubscriptionIsPremium === false || cab.ozonSubscriptionType === 'UNSPECIFIED') {
    return 'default'
  }
  if (cab.ozonAnalyticsFunnelAvailable === false) {
    return 'orange'
  }
  return 'default'
}

export function buildOzonSubscriptionTooltip(cab: CabinetDto): string {
  const sellerLabel = getOzonSellerSubscriptionLabel(cab) ?? '—'
  const apiLabel = getOzonAnalyticsApiTierLabel(cab)
  const checkedAt = formatCabinetAdminDate(cab.ozonSubscriptionCheckedAt ?? null)

  const lines = [
    `Подписка Ozon (seller/info): ${sellerLabel}`,
    `Analytics Seller API: ${apiLabel}`,
  ]

  if (cab.ozonAnalyticsFunnelAvailable === true) {
    lines.push('Доступны переходы, корзина, конверсии через Seller API.')
  } else if (cab.ozonAnalyticsFunnelAvailable === false) {
    lines.push('Только заказы и выручка. Premium в ЛК не включает Seller API analytics — нужен Premium Plus.')
  } else {
    lines.push('Analytics API ещё не проверялся (запустите обновление).')
  }

  if (checkedAt !== '—') {
    lines.push(`Проверено: ${checkedAt}`)
  }

  return lines.join(' · ')
}
