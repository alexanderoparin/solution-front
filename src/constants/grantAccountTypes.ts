import type { AccountType } from '../types/api'

/** Типы аккаунта, которые владелец может назначить при выдаче доступа. */
export const GRANT_ACCOUNT_TYPE_OPTIONS: { value: Extract<AccountType, 'AGENCY' | 'EMPLOYEE'>; label: string }[] = [
  { value: 'EMPLOYEE', label: 'Сотрудник' },
  { value: 'AGENCY', label: 'Агентство' },
]
