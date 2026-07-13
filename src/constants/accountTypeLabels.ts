import type { AccountType } from '../types/api'

/** Подписи типов аккаунта для UI. */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  SELLER: 'Продавец',
  AGENCY: 'Агентство',
  EMPLOYEE: 'Сотрудник',
}

/** Цвет тега Ant Design по типу аккаунта. */
export const ACCOUNT_TYPE_TAG_COLORS: Record<AccountType, string> = {
  SELLER: 'blue',
  AGENCY: 'purple',
  EMPLOYEE: 'green',
}

export function accountTypeLabel(type: AccountType): string {
  return ACCOUNT_TYPE_LABELS[type] ?? type
}
