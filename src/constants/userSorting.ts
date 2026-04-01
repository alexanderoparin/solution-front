export const USER_SORT_FIELDS = {
  EMAIL: 'email',
  ROLE: 'role',
  IS_ACTIVE: 'isActive',
  CREATED_AT: 'createdAt',
  LAST_DATA_UPDATE_AT: 'lastDataUpdateAt',
  LAST_DATA_UPDATE_REQUESTED_AT: 'lastDataUpdateRequestedAt',
} as const

export type UserSortField = typeof USER_SORT_FIELDS[keyof typeof USER_SORT_FIELDS]

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const

export type SortDirection = typeof SORT_DIRECTIONS[keyof typeof SORT_DIRECTIONS]
