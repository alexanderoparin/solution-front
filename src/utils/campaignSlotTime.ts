/** Шаг расписания слотов (минуты). */
export const SLOT_STEP_MINUTES = 30

/** Крайнее время окончания слота в сутках. */
export const END_OF_DAY_TIME = '23:59'

const END_OF_DAY_MINUTES = 24 * 60

const TIME_OPTIONS: string[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

/** Варианты времени начала слота (шаг 30 мин, до 23:30). */
export function listStartTimeOptions(): string[] {
  return [...TIME_OPTIONS]
}

/** Варианты времени окончания слота (шаг 30 мин + 23:59 — конец суток). */
export function listEndTimeOptions(): string[] {
  return [...TIME_OPTIONS, END_OF_DAY_TIME]
}

/** @deprecated используйте listStartTimeOptions */
export function listTimeOptions(): string[] {
  return listStartTimeOptions()
}

export function parseTimeToMinutes(time: string): number {
  if (time === END_OF_DAY_TIME) return END_OF_DAY_MINUTES
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function formatMinutesToTime(minutes: number): string {
  const snapped = snapMinutes(minutes)
  if (snapped >= END_OF_DAY_MINUTES) return END_OF_DAY_TIME
  const h = Math.floor(snapped / 60)
  const m = snapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function snapMinutes(minutes: number): number {
  if (minutes >= END_OF_DAY_MINUTES) return END_OF_DAY_MINUTES
  return Math.round(minutes / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES
}

export function snapTimeString(time: string): string {
  if (time === END_OF_DAY_TIME) return END_OF_DAY_TIME
  return formatMinutesToTime(parseTimeToMinutes(time))
}

export const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const
