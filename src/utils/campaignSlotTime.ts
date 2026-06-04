/** Шаг расписания слотов (минуты). */
export const SLOT_STEP_MINUTES = 30

const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}
TIME_OPTIONS.push('24:00')

export function listTimeOptions(): string[] {
  return TIME_OPTIONS.filter((t) => t !== '24:00')
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function formatMinutesToTime(minutes: number): string {
  const snapped = snapMinutes(minutes)
  if (snapped >= 24 * 60) return '24:00'
  const h = Math.floor(snapped / 60)
  const m = snapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES
}

export function snapTimeString(time: string): string {
  return formatMinutesToTime(parseTimeToMinutes(time))
}

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const
