/** Поля сортировки списка кабинетов (совпадают с бэкендом ManagedCabinetSortField). */
export const CABINET_SORT_FIELDS = {
  CABINET_ID: 'cabinetId',
  CABINET_NAME: 'cabinetName',
  SELLER_EMAIL: 'sellerEmail',
  LAST_DATA_UPDATE_AT: 'lastDataUpdateAt',
  LAST_STOCKS_UPDATE_AT: 'lastStocksUpdateAt',
} as const

export type CabinetSortField = (typeof CABINET_SORT_FIELDS)[keyof typeof CABINET_SORT_FIELDS]
