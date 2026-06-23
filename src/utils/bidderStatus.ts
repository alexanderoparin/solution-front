/** Статус автоматики биддера (расписание), не путать со статусом РК в WB. */
export type BidderStatus =
  | 'OFF'
  | 'WAITING'
  | 'RUNNING'
  | 'SLOT_LIMIT'
  | 'NO_ACCESS'
  | 'NO_SLOTS'

const BIDDER_STATUS_LABELS: Record<BidderStatus, string> = {
  OFF: 'Выкл',
  WAITING: 'Ожидает слот',
  RUNNING: 'Работает',
  SLOT_LIMIT: 'Лимит слота',
  NO_ACCESS: 'Нет доступа',
  NO_SLOTS: 'Нет слотов',
}

const BIDDER_STATUS_COLORS: Record<BidderStatus, string> = {
  OFF: '#94a3b8',
  WAITING: '#7c3aed',
  RUNNING: '#16a34a',
  SLOT_LIMIT: '#ea580c',
  NO_ACCESS: '#dc2626',
  NO_SLOTS: '#64748b',
}

export function parseBidderStatus(value: string | null | undefined): BidderStatus | null {
  if (value == null || value === '') return null
  if (value in BIDDER_STATUS_LABELS) return value as BidderStatus
  return null
}

export function bidderStatusLabel(status: BidderStatus | string | null | undefined): string {
  const parsed = typeof status === 'string' ? parseBidderStatus(status) : status
  if (parsed == null) return '—'
  return BIDDER_STATUS_LABELS[parsed]
}

export function bidderStatusColor(status: BidderStatus | string | null | undefined): string {
  const parsed = typeof status === 'string' ? parseBidderStatus(status) : status
  if (parsed == null) return '#94a3b8'
  return BIDDER_STATUS_COLORS[parsed]
}

export function bidderStatusIcon(status: BidderStatus | string | null | undefined): string {
  const parsed = typeof status === 'string' ? parseBidderStatus(status) : status
  if (parsed === 'RUNNING') return '▷ '
  if (parsed === 'OFF' || parsed === 'SLOT_LIMIT') return 'II '
  return ''
}
