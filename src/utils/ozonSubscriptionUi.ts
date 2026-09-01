import type { CabinetDto } from '../types/api'
import { formatCabinetAdminDate } from './cabinetAdminUtils'

/** Цвет Tag для подписки Ozon Seller. */
export type OzonSubscriptionTagColor = 'purple' | 'gold' | 'default' | 'orange'

/**
 * Название подписки Ozon (seller/info: type_ или консервативно).
 */
export function getOzonSellerSubscriptionLabel(cab: CabinetDto): string | null {
  if (cab.ozonSubscriptionType == null && cab.ozonSubscriptionIsPremium == null) {
    return null
  }
  if (cab.ozonSubscriptionType === 'INCONCLUSIVE') {
    return cab.ozonSubscriptionTypeDisplayName ?? 'Не определено'
  }
  if (cab.ozonSubscriptionIsPremium === false || cab.ozonSubscriptionType === 'UNSPECIFIED') {
    return 'Без Premium'
  }
  return cab.ozonSubscriptionTypeDisplayName ?? cab.ozonSubscriptionType ?? null
}

export function getOzonSellerSubscriptionColor(cab: CabinetDto): OzonSubscriptionTagColor {
  if (cab.ozonSubscriptionType === 'INCONCLUSIVE') {
    return 'orange'
  }
  if (cab.ozonSubscriptionIsPremium === false || cab.ozonSubscriptionType === 'UNSPECIFIED') {
    return 'default'
  }
  if (cab.ozonSubscriptionType === 'PREMIUM_PLUS' || cab.ozonSubscriptionType === 'PREMIUM_PRO') {
    return 'purple'
  }
  if (cab.ozonSubscriptionType === 'PREMIUM' || cab.ozonSubscriptionType === 'PREMIUM_LITE') {
    return 'gold'
  }
  return 'default'
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
  if (cab.ozonSubscriptionType === 'INCONCLUSIVE') {
    return 'Базовый Seller API'
  }
  if (cab.ozonSubscriptionIsPremium === false || cab.ozonSubscriptionType === 'UNSPECIFIED') {
    return 'Без Premium'
  }
  if (cab.ozonAnalyticsFunnelAvailable === false) {
    return 'Базовый Seller API'
  }
  return 'Не проверен'
}

export function getOzonAnalyticsApiTierColor(cab: CabinetDto): OzonSubscriptionTagColor {
  if (cab.ozonAnalyticsFunnelAvailable === true) {
    return cab.ozonSubscriptionType === 'PREMIUM_PRO' ? 'purple' : 'purple'
  }
  if (cab.ozonSubscriptionType === 'INCONCLUSIVE') {
    return 'orange'
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
  const detected = cab.ozonSubscriptionTypeDetected ?? '—'
  const override = cab.ozonSubscriptionTypeOverride ?? 'авто'

  const lines = [
    `Подписка Ozon: ${sellerLabel}${cab.ozonSubscriptionManual ? ' (вручную)' : ''}`,
    `Авто из API: ${formatDetectedSubscription(detected)}`,
    `Override: ${override}`,
    `Analytics Seller API: ${apiLabel}`,
  ]

  if (!cab.ozonSubscriptionManual) {
    lines.push(
      'seller/info отдаёт is_premium=true всем кабинетам без type_; Premium в ЛК API не подтверждает.'
    )
  }

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

function formatDetectedSubscription(detected: string): string {
  if (detected === 'UNSPECIFIED') {
    return 'Без Premium'
  }
  if (detected === 'INCONCLUSIVE') {
    return 'Не определено (is_premium без type_)'
  }
  return detected
}
