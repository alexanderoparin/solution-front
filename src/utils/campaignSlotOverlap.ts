import type { CampaignScheduleSlot, CampaignSlotRepeatMode } from '../types/analytics'
import { DAY_LABELS, parseTimeToMinutes } from './campaignSlotTime'

/** Пересечение полуинтервалов [start, end) — конец слота не включается. */
export function slotsTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a = parseTimeToMinutes(startA)
  const b = parseTimeToMinutes(endA)
  const c = parseTimeToMinutes(startB)
  const d = parseTimeToMinutes(endB)
  return a < d && c < b
}

export function resolveRepeatDays(
  dayOfWeek: number,
  repeat: boolean,
  repeatMode: CampaignSlotRepeatMode,
): number[] {
  if (!repeat) return [dayOfWeek]
  switch (repeatMode) {
    case 'DAILY':
      return [1, 2, 3, 4, 5, 6, 7]
    case 'WEEKENDS':
      return [6, 7]
    case 'WEEKDAYS':
      return [1, 2, 3, 4, 5]
    default:
      return [dayOfWeek]
  }
}

export function findOverlappingSlot(
  slots: CampaignScheduleSlot[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeSlotId?: number,
): CampaignScheduleSlot | undefined {
  return slots.find(
    (s) =>
      s.dayOfWeek === dayOfWeek
      && s.id !== excludeSlotId
      && slotsTimeOverlap(startTime, endTime, s.startTime, s.endTime),
  )
}

export function validateSlotNoOverlap(
  slots: CampaignScheduleSlot[],
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  repeat: boolean,
  repeatMode: CampaignSlotRepeatMode,
  excludeSlotId?: number,
): string | null {
  const days = resolveRepeatDays(dayOfWeek, repeat, repeatMode)
  for (const day of days) {
    const conflict = findOverlappingSlot(slots, day, startTime, endTime, excludeSlotId)
    if (conflict) {
      const dayLabel = DAY_LABELS[day - 1] ?? String(day)
      return `Слот пересекается с другим (${conflict.startTime}–${conflict.endTime}, ${dayLabel})`
    }
  }
  return null
}
