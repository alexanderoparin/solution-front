/** Режим экрана управления (админ / менеджер). */
export const USER_MANAGEMENT_VIEW = {
  USERS: 'users',
  CABINETS: 'cabinets',
} as const

export type UserManagementView = (typeof USER_MANAGEMENT_VIEW)[keyof typeof USER_MANAGEMENT_VIEW]
