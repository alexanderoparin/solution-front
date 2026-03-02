/** Отображаемое название статуса платежа по-русски */
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'В ожидании',
  success: 'Успешно',
  failed: 'Ошибка',
  refunded: 'Возврат',
}

/** Отображаемое название статуса подписки по-русски */
const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: 'Активна',
  expired: 'Истекла',
  cancelled: 'Отменена',
  trial: 'Пробный',
}

export function getPaymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status
}

export function getSubscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS[status] ?? status
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'green'
    case 'pending':
      return 'blue'
    case 'failed':
      return 'red'
    case 'refunded':
      return 'orange'
    default:
      return 'default'
  }
}
