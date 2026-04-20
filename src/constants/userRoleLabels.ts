import type { UserRole } from '../types/api'

/** Подписи ролей для UI (таблицы, профиль, формы). */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  SELLER: 'Продавец',
  WORKER: 'Работник',
}

/** Цвет тега Ant Design по роли. */
export const USER_ROLE_TAG_COLORS: Record<UserRole, string> = {
  ADMIN: 'red',
  MANAGER: 'purple',
  SELLER: 'blue',
  WORKER: 'green',
}

export function userRoleLabel(role: string): string {
  return USER_ROLE_LABELS[role as UserRole] ?? role
}
