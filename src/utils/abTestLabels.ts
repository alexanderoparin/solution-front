import dayjs from 'dayjs'
import type { AbTest } from '../types/abTest'

/** Подпись интервала ротации (как в форме создания). */
export function formatRotationInterval(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  return minutes < 60 ? `${minutes} мин` : `${minutes / 60} ч`
}

/** Значение «Периодичность ротации». */
export function formatRotationSummary(item: AbTest): string {
  if (item.rotationMode === 'ROTATION_BY_VIEWS') {
    return `каждые ${item.rotationViewsThreshold ?? '—'} показов`
  }
  return `каждые ${formatRotationInterval(item.rotationIntervalMinutes)}`
}

/** Значение «Когда остановить тест». */
export function formatStopSummary(item: AbTest): string {
  if (item.stopMode === 'TRUST_US') {
    return 'доверить Clicki'
  }
  const days = item.durationDays != null ? `${item.durationDays} дн.` : '—'
  const until = item.endsAt ? ` · до ${dayjs(item.endsAt).format('DD.MM.YYYY')}` : ''
  return `${days}${until}`
}

/** Значение «По завершении». */
export function formatFinishSummary(item: AbTest): string {
  return item.finishAction === 'KEEP_WINNER' ? 'оставить победителя' : 'вернуть исходное'
}

/** Короткая строка для карточки списка. */
export function formatRotationLabel(item: AbTest): string {
  return `Ротация: ${formatRotationSummary(item)}`
}

/** Короткая строка для карточки списка. */
export function formatStopLabel(item: AbTest): string {
  return `Стоп: ${formatStopSummary(item)}`
}

/** Короткая строка для карточки списка. */
export function formatFinishLabel(item: AbTest): string {
  return `По завершении: ${formatFinishSummary(item)}`
}
